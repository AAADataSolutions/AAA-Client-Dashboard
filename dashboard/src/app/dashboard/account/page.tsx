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
  Bell,
  Lock,
  Link2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { useToast } from '@/components/client/ClientToast';
import { InviteMemberModal } from '@/components/client/InviteMemberModal';

export default function ClientAccountPage() {
  const { profile, orgMembership, effectiveRole, refreshProfile } = useAuth();
  const toast = useToast();
  const isClientAdmin = effectiveRole === 'ADMIN';
  const orgName = orgMembership?.organization?.name || 'Organization';

  // Tabs
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'TEAM' | 'NOTIFICATIONS'>('PROFILE');

  // Profile Form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Team state
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // 3-Dots Fixed Action Menu state
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    left: number;
    member: any;
  } | null>(null);

  // Notifications toggles
  const [notifications, setNotifications] = useState({
    ticketReplies: true,
    e911Alerts: true,
    onboardingMilestones: true,
    portingCutovers: true,
  });

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
    const top = rect.bottom + 4;
    setMenuPosition({ top, left, member });
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

  const handleRevokeInvitation = async (invId: string) => {
    try {
      const res = await fetch(`/api/client/members?invitation_id=${invId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to revoke invitation');
      }

      toast.success('Invitation revoked.');
      fetchTeamMembers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke invite');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Account &amp; Team Management
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage personal credentials, authorized users, and organization preferences for {orgName}.
              </p>
            </div>
          </div>
        </div>

        {activeTab === 'TEAM' && isClientAdmin && (
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition shadow-2xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {/* 2. Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 dark:border-[#222430] pb-2 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('PROFILE')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            activeTab === 'PROFILE'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#181920]'
          }`}
        >
          Profile Settings
        </button>
        <button
          onClick={() => setActiveTab('TEAM')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            activeTab === 'TEAM'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#181920]'
          }`}
        >
          Organization Team ({members.length || 1})
        </button>
        <button
          onClick={() => setActiveTab('NOTIFICATIONS')}
          className={`px-3.5 py-1.5 rounded-lg transition ${
            activeTab === 'NOTIFICATIONS'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-[#181920]'
          }`}
        >
          Notifications
        </button>
      </div>

      {/* TAB 1: PROFILE SETTINGS */}
      {activeTab === 'PROFILE' && (
        <div className="max-w-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-6 shadow-xs space-y-6">
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-800 dark:text-slate-200 block">
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430] rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 text-xs font-mono"
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
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40">
                  {isClientAdmin ? 'ADMIN' : 'USER'}
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-[#222430] flex justify-end">
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ORGANIZATION TEAM USERS */}
      {activeTab === 'TEAM' && (
        <div className="space-y-6">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Refresh Team"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-[#111217] border-b border-slate-200/80 dark:border-[#222430] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3.5 px-4 font-bold">MEMBER NAME</th>
                    <th className="py-3.5 px-4 font-bold">EMAIL ADDRESS</th>
                    <th className="py-3.5 px-4 font-bold">ORGANIZATION ROLE</th>
                    <th className="py-3.5 px-4 font-bold">STATUS</th>
                    <th className="py-3.5 px-4 font-bold">JOINED DATE</th>
                    {isClientAdmin && <th className="py-3.5 px-4 font-bold text-right">ACTIONS</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1f212c]">
                  {members.map((mem) => {
                    const prof = mem.profile || {};
                    const isSelf = prof.id === profile?.id;

                    return (
                      <tr key={mem.id} className="hover:bg-slate-50/60 dark:hover:bg-[#181a24] transition-colors">
                        {/* Name & Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-200 dark:border-indigo-900/40">
                              {(prof.full_name || prof.email || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 dark:text-white text-xs block">
                                {prof.full_name || 'Member'} {isSelf && '(You)'}
                              </span>
                              <span className="text-[10.5px] text-slate-400 block font-mono">
                                {prof.phone_number || '—'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3.5 px-4 font-mono text-slate-700 dark:text-slate-300">
                          {prof.email}
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              mem.role === 'ADMIN'
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {mem.role === 'ADMIN' ? 'Admin' : 'Member'}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
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
                        <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">
                          {new Date(mem.created_at).toLocaleDateString()}
                        </td>

                        {/* Actions (Client Admin Only) */}
                        {isClientAdmin && (
                          <td className="py-3.5 px-4 text-right">
                            {!isSelf && (
                              <button
                                onClick={(e) => handleOpenMenu(e, mem)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-[#222430] transition"
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
                            <span className="font-semibold text-slate-900 dark:text-white block font-mono">
                              {inv.email}
                            </span>
                            <span className="text-[10.5px] text-slate-400">
                              Role: <strong>{inv.target_org_role}</strong> • Expires:{' '}
                              {new Date(inv.expires_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRevokeInvitation(inv.id)}
                            className="px-2.5 py-1 rounded border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-[11px] font-semibold transition"
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
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="max-w-2xl bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notification Preferences</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Control operational alerts delivered to your email and dashboard feed.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Support Ticket Replies
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Notify when AAA Engineering posts an update to your ticket thread.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.ticketReplies}
                onChange={(e) =>
                  setNotifications({ ...notifications, ticketReplies: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  E911 Compliance Alerts
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Immediate notification if MSAG/PSAP routing mismatch is detected.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.e911Alerts}
                onChange={(e) =>
                  setNotifications({ ...notifications, e911Alerts: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Onboarding Milestones
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Notify when a property passes contract signing, SOF, or live activation.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.onboardingMilestones}
                onChange={(e) =>
                  setNotifications({ ...notifications, onboardingMilestones: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-[#181920] border border-slate-200/80 dark:border-[#222430]">
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Porting Cutover (FOC) Notifications
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Alert 48 hours prior to carrier live number cutover windows.
                </span>
              </div>
              <input
                type="checkbox"
                checked={notifications.portingCutovers}
                onChange={(e) =>
                  setNotifications({ ...notifications, portingCutovers: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Fixed 3-Dots Action Popup for Team Member */}
      {menuPosition && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuPosition(null)} />
          <div
            style={{ top: `${menuPosition.top}px`, left: `${menuPosition.left}px` }}
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
              className="w-full px-3 py-1.5 text-left hover:bg-slate-50 dark:hover:bg-[#222430] flex items-center gap-2"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-500" />
              <span>Change to {menuPosition.member.role === 'ADMIN' ? 'Member' : 'Admin'}</span>
            </button>

            <div className="border-t border-slate-100 dark:border-[#222430] my-0.5" />

            <button
              onClick={() => {
                const m = menuPosition.member;
                setMenuPosition(null);
                handleRemoveMember(m.id, m.profile?.full_name || 'Member');
              }}
              className="w-full px-3 py-1.5 text-left hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Remove from Organization
            </button>
          </div>
        </>
      )}

      {/* Invite Member Modal */}
      <InviteMemberModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={fetchTeamMembers}
      />
    </div>
  );
}
