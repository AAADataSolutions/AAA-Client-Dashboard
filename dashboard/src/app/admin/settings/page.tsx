'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Settings,
  Shield,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Users,
  User,
  UserPlus,
  Mail,
  Phone,
  MoreVertical,
  Trash2,
  Check,
  Copy,
  Link2,
  Loader2,
  X,
  Info,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export default function AdminSettingsPage() {
  const { profile, effectiveRole, refreshProfile } = useAuth();

  // Tabs
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'TEAM'>('PROFILE');

  // Profile Form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Admin Team state
  const [members, setMembers] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    member: any;
  } | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'USER'>('ADMIN');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [lastInvitedEmail, setLastInvitedEmail] = useState('');
  const [emailStatus, setEmailStatus] = useState<'SENT' | 'SKIPPED' | 'FAILED' | null>(null);
  const [copied, setCopied] = useState(false);

  // Toast Notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone_number || '');
    }
  }, [profile]);

  const fetchTeamMembers = useCallback(async () => {
    setLoadingTeam(true);
    try {
      const res = await fetch('/api/admin/members');
      const json = await res.json();
      if (json.success) {
        setMembers(json.members || []);
      }
    } catch (err) {
      console.error('Error fetching admin team members:', err);
    } finally {
      setLoadingTeam(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'TEAM') {
      fetchTeamMembers();
    }
  }, [activeTab, fetchTeamMembers]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),
          phone_number: phoneNumber.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update profile');
      }

      showToast('Profile Saved', 'Your administrator profile details were updated.', 'success');
      await refreshProfile();
    } catch (err: any) {
      showToast('Error', err.message || 'Error saving profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleToggleMemberRole = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await fetch('/api/admin/members', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          role: newRole,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to change role');
      }

      showToast('Role Updated', `User role modified to ${newRole}.`, 'success');
      fetchTeamMembers();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update role', 'error');
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      showToast('Validation', 'Please provide a valid email address.', 'error');
      return;
    }
    setSendingInvite(true);
    try {
      const res = await fetch('/api/invitations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          invite_type: 'INTERNAL_TEAM',
          target_app_role: 'SUB_SUPER_ADMIN',
          role: inviteRole,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to dispatch invitation');
      }

      setGeneratedLink(json.inviteUrl);
      setLastInvitedEmail(inviteEmail.trim());

      if (json.emailSent) {
        setEmailStatus('SENT');
        showToast('Invitation Sent', `Invitation email sent to ${inviteEmail.trim()}.`, 'success');
      } else if (json.emailSkipped) {
        setEmailStatus('SKIPPED');
        showToast('Link Generated', `Invitation link ready for ${inviteEmail.trim()}.`, 'info');
      } else {
        setEmailStatus('FAILED');
        showToast('Link Generated', `Invitation link ready. Email delivery could not be completed.`, 'info');
      }

      fetchTeamMembers();
    } catch (err: any) {
      showToast('Error', err.message || 'Error creating invitation', 'error');
    } finally {
      setSendingInvite(false);
    }
  };

  const handleCloseInviteModal = () => {
    setShowInviteModal(false);
    setGeneratedLink(null);
    setInviteEmail('');
    setEmailStatus(null);
    setCopied(false);
  };

  const handleResetForAnother = () => {
    setGeneratedLink(null);
    setInviteEmail('');
    setEmailStatus(null);
    setCopied(false);
  };

  const handleCopyGeneratedLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    showToast('Copied', 'Invitation URL copied to clipboard.', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, member: any) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.max(16, rect.right - menuWidth);
    const isNearBottom = rect.bottom + 180 > window.innerHeight;
    if (isNearBottom) {
      setMenuPosition({
        bottom: window.innerHeight - rect.top + 6,
        left,
        member,
      });
    } else {
      setMenuPosition({
        top: rect.bottom + 4,
        left,
        member,
      });
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans"
    >
      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
              t.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                : t.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                : 'bg-blue-50 dark:bg-blue-950/90 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800'
            }`}
          >
            {t.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />}
            {t.type === 'info' && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
            <div>
              <p className="font-semibold">{t.title}</p>
              {t.message && <p className="text-xs opacity-90">{t.message}</p>}
            </div>
            <button
              onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
              className="ml-auto p-1 hover:opacity-75 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 text-black dark:text-white">
            <Settings size={256} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              System Settings
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage platform configurations and administrator access.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'TEAM' && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowInviteModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Invite Admin</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 border-b border-slate-200/80 dark:border-[#222430] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === 'PROFILE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#181920]'
          }`}
        >
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab('TEAM')}
          className={`px-3.5 py-1.5 rounded-lg transition cursor-pointer ${
            activeTab === 'TEAM'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#181920]'
          }`}
        >
          Admin Team Members ({members.length || '—'})
        </button>
      </motion.div>

      {/* TAB 1: PROFILE SETTINGS */}
      {activeTab === 'PROFILE' && (
        <motion.div variants={itemVariants} className="max-w-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Admin Profile</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update your administrator contact information and identity.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-900 dark:text-slate-200 block">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Administrator Name"
                disabled={savingProfile}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-900 dark:text-slate-200 block">
                Email Address (Account Login)
              </label>
              <input
                type="email"
                value={profile?.email || ''}
                readOnly
                disabled
                className="w-full px-3 py-2 bg-slate-100 dark:bg-[#1c1d25] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-500 dark:text-slate-400 text-xs select-none"
              />
              <p className="text-[10.5px] text-slate-400">
                Registered Super Admin email address associated with Supabase Auth.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-900 dark:text-slate-200 block">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                disabled={savingProfile}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-900 dark:text-slate-200 block">
                System Access Tier
              </label>
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    Global Super Administrator
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Full CRUD privileges across all tenants, telecom services, porting orders, and audit logs.
                  </span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                  {effectiveRole || 'ADMIN'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-sm disabled:opacity-50 cursor-pointer"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </motion.button>
            </div>
          </form>
        </motion.div>
      )}

      {/* TAB 2: ADMIN TEAM MEMBERS */}
      {activeTab === 'TEAM' && (
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
                onClick={fetchTeamMembers}
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
                    const isCurrentUser = m.user_id === profile?.id;
                    const roleBadge =
                      m.role === 'ADMIN'
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/40'
                        : 'bg-slate-50 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300 border-slate-200 dark:border-slate-700';

                    return (
                      <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-[#1a1b22]/50 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[11px]">
                            {(m.full_name || m.email || 'A').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="leading-tight">{m.full_name || 'System Staff'}</p>
                            {isCurrentUser && (
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
                                (You)
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400">
                          {m.email}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-bold border ${roleBadge}`}>
                            {m.role === 'ADMIN' ? 'Administrator' : 'User / Staff'}
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
                          {!isCurrentUser && (
                            <button
                              onClick={(e) => handleOpenMenu(e, m)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1f2128] transition cursor-pointer"
                              title="Member Options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
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
        </motion.div>
      )}

      {/* Fixed 3-Dots Action Popup for Admin Team Member */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => setMenuPosition(null)} />
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
                {menuPosition.member.full_name || 'Member Options'}
              </p>
              <p className="text-[10px] text-slate-400">Admin Permissions</p>
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
              <span>Change to {menuPosition.member.role === 'ADMIN' ? 'Staff / User' : 'Admin'}</span>
            </button>
          </div>
        </>
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <div className="fixed inset-0 min-h-screen w-screen h-screen z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-xl w-full max-w-md p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  {generatedLink ? (
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                      <UserPlus className="w-4 h-4" />
                    </div>
                  )}
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {generatedLink ? 'Invitation Link Ready' : 'Invite Administrator'}
                  </h3>
                </div>
                <button
                  onClick={handleCloseInviteModal}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {generatedLink ? (
                <div className="space-y-4 text-xs">
                  {emailStatus === 'SENT' ? (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-200 text-xs flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Invitation Email Dispatched!</p>
                        <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                          An automated invitation email has been delivered to <strong>{lastInvitedEmail}</strong>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/40 text-blue-800 dark:text-blue-200 text-xs flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Invitation Generated for {lastInvitedEmail}</p>
                        <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-0.5">
                          Copy the link below and share it directly via Slack, Teams, WhatsApp or Email.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                      Direct Invitation Link (Valid for 7 Days)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={generatedLink}
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white font-mono text-[11px] select-all outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleCopyGeneratedLink}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                      >
                        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copied ? 'Copied!' : 'Copy Link'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleResetForAnother}
                      className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold cursor-pointer"
                    >
                      + Invite Another Member
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseInviteModal}
                      className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-xs cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-900 dark:text-slate-200 block">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="colleague@aaasolutions.com"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-semibold text-slate-900 dark:text-slate-200 block">
                      Access Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500 text-xs cursor-pointer"
                    >
                      <option value="ADMIN">Admin (Full System Permissions)</option>
                      <option value="USER">Staff / Operational Support</option>
                    </select>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={handleCloseInviteModal}
                      className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-[#1a1c24] cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingInvite}
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {sendingInvite ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Sending...</span>
                        </>
                      ) : (
                        <span>Send Invitation</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
