'use client';

import React from 'react';
import { LifeBuoy, Plus } from 'lucide-react';

interface PropertyTicketsTabProps {
  tickets: any[];
  onCreateTicket?: (propertyId: string) => void;
  propertyId: string;
}

export function PropertyTicketsTab({
  tickets = [],
  onCreateTicket,
  propertyId,
}: PropertyTicketsTabProps) {
  const safeTickets = Array.isArray(tickets) ? tickets : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-900 dark:text-white text-xs">
          Property Support Tickets ({safeTickets.length})
        </span>
        {onCreateTicket && (
          <button
            type="button"
            onClick={() => onCreateTicket(propertyId)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition shadow-2xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Ticket</span>
          </button>
        )}
      </div>

      {safeTickets.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
          <LifeBuoy className="w-6 h-6 text-slate-400 mx-auto mb-2 opacity-50" />
          <p className="font-semibold text-slate-800 dark:text-white text-xs">
            No Tickets on Record
          </p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            This property currently has no active or past support tickets.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {safeTickets.map((t: any) => (
            <div
              key={t.id}
              className="p-3.5 rounded-xl bg-white dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] space-y-2 hover:border-slate-300 dark:hover:border-[#2d3040] transition"
            >
              <div className="flex items-center justify-between gap-2">
                <h5 className="font-bold text-slate-900 dark:text-white text-xs truncate max-w-[280px]">
                  {t.subject || 'Support Ticket'}
                </h5>
                <span
                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    t.status === 'RESOLVED' || t.status === 'CLOSED'
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/40'
                      : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40'
                  }`}
                >
                  {t.status || 'OPEN'}
                </span>
              </div>

              {t.description && (
                <p className="text-slate-500 dark:text-slate-400 text-[11px] line-clamp-2">
                  {t.description}
                </p>
              )}

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 dark:border-[#222430]">
                <span>
                  Priority: <strong className="text-slate-700 dark:text-slate-300">{t.priority || 'NORMAL'}</strong>
                </span>
                <span>
                  {t.created_at ? new Date(t.created_at).toLocaleDateString() : ''}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

