'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { InviteMemberModal } from '@/components/client/InviteMemberModal';
import { AccountProfileTab } from './_components/AccountProfileTab';
import { AccountTeamTab } from './_components/AccountTeamTab';

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
        <AccountProfileTab
          itemVariants={itemVariants}
          handleSaveProfile={handleSaveProfile}
          fullName={fullName}
          setFullName={setFullName}
          savingProfile={savingProfile}
          profile={profile}
          handleCopyText={handleCopyText}
          copiedId={copiedId}
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          isClientAdmin={isClientAdmin}
          logoInputRef={logoInputRef}
          handleUploadLogo={handleUploadLogo}
          currentLogoUrl={currentLogoUrl}
          orgName={orgName}
          uploadingLogo={uploadingLogo}
          removingLogo={removingLogo}
          handleRemoveLogo={handleRemoveLogo}
        />
      )}

      {/* TAB 2: ORGANIZATION TEAM USERS */}
      <AccountTeamTab
        activeTab={activeTab}
        itemVariants={itemVariants}
        orgName={orgName}
        fetchTeamMembers={fetchTeamMembers}
        isClientAdmin={isClientAdmin}
        members={members}
        profile={profile}
        handleCopyText={handleCopyText}
        copiedId={copiedId}
        handleOpenMenu={handleOpenMenu}
        invitations={invitations}
        menuPosition={menuPosition}
        setMenuPosition={setMenuPosition}
        handleToggleMemberRole={handleToggleMemberRole}
        handleRemoveMember={handleRemoveMember}
        invitationToRevoke={invitationToRevoke}
        setInvitationToRevoke={setInvitationToRevoke}
        revoking={revoking}
        handleConfirmRevokeInvitation={handleConfirmRevokeInvitation}
      />

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={fetchTeamMembers}
      />
    </motion.div>
  );
}
