'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Shield, Check, MoreVertical, Trash2 } from 'lucide-react';
import { itemVariants } from './types';

interface TeamMembersTabProps {
  members: any[];
  loadingTeam: boolean;
  onRefreshTeam: () => void;
  currentUserId?: string;
  currentUserRole?: string;
  onToggleMemberRole: (memberId: string, currentRole: string) => void;
  onRequestDeleteMember: (member: any) => void;
}

export default function TeamMembersTab({
  members,
  loadingTeam,
  onRefreshTeam,
  currentUserId,
  currentUserRole,
  onToggleMemberRole,
  onRequestDeleteMember,
}: TeamMembersTabProps) {
  const [menuPosition, setMenuPosition] = useState<{
    bottom: number;
    left: number;
    member: any;
  } | null>(null);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, member: any) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.max(16, rect.right - menuWidth);
    setMenuPosition({
      bottom: window.innerHeight - rect.top + 6,
      left,
      member,
    });
  };

  return (
    <motion.div variants={itemVariants} className="space-y-6">
      <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active System Administrators &amp; Staff</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Authorized personnel with operational permissions to manage customer properties, services, and tickets.
            </p>
          </div>
          <button
            onClick={onRefreshTeam}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            title="Refresh Team"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingTeam ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Member Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222430] text-slate-700 dark:text-slate-300">
              {members.map((m) => {
                const isCurrentUser = m.id === currentUserId;
                const normRole = (m.role || '').toLowerCase().replace(/[-_]/g, '');
                const isSuper = normRole === 'superadmin';
                const roleLabel = isSuper ? 'Super Admin' : 'Sub-Super Admin';
                const roleBadge = isSuper
                  ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/40'
                  : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/40';

                const currentAdminNormRole = (currentUserRole || '').toLowerCase().replace(/[-_]/g, '');
                const isCurrentSuperAdmin = currentAdminNormRole === 'superadmin';
                const canManageThisMember = isCurrentSuperAdmin || !isSuper;

                return (
                  <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1a1b22]/50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px]">
                        {(m.full_name || m.email || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="leading-tight">{m.full_name || 'System Administrator'}</p>
                        {isCurrentUser && (
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                            (You)
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-medium">
                      {m.email}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold border ${roleBadge}`}>
                        <Shield className="w-3 h-3" />
                        {roleLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3 h-3" />
                        Active
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {!isCurrentUser && canManageThisMember && (
                        <button
                          onClick={(e) => handleOpenMenu(e, m)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f2128] transition cursor-pointer"
                          title="Member Options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      )}
                      {!isCurrentUser && !canManageThisMember && (
                        <span className="text-[10.5px] text-slate-400 font-medium italic pr-1 select-none">
                          Protected
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {members.length === 0 && !loadingTeam && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No team members found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fixed 3-Dots Action Popup for Admin Team Member */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{
              position: 'fixed',
              bottom: `${menuPosition.bottom}px`,
              left: `${menuPosition.left}px`,
            }}
            className="fixed z-50 w-56 bg-white dark:bg-[#1a1c24] border border-slate-200 dark:border-[#2a2c3a] rounded-xl shadow-2xl py-1 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          >
            <div className="px-3.5 py-2 border-b border-slate-100 dark:border-[#222430] bg-slate-50/50 dark:bg-[#15161c]/50">
              <p className="font-bold text-slate-900 dark:text-white truncate">
                {menuPosition.member.full_name || menuPosition.member.email}
              </p>
              <p className="text-[10px] text-slate-400">Administrator Options</p>
            </div>

            <button
              onClick={() => {
                const m = menuPosition.member;
                setMenuPosition(null);
                onToggleMemberRole(m.id, m.role);
              }}
              className="w-full px-3.5 py-2 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2 cursor-pointer font-medium transition"
            >
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>
                {(menuPosition.member.role || '').toLowerCase().replace(/[-_]/g, '') === 'superadmin'
                  ? 'Switch to Sub-Super Admin'
                  : 'Switch to Super Admin'}
              </span>
            </button>

            <div className="my-1 border-t border-slate-100 dark:border-[#282a36]" />

            <button
              onClick={() => {
                const m = menuPosition.member;
                setMenuPosition(null);
                onRequestDeleteMember(m);
              }}
              className="w-full px-3.5 py-2 text-left hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 cursor-pointer font-semibold transition"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Remove User</span>
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
}
