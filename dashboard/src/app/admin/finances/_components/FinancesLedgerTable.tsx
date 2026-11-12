'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Loader2, Clock, CheckCircle2, Send } from 'lucide-react';
import {
  itemVariants,
  formatCurrency,
  type MonthOption,
  type EmailQueueState,
} from './types';

interface FinancesLedgerTableProps {
  invoicesMonth: string;
  setInvoicesMonth: (m: string) => void;
  invoicesDataObj: any;
  invoicesItems: any[];
  finEmailQueueStates: Record<string, EmailQueueState>;
  finDispatchingIds: Record<string, boolean>;
  handleSendFinInvoiceEmail: (invoiceIds: string[]) => void;
  availableMonths: MonthOption[];
}

export default function FinancesLedgerTable({
  invoicesMonth,
  setInvoicesMonth,
  invoicesDataObj,
  invoicesItems,
  finEmailQueueStates,
  finDispatchingIds,
  handleSendFinInvoiceEmail,
  availableMonths,
}: FinancesLedgerTableProps) {
  return (
    <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6">
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-500" /> Partner Invoices & Payouts
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#71717a]">
              Accrued commissions vs recorded disbursements
            </p>
          </div>

          <select
            value={invoicesMonth}
            onChange={(e) => setInvoicesMonth(e.target.value)}
            className="bg-slate-50 dark:bg-[#1a1b24] text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl px-2.5 py-1.5 border border-slate-200 dark:border-[#282a36] focus:outline-hidden cursor-pointer"
          >
            {availableMonths.map((m) => (
              <option key={m.key} value={m.key}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {invoicesItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#222430] text-slate-400 font-semibold">
                  <th className="py-2 px-2">Partner</th>
                  <th className="py-2 px-2">Invoice #</th>
                  <th className="py-2 px-2 text-right">Amount</th>
                  <th className="py-2 px-2 text-center">Status</th>
                  <th className="py-2 px-2 text-right">Email PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c]">
                {invoicesItems.map((inv: any) => {
                  const qSt = finEmailQueueStates[inv.id];
                  const isClicking = Boolean(finDispatchingIds[inv.id]);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1a1b24]/40">
                      <td className="py-2.5 px-2 font-bold text-slate-800 dark:text-slate-200">
                        {inv.partner_name}
                      </td>
                      <td className="py-2.5 px-2 font-mono text-slate-500">{inv.invoice_number}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(Number(inv.commission_amount || 0))}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            inv.status === 'PAID'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right">
                        {isClicking || qSt?.status === 'SENDING' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 text-[10.5px] font-bold">
                            <Loader2 className="w-3 h-3 animate-spin" /> Sending...
                          </span>
                        ) : qSt?.status === 'QUEUED' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[10.5px] font-bold">
                            <Clock className="w-3 h-3 animate-pulse" /> Queued #{qSt.queuePosition || 1}
                          </span>
                        ) : qSt?.status === 'SENT' ? (
                          <button
                            type="button"
                            onClick={() => handleSendFinInvoiceEmail([inv.id])}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-[10.5px] font-bold cursor-pointer transition"
                            title="Email with PDF sent. Click to resend."
                          >
                            <CheckCircle2 className="w-3 h-3" /> Sent
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendFinInvoiceEmail([inv.id])}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60 dark:border-indigo-800/60 text-[10.5px] font-bold cursor-pointer transition"
                            title="Queue email with PDF attachment to partner"
                          >
                            <Send className="w-3 h-3" /> Send Email
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-[#242634] rounded-xl">
            No partner invoices found for {invoicesDataObj.monthName || invoicesMonth}. Click &quot;Back-Order Invoice&quot; above to generate on-demand.
          </div>
        )}
      </div>
    </motion.div>
  );
}
