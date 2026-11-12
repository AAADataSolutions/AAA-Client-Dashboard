'use client';

import React from 'react';
import {
  Loader2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Send,
} from 'lucide-react';
import { PartnerInvoiceItem, EmailQueueState } from './types';

interface InvoiceEmailButtonProps {
  inv: PartnerInvoiceItem;
  compact?: boolean;
  emailQueueStates: Record<string, EmailQueueState>;
  dispatchingEmailIds: Record<string, boolean>;
  onSendInvoiceEmail: (invoiceIds: string[], contextLabel?: string) => void;
}

export default function InvoiceEmailButton({
  inv,
  compact = false,
  emailQueueStates,
  dispatchingEmailIds,
  onSendInvoiceEmail,
}: InvoiceEmailButtonProps) {
  const qState = emailQueueStates[inv.id];
  const isClicking = Boolean(dispatchingEmailIds[inv.id]);
  const isQueued = qState?.status === 'QUEUED';
  const isSending = qState?.status === 'SENDING';
  const isSent = qState?.status === 'SENT';
  const isFailed = qState?.status === 'FAILED';

  if (isClicking || isSending) {
    return (
      <button
        disabled
        className={`${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'} bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 opacity-90 cursor-wait`}
        title="Generating PDF & Sending Email..."
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>{compact ? 'Sending...' : 'Sending PDF...'}</span>
      </button>
    );
  }

  if (isQueued) {
    return (
      <button
        disabled
        className={`${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'} bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 cursor-wait`}
        title="Waiting in sequential email queue..."
      >
        <Clock className="w-3.5 h-3.5 animate-pulse" />
        <span>Queued {qState.queuePosition ? `#${qState.queuePosition}` : ''}</span>
      </button>
    );
  }

  if (isSent) {
    return (
      <button
        onClick={() => onSendInvoiceEmail([inv.id], inv.invoice_number)}
        className={`${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'} bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer`}
        title={`Sent to ${inv.partner?.email || 'partner'}. Click to resend email with PDF.`}
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>{compact ? 'Sent' : 'Sent · Resend'}</span>
      </button>
    );
  }

  if (isFailed) {
    return (
      <button
        onClick={() => onSendInvoiceEmail([inv.id], inv.invoice_number)}
        className={`${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'} bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer`}
        title={qState?.error || 'Failed to send email. Click to retry.'}
      >
        <AlertCircle className="w-3.5 h-3.5" />
        <span>{compact ? 'Retry' : 'Retry Email'}</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => onSendInvoiceEmail([inv.id], inv.invoice_number)}
      className={`${compact ? 'px-2.5 py-1' : 'px-3 py-1.5'} bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 rounded-lg font-bold text-xs inline-flex items-center gap-1.5 transition cursor-pointer`}
      title={`Send invoice ${inv.invoice_number} with PDF attachment to ${inv.partner?.email || 'partner'}`}
    >
      <Send className="w-3.5 h-3.5" />
      <span>{compact ? 'Email' : 'Send Email'}</span>
    </button>
  );
}
