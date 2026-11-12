'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Check, Copy, Trash2 } from 'lucide-react';
import { type OrgDetail } from './types';

interface OrgContactsTabProps {
  org: OrgDetail;
  copiedId: string | null;
  handleCopy: (text: string, id: string, e: React.MouseEvent) => void;
  setShowAddContactModal: (show: boolean) => void;
  setContactToDelete: (contact: { id: string; name: string } | null) => void;
}

export function OrgContactsTab({
  org,
  copiedId,
  handleCopy,
  setShowAddContactModal,
  setContactToDelete,
}: OrgContactsTabProps) {
  return (
    <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl overflow-hidden shadow-xs">
      <div className="p-4 border-b border-slate-200 dark:border-[#222430] flex items-center justify-between">
        <div>
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Contact List</h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Authorized contacts with portal access for {org.name}.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setShowAddContactModal(true)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Add Contact</span>
        </motion.button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 dark:bg-[#111217] text-slate-500 dark:text-slate-400 uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Name</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Email</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Phone</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Role</th>
              <th className="py-3 px-4 font-bold whitespace-nowrap">Status</th>
              <th className="py-3 px-4 font-bold text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#222430]">
            {org.contacts?.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                  No contacts listed yet.
                </td>
              </tr>
            ) : (
              org.contacts?.map((contact: any) => (
                <tr key={contact.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181920] transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span>{contact.name}</span>
                      {contact.is_primary && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400">
                          Primary
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {contact.email}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                    {contact.phone}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {contact.role}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10.5px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {contact.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => handleCopy(contact.email, `c-email-${contact.id}`, e)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                        title="Copy Email"
                      >
                        {copiedId === `c-email-${contact.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => setContactToDelete({ id: contact.id, name: contact.name })}
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                        title="Remove Contact"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
