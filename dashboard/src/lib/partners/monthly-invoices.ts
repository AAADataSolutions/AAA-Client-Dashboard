import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { enqueuePartnerInvoiceEmails, PartnerInvoiceQueuePayload } from '@/lib/email/email-queue';
import crypto from 'crypto';

export interface MonthlyInvoiceResult {
  generated: number;
  skipped: number;
  emailsQueued: number;
  totalPartners: number;
  periodStart: string;
  periodEnd: string;
  invoices: any[];
  errors: string[];
}

/**
 * Automatically computes monthly gross value and generates SUBMITTED partner invoices
 * for all active partners based on their assigned active properties and commission rates.
 * Runs seamlessly on the 1st of each month or on-demand without duplicating existing invoices,
 * and automatically queues invoice emails (with attached PDF) one by one for newly generated invoices.
 */
export async function generateMonthlyPartnerInvoices(
  targetDate?: Date,
  options?: { sendEmails?: boolean; waitForEmails?: boolean }
): Promise<MonthlyInvoiceResult> {
  const shouldSendEmails = options?.sendEmails !== false; // default true
  const date = targetDate || new Date();
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth(); // 0-indexed (strictly UTC)

  // Format period_start (YYYY-MM-01) and period_end (Last day of month) in UTC
  const startDate = new Date(Date.UTC(year, month, 1));
  const endDate = new Date(Date.UTC(year, month + 1, 0));

  const periodStart = startDate.toISOString().split('T')[0];
  const periodEnd = endDate.toISOString().split('T')[0];
  const monthCode = `${year}${String(month + 1).padStart(2, '0')}`;

  const adminClient = createAdminClient();
  const supabase = adminClient || (await createClient());

  const result: MonthlyInvoiceResult = {
    generated: 0,
    skipped: 0,
    emailsQueued: 0,
    totalPartners: 0,
    periodStart,
    periodEnd,
    invoices: [],
    errors: [],
  };

  try {
    // 1. Fetch all active partners
    const { data: partners, error: partnersErr } = await supabase
      .from('partners')
      .select('*')
      .eq('status', 'ACTIVE');

    if (partnersErr) {
      result.errors.push(`Failed to fetch partners: ${partnersErr.message}`);
      return result;
    }

    if (!partners || partners.length === 0) {
      return result;
    }

    result.totalPartners = partners.length;

    // 2. Fetch all properties assigned to partners
    const { data: properties, error: propsErr } = await supabase
      .from('properties')
      .select('id, name, address, city, state, monthly_price, partner_id, partner_commission_override, status, onboarding_date, created_at');

    if (propsErr) {
      result.errors.push(`Failed to fetch properties: ${propsErr.message}`);
      return result;
    }

    const allProps = properties || [];

    // 3. Fetch existing invoices for this billing period to prevent duplicate generation
    const { data: existingInvoices, error: invErr } = await supabase
      .from('partner_invoices')
      .select('id, partner_id, invoice_number, period_start')
      .eq('period_start', periodStart);

    if (invErr) {
      console.warn('Could not query existing invoices:', invErr.message);
    }

    const existingMap = new Set((existingInvoices || []).map((inv: any) => inv.partner_id));
    const periodStartMonth = periodStart.substring(0, 7);
    const emailJobsToQueue: PartnerInvoiceQueuePayload[] = [];

    // 4. Process each active partner
    for (const partner of partners) {
      try {
        if (existingMap.has(partner.id)) {
          result.skipped++;
          continue;
        }

        // Find all properties assigned to this partner
        const assignedProps = allProps.filter((p: any) => p.partner_id === partner.id);

        // If partner has no assigned properties, skip invoice generation
        if (assignedProps.length === 0) {
          result.skipped++;
          continue;
        }

        // Calculate gross revenue and itemized commission
        const defaultRate = Number(partner.default_commission_rate || 10);
        let grossRevenue = 0;
        let totalCommission = 0;

        const lineItems = assignedProps.map((p: any) => {
          const rate =
            p.partner_commission_override !== null &&
            p.partner_commission_override !== undefined &&
            p.partner_commission_override !== ''
              ? Number(p.partner_commission_override)
              : defaultRate;

          const price = Number(p.monthly_price || 0);
          const commission = price * (rate / 100);

          grossRevenue += price;
          totalCommission += commission;

          return {
            property_id: p.id,
            property_name: p.name,
            address: [p.address, p.city, p.state].filter(Boolean).join(', '),
            monthly_price: price,
            commission_rate: rate,
            commission_amount: commission,
          };
        });

        // Generate clean unique invoice number: INV-<PARTNER_SLUG>-<YYYYMM>-<RANDOM>
        const rawSlug = (partner.company_name || partner.name || 'PTR')
          .replace(/[^a-zA-Z0-9]/g, '')
          .substring(0, 5)
          .toUpperCase();
        const randHex = crypto.randomBytes(2).toString('hex').toUpperCase();
        const invoiceNumber = `INV-${rawSlug || 'PTR'}-${monthCode}-${randHex}`;

        const newInvoicePayload = {
          partner_id: partner.id,
          invoice_number: invoiceNumber,
          period_start: periodStart,
          period_end: periodEnd,
          total_properties: assignedProps.length,
          gross_revenue: Math.round(grossRevenue * 100) / 100,
          commission_amount: Math.round(totalCommission * 100) / 100,
          status: 'SUBMITTED',
          line_items: lineItems,
          notes: `Automated monthly gross revenue & commission invoice for ${startDate.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })}.`,
        };

        const { data: createdInv, error: insertErr } = await supabase
          .from('partner_invoices')
          .insert(newInvoicePayload)
          .select()
          .single();

        if (insertErr) {
          result.errors.push(`Failed to create invoice for partner ${partner.name}: ${insertErr.message}`);
        } else if (createdInv) {
          result.generated++;
          result.invoices.push(createdInv);

          if (shouldSendEmails && partner.email) {
            emailJobsToQueue.push({
              invoiceId: createdInv.id,
              invoiceNumber: createdInv.invoice_number,
              periodStart: createdInv.period_start,
              periodEnd: createdInv.period_end,
              status: createdInv.status,
              totalProperties: createdInv.total_properties,
              grossRevenue: Number(createdInv.gross_revenue || 0),
              commissionAmount: Number(createdInv.commission_amount || 0),
              notes: createdInv.notes,
              createdAt: createdInv.created_at,
              partnerId: partner.id,
              partnerName: partner.name,
              partnerEmail: partner.email,
              partnerPhone: partner.phone,
              partnerCompanyName: partner.company_name,
              lineItems: createdInv.line_items || lineItems,
              triggerSource: 'MONTHLY_AUTO',
            });
          }
        }
      } catch (partnerErr: any) {
        result.errors.push(`Error processing partner ${partner.id}: ${partnerErr.message}`);
      }
    }

    // 5. Enqueue newly generated monthly invoices for one-by-one email delivery with PDF
    if (emailJobsToQueue.length > 0) {
      const queueRes = enqueuePartnerInvoiceEmails(emailJobsToQueue);
      result.emailsQueued = queueRes.queuedCount;

      if (options?.waitForEmails) {
        await queueRes.completionPromise;
      }
    }

    return result;
  } catch (err: any) {
    result.errors.push(`Fatal error in generateMonthlyPartnerInvoices: ${err.message}`);
    return result;
  }
}
