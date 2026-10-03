import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateMonthlyPartnerInvoices } from '@/lib/partners/monthly-invoices';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const adminClient = createAdminClient();
    const db = adminClient || supabase;

    const { searchParams } = new URL(request.url);
    const requestedPartnerId = searchParams.get('partner_id');

    const {
      data: { user },
      error: authErr,
    } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is Super Admin
    const { data: userProfile } = await db
      .from('profiles')
      .select('id, role, email, full_name')
      .eq('id', user.id)
      .maybeSingle();

    const isInternalAdmin = userProfile?.role === 'SUPER_ADMIN' || userProfile?.role === 'SUB_SUPER_ADMIN';

    let partner: any = null;

    // 1. If internal admin requested a specific partner to inspect
    if (isInternalAdmin && requestedPartnerId) {
      const { data } = await db.from('partners').select('*').eq('id', requestedPartnerId).maybeSingle();
      if (data) partner = data;
    }

    // 2. Strict tenant lookup for the logged-in partner user
    if (!partner) {
      const { data: byUserId } = await db.from('partners').select('*').eq('user_id', user.id).maybeSingle();
      if (byUserId) {
        partner = byUserId;
      } else {
        const userEmail = (user.email || userProfile?.email || '').trim().toLowerCase();
        if (userEmail) {
          const { data: byEmail } = await db.from('partners').select('*').ilike('email', userEmail).maybeSingle();
          if (byEmail) {
            partner = byEmail;
            // Auto-link partner record with the user's UUID if not already linked
            if (byEmail.user_id !== user.id) {
              await db.from('partners').update({ user_id: user.id, updated_at: new Date().toISOString() }).eq('id', byEmail.id);
            }
          }
        }
      }
    }

    // If no partner is bound to this user, return clean empty tenant state (DO NOT expose other partners)
    if (!partner) {
      return NextResponse.json({
        success: true,
        data: {
          partner: {
            name: userProfile?.full_name || user.user_metadata?.full_name || 'Partner Account',
            company_name: null,
            email: user.email || '',
            default_commission_rate: 10.0,
            status: 'ACTIVE',
            is_unlinked: true,
          },
          metrics: {
            totalEarned: 0,
            monthlyRunRate: 0,
            activePropertiesCount: 0,
            totalGrossRevenue: 0,
            pendingPayout: 0,
          },
          recentInvoices: [],
        },
      });
    }

    // Ensure this partner's monthly gross revenue invoice for the current month exists
    try {
      await generateMonthlyPartnerInvoices();
    } catch (genErr) {
      console.warn('[Partner Overview] Monthly invoice generation notice:', genErr);
    }

    // Fetch STRICTLY properties assigned to THIS partner
    const { data: assignedProps } = await db
      .from('properties')
      .select('id, name, address, city, state, zip_code, main_phone, monthly_price, partner_id, partner_commission_override, status')
      .eq('partner_id', partner.id)
      .order('name', { ascending: true });

    const properties = assignedProps || [];

    // Calculate Partner Metrics Strictly for this Partner
    const totalGross = properties.reduce((sum, p) => sum + Number(p.monthly_price || 0), 0);
    const defaultRate = Number(partner.default_commission_rate || 10);

    const monthlyRunRate = properties.reduce((sum, p) => {
      const rate =
        p.partner_commission_override !== null &&
        p.partner_commission_override !== undefined &&
        p.partner_commission_override !== ''
          ? Number(p.partner_commission_override)
          : defaultRate;
      return sum + Number(p.monthly_price || 0) * (rate / 100);
    }, 0);

    // Fetch STRICTLY this partner's invoices
    const { data: invoices } = await db
      .from('partner_invoices')
      .select('*')
      .eq('partner_id', partner.id)
      .order('created_at', { ascending: false });

    const allInvoices = invoices || [];
    const totalEarned = allInvoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + Number(inv.commission_amount || 0), 0);

    const pendingPayout = allInvoices
      .filter((inv) => inv.status === 'APPROVED' || inv.status === 'SUBMITTED')
      .reduce((sum, inv) => sum + Number(inv.commission_amount || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        partner,
        metrics: {
          totalEarned: Math.round(totalEarned * 100) / 100,
          monthlyRunRate: Math.round(monthlyRunRate * 100) / 100,
          activePropertiesCount: properties.length,
          totalGrossRevenue: Math.round(totalGross * 100) / 100,
          pendingPayout: Math.round(pendingPayout * 100) / 100,
        },
        recentInvoices: allInvoices.slice(0, 5),
      },
    });
  } catch (err: any) {
    console.error('Partner overview API error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error' }, { status: 500 });
  }
}
