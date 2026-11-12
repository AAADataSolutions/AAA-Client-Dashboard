'use client';

import React from 'react';
import {
  Hotel,
  Edit2,
  Trash2,
  AlertCircle,
  Link as LinkIcon,
  X,
  Loader2,
  FileText,
  Copy,
  Check,
  Send,
  ShieldCheck,
  Power,
  PowerOff,
} from 'lucide-react';
import { Partner, PropertyOption, PartnerFormData } from './types';

interface PartnerMenuAndInviteModalsProps {
  menuPosition: {
    top?: number;
    bottom?: number;
    left: number;
    partner: Partner;
  } | null;
  setMenuPosition: (pos: any) => void;
  setSelectedPartner: (p: Partner | null) => void;
  assignForm: { property_id: string; commission_override: string };
  setAssignForm: (f: { property_id: string; commission_override: string }) => void;
  showAssignModal: boolean;
  setShowAssignModal: (show: boolean) => void;
  handleOpenViewProperties: (partner: Partner) => void;
  handleGenerateInviteLink: (partner: Partner) => void;
  handleOpenViewInvoices: (partner: Partner) => void;
  handleTogglePartnerStatus: (partnerId: string, currentStatus: string) => void;
  setFormData: (f: PartnerFormData) => void;
  setShowEditModal: (show: boolean) => void;
  showDeleteModal: boolean;
  setShowDeleteModal: (show: boolean) => void;
  selectedPartner: Partner | null;
  inviteModalData: {
    partnerName: string;
    partnerEmail: string;
    inviteUrl: string | null;
    loading?: boolean;
  } | null;
  setInviteModalData: (d: any) => void;
  copiedInvite: boolean;
  handleCopyInviteUrl: (url: string) => void;
  handleDeletePartner: () => void;
  formLoading: boolean;
  formError: string | null;
  handleAssignPropertySubmit: (e: React.FormEvent) => void;
  allProperties: PropertyOption[];
  isSuperAdmin: boolean;
}

