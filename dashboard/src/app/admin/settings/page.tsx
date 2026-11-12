'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  CheckCircle2,
  AlertCircle,
  UserPlus,
  X,
  Info,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { SettingsModals } from './_components/SettingsModals';
import ProfileSettingsTab from './_components/ProfileSettingsTab';
import TeamMembersTab from './_components/TeamMembersTab';
import { containerVariants, itemVariants, Toast } from './_components/types';

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
  const [deleteTargetMember, setDeleteTargetMember] = useState<any | null>(null);
  const [deletingMember, setDeletingMember] = useState(false);

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
    const currentAdminNormRole = (profile?.role || '').toLowerCase().replace(/[-_]/g, '');
    const isCurrentSuperAdmin = currentAdminNormRole === 'superadmin';
    const norm = (currentRole || '').toLowerCase().replace(/[-_]/g, '');

    if (!isCurrentSuperAdmin && norm === 'superadmin') {
      showToast('Permission Denied', 'Sub-Super Admins do not have permission to change a Super Admin\'s role.', 'error');
      return;
    }

    const newRole = norm === 'superadmin' ? 'SUB_SUPER_ADMIN' : 'SUPER_ADMIN';
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

      showToast('Role Updated', `User role modified to ${newRole === 'SUPER_ADMIN' ? 'Super Admin' : 'Sub-Super Admin'}.`, 'success');
      fetchTeamMembers();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to update role', 'error');
    }
  };

  const handleDeleteMember = async () => {
    if (!deleteTargetMember) return;

    const currentAdminNormRole = (profile?.role || '').toLowerCase().replace(/[-_]/g, '');
    const isCurrentSuperAdmin = currentAdminNormRole === 'superadmin';
    const targetNorm = (deleteTargetMember.role || '').toLowerCase().replace(/[-_]/g, '');

    if (!isCurrentSuperAdmin && targetNorm === 'superadmin') {
      showToast('Permission Denied', 'Sub-Super Admins do not have permission to remove a Super Admin.', 'error');
      setDeleteTargetMember(null);
      return;
    }

    setDeletingMember(true);
    try {
      const res = await fetch(`/api/admin/members?id=${deleteTargetMember.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to remove user');
      }

      showToast('User Removed', `User "${deleteTargetMember.full_name || deleteTargetMember.email}" was deleted from the profiles table.`, 'success');
      setDeleteTargetMember(null);
      fetchTeamMembers();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to remove user', 'error');
    } finally {
      setDeletingMember(false);
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
        <ProfileSettingsTab
          fullName={fullName}
          setFullName={setFullName}
          email={profile?.email}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          effectiveRole={effectiveRole}
          savingProfile={savingProfile}
          onSaveProfile={handleSaveProfile}
        />
      )}

      {/* TAB 2: ADMIN TEAM MEMBERS */}
      {activeTab === 'TEAM' && (
        <TeamMembersTab
          members={members}
          loadingTeam={loadingTeam}
          onRefreshTeam={fetchTeamMembers}
          currentUserId={profile?.id}
          currentUserRole={profile?.role}
          onToggleMemberRole={handleToggleMemberRole}
          onRequestDeleteMember={(m) => setDeleteTargetMember(m)}
        />
      )}

      {/* MODALS */}
      <SettingsModals
        showInviteModal={showInviteModal}
        generatedLink={generatedLink}
        emailStatus={emailStatus}
        lastInvitedEmail={lastInvitedEmail}
        copied={copied}
        inviteEmail={inviteEmail}
        setInviteEmail={setInviteEmail}
        inviteRole={inviteRole}
        setInviteRole={setInviteRole}
        sendingInvite={sendingInvite}
        handleCloseInviteModal={handleCloseInviteModal}
        handleCopyGeneratedLink={handleCopyGeneratedLink}
        handleResetForAnother={handleResetForAnother}
        handleSendInvite={handleSendInvite}
        deleteTargetMember={deleteTargetMember}
        setDeleteTargetMember={setDeleteTargetMember}
        deletingMember={deletingMember}
        handleDeleteMember={handleDeleteMember}
      />
    </motion.div>
  );
}
