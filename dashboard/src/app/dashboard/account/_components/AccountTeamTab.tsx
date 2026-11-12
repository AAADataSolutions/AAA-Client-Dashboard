'use client';

import React from 'react';
import {
  Shield,
  Mail,
  Phone,
  MoreVertical,
  Trash2,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';

interface AccountTeamTabProps {
  activeTab: 'PROFILE' | 'TEAM';
  itemVariants: Variants;
  orgName: string;
  fetchTeamMembers: () => void;
  isClientAdmin: boolean;
  members: any[];
  profile: any;
  handleCopyText: (text: string, id: string, label: string) => void;
  copiedId: string | null;
  handleOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, member: any) => void;
  invitations: any[];
  menuPosition: {
    top?: number;
    bottom?: number;
    left: number;
    member: any;
  } | null;
  setMenuPosition: (pos: any) => void;
  handleToggleMemberRole: (memberId: string, currentRole: string) => void;
  handleRemoveMember: (memberId: string, memberName: string) => void;
  invitationToRevoke: any | null;
  setInvitationToRevoke: (inv: any | null) => void;
  revoking: boolean;
  handleConfirmRevokeInvitation: () => void;
}

export function AccountTeamTab({
  activeTab,
  itemVariants,
  orgName,
  fetchTeamMembers,
  isClientAdmin,
  members,
  profile,
  handleCopyText,
  copiedId,
  handleOpenMenu,
  invitations,
  menuPosition,
  setMenuPosition,
  handleToggleMemberRole,
  handleRemoveMember,
  invitationToRevoke,
  setInvitationToRevoke,
  revoking,
  handleConfirmRevokeInvitation,
}: AccountTeamTabProps) {
  return (
    <>
      {activeTab === 'TEAM' && (
        <motion.div variants={itemVariants} className="space-y-6">
          {/* Members Table */}
          <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Team Members</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Colleagues with authorized access to {orgName} telecom operations.
                </p>
              </div>
              <button
                onClick={fetchTeamMembers}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Refresh Team"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">MEMBER NAME</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">EMAIL ADDRESS</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">ORGANIZATION ROLE</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">STATUS</th>
                    <th className="py-3.5 px-4 font-bold whitespace-nowrap">JOINED DATE</th>
                    {isClientAdmin && <th className="py-3.5 px-4 font-bold text-right whitespace-nowrap">ACTIONS</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                  {members.map((mem) => {
                    const prof = mem.profile || {};
                    const isSelf = prof.id === profile?.id;

                    return (
                      <tr key={mem.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition-colors">
                        {/* Name & Avatar */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 font-bold text-xs flex items-center justify-center border border-blue-200 dark:border-blue-900/40">
                              {(prof.full_name || prof.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                                {prof.full_name || 'Member'} {isSelf && '(You)'}
                              </span>
                              {prof.phone_number && (
                                <div className="flex items-center gap-1 text-[10.5px] text-slate-400">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{prof.phone_number}</span>
                                  <button
                                    onClick={() => handleCopyText(prof.phone_number, `mem-${mem.id}-phone`, 'phone')}
                                    className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                                    title="Copy phone"
                                  >
                                    {copiedId === `mem-${mem.id}-phone` ? <Check className="w-2.5 h-2.5 text-emerald-500" /> : <Copy className="w-2.5 h-2.5" />}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{prof.email}</span>
                            <button
                              onClick={() => handleCopyText(prof.email, `mem-${mem.id}-email`, 'email')}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                              title="Copy email"
                            >
                              {copiedId === `mem-${mem.id}-email` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              mem.role === 'ADMIN'
                                ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {mem.role === 'ADMIN' ? 'Admin' : 'Member'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${
                              mem.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400'
                                : 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400'
                            }`}
                          >
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            {mem.status}
                          </span>
                        </td>

                        {/* Joined Date */}
                        <td className="py-3.5 px-4 text-slate-400 text-xs whitespace-nowrap">
                          {new Date(mem.created_at).toLocaleDateString()}
                        </td>

                        {/* Actions (Client Admin Only) */}
                        {isClientAdmin && (
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            {!isSelf && (
                              <button
                                onClick={(e) => handleOpenMenu(e, mem)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#222430] transition cursor-pointer"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations Table (Client Admin) */}
          {isClientAdmin && (
            <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-slate-100 dark:border-[#222430]">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pending Invitations ({invitations.filter((i) => i.status === 'PENDING').length})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Invited team members who have not yet completed signup.
                </p>
              </div>

              {invitations.filter((i) => i.status === 'PENDING').length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  <p>No pending invitations. All invited members have joined.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-[#1f212c] text-xs">
                  {invitations
                    .filter((i) => i.status === 'PENDING')
                    .map((inv) => (
                      <div key={inv.id} className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 dark:text-white">
                                {inv.email}
                              </span>
                              <button
                                onClick={() => handleCopyText(inv.email, `inv-${inv.id}`, 'invite email')}
                                className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                                title="Copy email"
                              >
                                {copiedId === `inv-${inv.id}` ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <span className="text-[10.5px] text-slate-400 block mt-0.5">
                              Role: <strong>{inv.target_org_role}</strong> • Expires:{' '}
                              {new Date(inv.expires_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* <button
                            onClick={() => setInvitationToRevoke(inv)}
                            className="px-2.5 py-1 rounded border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-semibold transition cursor-pointer"
                          >
                            Revoke
                          </button> */}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Fixed 3-Dots Action Popup for Team Member */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{
              position: 'fixed',
              ...(menuPosition.top !== undefined ? { top: `${menuPosition.top}px` } : {}),
              ...(menuPosition.bottom !== undefined ? { bottom: `${menuPosition.bottom}px` } : {}),
              left: `${menuPosition.left}px`,
            }}
            className="fixed z-50 w-56 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-75"
          >
            <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430] mb-0.5">
              <p className="font-semibold text-slate-900 dark:text-white truncate">
                {menuPosition.member.profile?.full_name || 'Member Options'}
              </p>
              <p className="text-[10px] text-slate-400">Team Permissions</p>
            </div>

            <button
              onClick={() => {
                const m = menuPosition.member;
                setMenuPosition(null);
                handleToggleMemberRole(m.id, m.role);
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Change to {menuPosition.member.role === 'ADMIN' ? 'Member' : 'Admin'}</span>
            </button>

            <div className="border-t border-slate-100 dark:border-[#222430] my-0.5" />

            <button
              onClick={() => {
                const m = menuPosition.member;
                setMenuPosition(null);
                handleRemoveMember(m.id, m.profile?.full_name || 'Member');
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Remove from Organization
            </button>
          </div>
        </>
      )}

      {/* Confirmation Modal for Revoking Invitation */}
      <AnimatePresence>
        {invitationToRevoke && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="fixed inset-0" onClick={() => !revoking && setInvitationToRevoke(null)} aria-hidden="true" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="relative w-full max-w-md bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl shadow-2xl z-10 overflow-hidden p-6 space-y-4 text-xs"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-100 dark:border-rose-900/40">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Revoke Invitation?
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Are you sure you want to revoke the invitation sent to <strong className="text-slate-800 dark:text-slate-200">{invitationToRevoke.email}</strong>? The signup invitation link will be immediately invalidated and removed from pending invites.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setInvitationToRevoke(null)}
                  disabled={revoking}
                  className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212a] font-semibold text-xs transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRevokeInvitation}
                  disabled={revoking}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {revoking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Revoking...</span>
                    </>
                  ) : (
                    <span>Yes, Revoke Invitation</span>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