export default function PartnerMenuAndInviteModals({
  menuPosition,
  setMenuPosition,
  setSelectedPartner,
  assignForm,
  setAssignForm,
  showAssignModal,
  setShowAssignModal,
  handleOpenViewProperties,
  handleGenerateInviteLink,
  handleOpenViewInvoices,
  handleTogglePartnerStatus,
  setFormData,
  setShowEditModal,
  showDeleteModal,
  setShowDeleteModal,
  selectedPartner,
  inviteModalData,
  setInviteModalData,
  copiedInvite,
  handleCopyInviteUrl,
  handleDeletePartner,
  formLoading,
  formError,
  handleAssignPropertySubmit,
  allProperties,
  isSuperAdmin,
}: PartnerMenuAndInviteModalsProps) {
  return (
    <>
      {/* THREE-DOTS OVERLAY ACTION MENU */}
      {menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuPosition(null)}
            aria-hidden="true"
          />
          <div
            style={{
              position: 'fixed',
              ...(menuPosition.top !== undefined ? { top: `${menuPosition.top}px` } : {}),
              ...(menuPosition.bottom !== undefined ? { bottom: `${menuPosition.bottom}px` } : {}),
              left: `${menuPosition.left}px`,
            }}
            className="z-50 w-56 rounded-2xl bg-white dark:bg-[#1a1b24] border border-slate-200 dark:border-[#282a36] shadow-2xl py-1.5 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100 font-medium divide-y divide-slate-100 dark:divide-[#242634]"
          >
            <div className="px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wider text-slate-400">
              {menuPosition.partner.name}
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setSelectedPartner(menuPosition.partner);
                  setAssignForm({ property_id: '', commission_override: '' });
                  setShowAssignModal(true);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#222432] flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Assign Properties</span>
              </button>

              <button
                onClick={() => {
                  handleOpenViewProperties(menuPosition.partner);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#222432] flex items-center gap-2 cursor-pointer"
              >
                <Hotel className="w-3.5 h-3.5 text-slate-500" />
                <span>View Assigned Properties ({menuPosition.partner.total_properties_count})</span>
              </button>

              <button
                onClick={() => {
                  handleGenerateInviteLink(menuPosition.partner);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#222432] flex items-center gap-2 cursor-pointer text-emerald-600 dark:text-emerald-400 font-semibold"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Generate Invite Link</span>
              </button>

              <button
                onClick={() => {
                  handleOpenViewInvoices(menuPosition.partner);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#222432] flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>View Invoices &amp; Payouts</span>
              </button>
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  handleTogglePartnerStatus(menuPosition.partner.id, menuPosition.partner.status);
                  setMenuPosition(null);
                }}
                className={`w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#222432] flex items-center gap-2 cursor-pointer font-semibold ${
                  menuPosition.partner.status === 'ACTIVE'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {menuPosition.partner.status === 'ACTIVE' ? (
                  <>
                    <PowerOff className="w-3.5 h-3.5" />
                    <span>Set as Inactive</span>
                  </>
                ) : (
                  <>
                    <Power className="w-3.5 h-3.5" />
                    <span>Set as Active</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setSelectedPartner(menuPosition.partner);
                  setFormData({
                    name: menuPosition.partner.name,
                    email: menuPosition.partner.email,
                    phone: menuPosition.partner.phone || '',
                    company_name: menuPosition.partner.company_name || '',
                    default_commission_rate: menuPosition.partner.default_commission_rate,
                    status: menuPosition.partner.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
                    notes: menuPosition.partner.notes || '',
                  });
                  setShowEditModal(true);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 dark:hover:bg-[#222432] flex items-center gap-2 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Edit Partner Details</span>
              </button>

              <button
                onClick={() => {
                  setSelectedPartner(menuPosition.partner);
                  setShowDeleteModal(true);
                  setMenuPosition(null);
                }}
                className="w-full text-left px-3.5 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 text-rose-600 dark:text-rose-400 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Partner</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Partner Invite URL Modal */}
      {inviteModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Partner Invitation Link
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {inviteModalData.loading
                      ? 'Generating secure partner invite...'
                      : <>Invite ready for <strong className="text-slate-700 dark:text-slate-200">{inviteModalData.partnerName}</strong></>}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInviteModalData(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inviteModalData.loading || !inviteModalData.inviteUrl ? (
              <div className="py-8 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center shadow-xs">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    Generating Partner Invite Link...
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Generating cryptographic access token for {inviteModalData.partnerEmail}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs animate-in fade-in duration-150">
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  Share this partner-specific link with <strong>{inviteModalData.partnerEmail}</strong>. When they open the link, they will create their password and get direct access to the Partner Portal.
                </p>

                <div className="p-3 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-xl flex items-center justify-between gap-2">
                  <input
                    type="text"
                    readOnly
                    value={inviteModalData.inviteUrl}
                    className="bg-transparent text-xs font-mono text-slate-800 dark:text-slate-200 w-full focus:outline-none select-all"
                  />
                  <button
                    onClick={() => handleCopyInviteUrl(inviteModalData.inviteUrl!)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shrink-0 flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copiedInvite ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 p-3 rounded-xl text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  <strong>Next Step:</strong> Send this invite URL via email, Slack, or messaging. The invitation token remains valid for 30 days.
                </div>
              </div>
            )}

            <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-[#222430]">
              <button
                onClick={() => setInviteModalData(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer transition"
              >
                {inviteModalData.loading ? 'Cancel' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Partner Modal */}
      {showDeleteModal && selectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Delete Partner</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to remove <strong>{selectedPartner.name}</strong>? Any assigned properties will be unlinked from this partner.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeletePartner}
                disabled={formLoading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Delete Partner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Property Modal */}
      {showAssignModal && selectedPartner && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Assign Property to {selectedPartner.name}
                </h3>
                <p className="text-xs text-slate-400">Default Revenue Share Rate: {selectedPartner.default_commission_rate}%</p>
              </div>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleAssignPropertySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Select Property</label>
                <select
                  required
                  value={assignForm.property_id}
                  onChange={(e) => setAssignForm({ ...assignForm, property_id: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white cursor-pointer focus:outline-none focus:border-blue-500"
                >
                  <option value="">-- Choose a property --</option>
                  {allProperties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {isSuperAdmin && p.monthly_price ? `($${p.monthly_price}/mo)` : ''} {p.partner_id === selectedPartner.id ? '(Currently assigned)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Revenue Share Override (% optional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder={`Leave blank to use default ${selectedPartner.default_commission_rate}%`}
                  value={assignForm.commission_override}
                  onChange={(e) => setAssignForm({ ...assignForm, commission_override: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-[#222430] rounded-lg text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition shadow-xs"
                >
                  {formLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Assign Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
