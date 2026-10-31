import { generatePartnerInvoicePdfBuffer } from '@/lib/partners/invoice-pdf';
import { sendPartnerInvoiceEmail } from '@/lib/email/mailer';
import { logAuditEvent } from '@/lib/audit/logger';

export type EmailJobStatus = 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';

export interface PartnerInvoiceQueuePayload {
  invoiceId: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  totalProperties: number;
  grossRevenue: number;
  commissionAmount: number;
  notes?: string;
  createdAt?: string;
  partnerId?: string;
  partnerName: string;
  partnerEmail: string;
  partnerPhone?: string | null;
  partnerCompanyName?: string | null;
  lineItems: Array<{
    property_id?: string;
    property_name: string;
    address?: string;
    property_location?: string;
    monthly_price: number;
    commission_rate: number;
    commission_amount: number;
  }>;
  triggerSource?: 'MONTHLY_AUTO' | 'MANUAL_SINGLE' | 'MANUAL_BULK' | 'BACKORDER';
}

export interface EmailQueueJobState {
  invoiceId: string;
  invoiceNumber: string;
  partnerName: string;
  partnerEmail: string;
  status: EmailJobStatus;
  queuePosition?: number;
  queuedAt: string;
  sentAt?: string;
  error?: string;
  messageId?: string;
  triggerSource?: string;
}

interface InternalQueueState {
  queue: PartnerInvoiceQueuePayload[];
  states: Map<string, EmailQueueJobState>;
  isProcessing: boolean;
}

// Persist across Next.js hot reloads in development and warm serverless instances
const globalForEmailQueue = globalThis as unknown as {
  __partnerInvoiceEmailQueue?: InternalQueueState;
};

function getQueueStore(): InternalQueueState {
  if (!globalForEmailQueue.__partnerInvoiceEmailQueue) {
    globalForEmailQueue.__partnerInvoiceEmailQueue = {
      queue: [],
      states: new Map<string, EmailQueueJobState>(),
      isProcessing: false,
    };
  }
  return globalForEmailQueue.__partnerInvoiceEmailQueue;
}

const INTER_EMAIL_DELAY_MS = 1800; // 1.8s sequential delay between consecutive emails

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function refreshQueuePositions() {
  const store = getQueueStore();
  store.queue.forEach((job, index) => {
    const existing = store.states.get(job.invoiceId);
    if (existing && existing.status === 'QUEUED') {
      existing.queuePosition = index + 1;
    }
  });
}

async function processQueueLoop(): Promise<void> {
  const store = getQueueStore();
  if (store.isProcessing) {
    return;
  }

  store.isProcessing = true;

  try {
    while (store.queue.length > 0) {
      const currentJob = store.queue.shift();
      if (!currentJob) break;

      refreshQueuePositions();

      const currentState = store.states.get(currentJob.invoiceId);
      if (currentState) {
        currentState.status = 'SENDING';
        currentState.queuePosition = 0;
        currentState.error = undefined;
      }

      try {
        // 1. Generate official PDF attachment buffer in memory
        const pdfBuffer = await generatePartnerInvoicePdfBuffer({
          invoice_number: currentJob.invoiceNumber,
          created_at: currentJob.createdAt,
          period_start: currentJob.periodStart,
          period_end: currentJob.periodEnd,
          status: currentJob.status,
          total_properties: currentJob.totalProperties,
          gross_revenue: currentJob.grossRevenue,
          commission_amount: currentJob.commissionAmount,
          notes: currentJob.notes,
          partner: {
            name: currentJob.partnerName,
            email: currentJob.partnerEmail,
            phone: currentJob.partnerPhone,
            company_name: currentJob.partnerCompanyName,
          },
          line_items: currentJob.lineItems || [],
        });

        // 2. Dispatch email with PDF attachment
        const mailResult = await sendPartnerInvoiceEmail({
          invoiceId: currentJob.invoiceId,
          invoiceNumber: currentJob.invoiceNumber,
          periodStart: currentJob.periodStart,
          periodEnd: currentJob.periodEnd,
          status: currentJob.status,
          totalProperties: currentJob.totalProperties,
          grossRevenue: currentJob.grossRevenue,
          commissionAmount: currentJob.commissionAmount,
          notes: currentJob.notes,
          createdAt: currentJob.createdAt,
          partnerName: currentJob.partnerName,
          partnerEmail: currentJob.partnerEmail,
          partnerPhone: currentJob.partnerPhone,
          partnerCompanyName: currentJob.partnerCompanyName,
          lineItems: currentJob.lineItems || [],
          pdfBuffer,
        });

        if (mailResult.success) {
          const nowIso = new Date().toISOString();
          store.states.set(currentJob.invoiceId, {
            invoiceId: currentJob.invoiceId,
            invoiceNumber: currentJob.invoiceNumber,
            partnerName: currentJob.partnerName,
            partnerEmail: currentJob.partnerEmail,
            status: 'SENT',
            queuedAt: currentState?.queuedAt || nowIso,
            sentAt: nowIso,
            messageId: mailResult.messageId,
            triggerSource: currentJob.triggerSource,
          });

          try {
            await logAuditEvent({
              action: 'PARTNER_INVOICE_EMAIL_SENT',
              entity_type: 'PARTNER_INVOICE',
              entity_id: currentJob.invoiceId,
              entity_name: currentJob.invoiceNumber,
              changes: {
                recipient_email: currentJob.partnerEmail,
                partner_name: currentJob.partnerName,
                period: `${currentJob.periodStart} to ${currentJob.periodEnd}`,
                commission_amount: currentJob.commissionAmount,
                attachment: `${currentJob.invoiceNumber}.pdf`,
                trigger_source: currentJob.triggerSource || 'MANUAL_SINGLE',
              },
            });
          } catch {
            // Non-blocking audit log
          }
        } else {
          store.states.set(currentJob.invoiceId, {
            invoiceId: currentJob.invoiceId,
            invoiceNumber: currentJob.invoiceNumber,
            partnerName: currentJob.partnerName,
            partnerEmail: currentJob.partnerEmail,
            status: 'FAILED',
            queuedAt: currentState?.queuedAt || new Date().toISOString(),
            error: String(mailResult.error || 'Failed to send email via SMTP'),
            triggerSource: currentJob.triggerSource,
          });
        }
      } catch (jobErr: any) {
        console.error('[Partner Invoice Email Queue] Error processing job:', currentJob.invoiceNumber, jobErr);
        store.states.set(currentJob.invoiceId, {
          invoiceId: currentJob.invoiceId,
          invoiceNumber: currentJob.invoiceNumber,
          partnerName: currentJob.partnerName,
          partnerEmail: currentJob.partnerEmail,
          status: 'FAILED',
          queuedAt: currentState?.queuedAt || new Date().toISOString(),
          error: jobErr?.message || 'Unexpected error during PDF/Email dispatch',
          triggerSource: currentJob.triggerSource,
        });
      }

      // If more emails remain in the queue, wait before sending the next one
      if (store.queue.length > 0) {
        await sleep(INTER_EMAIL_DELAY_MS);
      }
    }
  } finally {
    store.isProcessing = false;
  }
}

