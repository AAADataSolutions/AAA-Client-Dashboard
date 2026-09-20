'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  User,
  Shield,
  UserPlus,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Trash2,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  Lock,
  Link2,
  X,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Building2,
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { InviteMemberModal } from '@/components/client/InviteMemberModal';

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

export default function ClientAccountPage() {
  const { profile, orgMembership, effectiveRole, refreshProfile } = useAuth();
  const toast = useToast();
  const isClientAdmin = effectiveRole === 'ADMIN';
  const orgName = orgMembership?.organization?.name || 'Organization';

  // Tabs: Profile Settings & Team Management (Notifications removed)
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'TEAM'>('PROFILE');

  // Profile Form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Team state
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Revoke Invitation Confirmation Modal State
  const [invitationToRevoke, setInvitationToRevoke] = useState<any | null>(null);
  const [revoking, setRevoking] = useState(false);

  // 3-Dots Fixed Action Menu state with upside detection
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    member: any;
  } | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Logo upload state
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const logoInputRef = React.useRef<HTMLInputElement | null>(null);
  const currentLogoUrl = (orgMembership?.organization as any)?.logo_url || null;

  const handleUploadLogo = async (file: File) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size exceeds 2MB limit.');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG, SVG, and WebP images are allowed.');
      return;
    }
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);
      const res = await fetch('/api/client/organization/logo', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to upload organization logo');
      }
      toast.success('Organization logo updated successfully.');
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    setRemovingLogo(true);
    try {
      const res = await fetch('/api/client/organization/logo', {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to remove logo');
      }
      toast.success('Organization logo removed.');
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove logo');
    } finally {
      setRemovingLogo(false);
    }
  };

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhoneNumber(profile.phone_number || '');
    }
  }, [profile]);

  const fetchTeamMembers = useCallback(async () => {
    setLoadingTeam(true);
    try {
      const res = await fetch('/api/client/members');
      const json = await res.json();
      if (json.success) {
        setMembers(json.members || []);
        setInvitations(json.invitations || []);
      }
    } catch (err) {
      console.error('Error fetching team members:', err);
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

      toast.success('Profile information saved successfully.');
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || 'Error saving profile');
    } finally {
      setSavingProfile(false);
    }
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

  const handleToggleMemberRole = async (memberId: string, currentRole: string) => {
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await fetch('/api/client/members', {
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

      toast.success(`Member role updated to ${newRole}.`);
      fetchTeamMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (!confirm(`Are you sure you want to remove ${memberName} from ${orgName}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/client/members?member_id=${memberId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to remove member');
      }

      toast.success('Member removed from organization.');
      fetchTeamMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleConfirmRevokeInvitation = async () => {
    if (!invitationToRevoke) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/client/members?invitation_id=${invitationToRevoke.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to revoke invitation');
      }

      toast.success(`Invitation for ${invitationToRevoke.email} has been revoked.`);
      setInvitationToRevoke(null);
      fetchTeamMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke invite');
    } finally {
      setRevoking(false);
    }
  };

  const handleCopyText = (text: string, id: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success(`Copied ${label} to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans"
    >
      {/* 1. Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shrink-0 text-black dark:text-white">
            <Users size={256} className="w-full h-full object-contain" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Account &amp; Team Management
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage personal profile and team access permissions for <strong className="text-slate-700 dark:text-slate-200">{orgName}</strong>
            </p>
          </div>
        </div>

        {activeTab === 'TEAM' && isClientAdmin && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition shadow-sm cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Team Member</span>
          </motion.button>
        )}
      </motion.div>

      {/* 2. Tab Navigation (Profile & Team only) */}
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
          Organization Team ({members.length || 1})
        </button>
      </motion.div>

      {/* TAB 1: PROFILE SETTINGS */}
      {activeTab === 'PROFILE' && (
        <div className="space-y-6 max-w-2xl">
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-6 shadow-xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Personal Profile</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Update your contact details and communication identity.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                disabled={savingProfile}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Email Address (Account Login)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={profile?.email || ''}
                  readOnly
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 dark:bg-[#1c1d25] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-500 dark:text-slate-400 text-xs select-none"
                />
                {profile?.email && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(profile.email, 'my-email', 'email')}
                    className="p-2 rounded-lg border border-slate-200 dark:border-[#222430] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                    title="Copy email"
                  >
                    {copiedId === 'my-email' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>
              <p className="text-[10.5px] text-slate-400">
                To change your registered email, please contact AAA Support.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+1 (555) 000-0000"
                disabled={savingProfile}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
                Organization Role
              </label>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430] flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">
                    {isClientAdmin ? 'Client Administrator' : 'Client Member'}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isClientAdmin
                      ? 'Full organization management & member invitations.'
                      : 'Operational property & support tickets access.'}
                  </span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                  {isClientAdmin ? 'ADMIN' : 'USER'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
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

        {/* Organization Branding & Logo Card */}
        <motion.div variants={itemVariants} className="max-w-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-6 shadow-xs space-y-5">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Organization Branding</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Upload your organization logo to appear in the client top navbar and sidebar. Max 2MB (PNG, JPG, SVG, WebP).
            </p>
          </div>

          <input
            type="file"
            ref={logoInputRef}
            accept="image/jpeg,image/png,image/svg+xml,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUploadLogo(file);
            }}
          />

          {currentLogoUrl ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
              <div className="flex items-center gap-4">
                <div className="w-24 h-16 rounded-lg bg-white dark:bg-[#12131a] border border-slate-200 dark:border-[#222430] p-2 flex items-center justify-center overflow-hidden shadow-xs">
                  <img
                    src={currentLogoUrl}
                    alt={orgName}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <span className="font-semibold text-xs text-slate-900 dark:text-white block">{orgName} Logo</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Displayed on Navigation Bar
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={uploadingLogo || removingLogo}
                  onClick={() => logoInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-[#222430] hover:bg-slate-100 dark:hover:bg-[#222430] text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {uploadingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>Change Logo</span>
                </button>
                <button
                  type="button"
                  disabled={uploadingLogo || removingLogo}
                  onClick={handleRemoveLogo}
                  className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  {removingLogo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => !uploadingLogo && logoInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleUploadLogo(file);
              }}
              className="border-2 border-dashed border-slate-200 dark:border-[#2a2c3a] hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-6 text-center cursor-pointer transition bg-slate-50/50 dark:bg-[#181920]/50 hover:bg-blue-50/20 dark:hover:bg-blue-950/10"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-2">
                {uploadingLogo ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {uploadingLogo ? 'Uploading logo...' : 'Upload your organization logo'}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Drag and drop or click to browse. Supported: JPG, PNG, SVG, WebP (max 2MB)
              </p>
            </div>
          )}
        </motion.div>
        </div>
      )}

      {/* TAB 2: ORGANIZATION TEAM USERS */}
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
                          <button
                            onClick={() => setInvitationToRevoke(inv)}
                            className="px-2.5 py-1 rounded border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-semibold transition cursor-pointer"
                          >
                            Revoke
                          </button>
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

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={fetchTeamMembers}
      />
    </motion.div>
  );
}