/**
 * Enqueues one or more partner invoices for sequential one-by-one email delivery with PDF attachments.
 */
export function enqueuePartnerInvoiceEmails(
  payloads: PartnerInvoiceQueuePayload[],
  options?: { waitForCompletion?: boolean }
): {
  queuedCount: number;
  alreadyQueuedCount: number;
  queueLength: number;
  states: EmailQueueJobState[];
  completionPromise: Promise<void>;
} {
  const store = getQueueStore();
  let queuedCount = 0;
  let alreadyQueuedCount = 0;
  const affectedStates: EmailQueueJobState[] = [];

  for (const payload of payloads) {
    if (!payload.partnerEmail || !payload.partnerEmail.includes('@')) {
      const failState: EmailQueueJobState = {
        invoiceId: payload.invoiceId,
        invoiceNumber: payload.invoiceNumber,
        partnerName: payload.partnerName,
        partnerEmail: payload.partnerEmail || '',
        status: 'FAILED',
        queuedAt: new Date().toISOString(),
        error: 'Partner does not have a valid email address.',
        triggerSource: payload.triggerSource,
      };
      store.states.set(payload.invoiceId, failState);
      affectedStates.push(failState);
      continue;
    }

    const existingState = store.states.get(payload.invoiceId);
    if (existingState && (existingState.status === 'QUEUED' || existingState.status === 'SENDING')) {
      alreadyQueuedCount++;
      affectedStates.push(existingState);
      continue;
    }

    store.queue.push(payload);
    queuedCount++;

    const newState: EmailQueueJobState = {
      invoiceId: payload.invoiceId,
      invoiceNumber: payload.invoiceNumber,
      partnerName: payload.partnerName,
      partnerEmail: payload.partnerEmail,
      status: 'QUEUED',
      queuePosition: store.queue.length,
      queuedAt: new Date().toISOString(),
      triggerSource: payload.triggerSource,
    };

    store.states.set(payload.invoiceId, newState);
    affectedStates.push(newState);
  }

  refreshQueuePositions();

  // Trigger the sequential processor asynchronously (or await if requested by cron)
  const completionPromise = processQueueLoop();

  return {
    queuedCount,
    alreadyQueuedCount,
    queueLength: store.queue.length,
    states: affectedStates,
    completionPromise,
  };
}

export function getInvoiceEmailQueueSnapshot() {
  const store = getQueueStore();
  refreshQueuePositions();

  const statesObj: Record<string, EmailQueueJobState> = {};
  for (const [id, st] of store.states.entries()) {
    statesObj[id] = st;
  }

  return {
    isProcessing: store.isProcessing,
    pendingCount: store.queue.length,
    states: statesObj,
  };
}

