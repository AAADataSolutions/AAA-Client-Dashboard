'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Building2,
  Plus,
  MoreVertical,
  Layers,
  Users,
  MapPin,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  Edit2,
  ArrowUpRight,
  Check,
  Copy,
  AlertTriangle,
  Eye,
  Send,
  Trash2,
} from 'lucide-react';
import { type OrgRecord } from '@/store/slices/organizationsSlice';
import { type OrgMenuPosition } from './types';

interface OrganizationsTableProps {
  loading: boolean;
  error: string | null;
  fetchOrganizations: () => void;
  displayedOrganizations: OrgRecord[];
  hasActiveFilters: boolean;
  setShowCreateModal: (v: boolean) => void;
  copiedId: string | null;
  handleCopyText: (text: string, label: string, id: string, e?: React.MouseEvent) => void;
  handleOpenContacts: (org: OrgRecord) => void;
  handleOpenProperties: (org: OrgRecord) => void;
  handleOpenMenu: (e: React.MouseEvent<HTMLButtonElement>, org: OrgRecord) => void;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  onUpdatePage: (page: number) => void;
  menuPosition: OrgMenuPosition | null;
  setMenuPosition: (pos: OrgMenuPosition | null) => void;
  setInviteModalOrg: (org: { id: string; name: string } | null) => void;
  handleOpenEditDrawer: (org: OrgRecord) => void;
  handleUpdateStatus: (orgId: string, newStatus: string) => void;
  setOrgToDelete: (org: OrgRecord | null) => void;
}

export function OrganizationsTable({
  loading,
  error,
  fetchOrganizations,
  displayedOrganizations,
  hasActiveFilters,
  setShowCreateModal,
  copiedId,
  handleCopyText,
  handleOpenContacts,
  handleOpenProperties,
  handleOpenMenu,
  totalCount,
  currentPage,
  totalPages,
  onUpdatePage,
  menuPosition,
  setMenuPosition,
  setInviteModalOrg,
  handleOpenEditDrawer,
  handleUpdateStatus,
  setOrgToDelete,
}: OrganizationsTableProps) {
  return (
    <>
      {/* 4. Organization Table */}
      {loading ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-6 space-y-4 shadow-xs animate-pulse">
          <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800/50 rounded-lg" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-6 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
          <button
            onClick={fetchOrganizations}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-2xs transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : displayedOrganizations.length === 0 ? (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No management groups found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {hasActiveFilters
              ? 'No management groups matched your search and filter criteria.'
              : 'Create your first management group to begin onboarding and managing telecom services.'}
          </p>
          {!hasActiveFilters && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 shadow-xs transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create Management Group
            </motion.button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#15161c] border border-slate-200/80 dark:border-[#222430] rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto [scrollbar-width:thin]">
            <table className="w-full text-left border-collapse min-w-[1320px]">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-[#222430] bg-slate-50/75 dark:bg-[#12131a]/80">
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap w-16">
                    Logo
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[240px]">
                    Management Group Name
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[110px]">
                    Type
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[150px]">
                    Primary Contact
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[180px]">
                    Email
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[120px]">
                    Phone
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center whitespace-nowrap min-w-[100px]">
                    People Count
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-center whitespace-nowrap min-w-[100px]">
                    Properties
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[110px]">
                    Status
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap min-w-[110px]">
                    Created At
                  </th>
                  <th className="py-3 px-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right whitespace-nowrap min-w-[110px]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#20222c] text-xs">
                {displayedOrganizations.map((org: OrgRecord) => {
                  const peopleCount = org.people_count || (org as any).contacts_count || (org.members?.length || 1);

                  return (
                    <tr
                      key={org.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-[#181922] transition-colors group"
                    >
                      {/* Column 1: Organization Logo */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap w-16">
                        {org.logo_url ? (
                          <img
                            src={org.logo_url}
                            alt={`${org.name} logo`}
                            className="w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-[#2a2d39]"
                          />
                        ) : (
                          <div
                            aria-label={`${org.name} logo placeholder`}
                            className="w-9 h-9 rounded-lg bg-blue-600/10 dark:bg-blue-500/15 border border-blue-200 dark:border-blue-900/50 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold"
                          >
                            {org.name?.trim().charAt(0).toUpperCase() || '?'}
                          </div>
                        )}
                      </td>

                      {/* Column 2: Management Group Name with Address directly under */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[240px]">
                        <div className="flex flex-col gap-0.5">
                          <Link
                            href={`/admin/organizations/${org.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer flex items-center gap-1.5"
                          >
                            <span>{org.name}</span>
                            <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </Link>
                          <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[240px]" title={org.address}>
                            <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                            <span className="truncate">{org.address || 'Address not specified'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Column 3: Type (Individual vs Group) */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[110px]">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold border ${
                            (org.type || 'GROUP') === 'INDIVIDUAL'
                              ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25'
                          }`}
                        >
                          {(org.type || 'GROUP') === 'INDIVIDUAL' ? 'Individual' : 'Group'}
                        </span>
                      </td>

                      {/* Column 4: Primary Contact Name */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[150px]">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {org.contact_name || (org as any).primary_contact_name || '—'}
                        </span>
                      </td>

                      {/* Column 4: Email */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[180px]">
                        {org.email && org.email !== '—' ? (
                          <button
                            onClick={(e) => handleCopyText(org.email, 'Email', `email-${org.id}`, e)}
                            className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer group/copy"
                          >
                            <span>{org.email}</span>
                            {copiedId === `email-${org.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 text-slate-400" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Column 5: Phone */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[120px]">
                        {org.phone && org.phone !== '—' ? (
                          <button
                            onClick={(e) => handleCopyText(org.phone, 'Phone', `phone-${org.id}`, e)}
                            className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer group/copy"
                          >
                            <span>{org.phone}</span>
                            {copiedId === `phone-${org.id}` ? (
                              <Check className="w-3 h-3 text-emerald-500" />
                            ) : (
                              <Copy className="w-3 h-3 opacity-0 group-hover/copy:opacity-100 text-slate-400" />
                            )}
                          </button>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Column 6: People Count */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap min-w-[100px]">
                        <button
                          onClick={() => handleOpenContacts(org)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 dark:bg-[#1f212a] dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-semibold text-xs transition cursor-pointer"
                        >
                          <Users className="w-3 h-3 text-slate-400" />
                          <span>{peopleCount}</span>
                        </button>
                      </td>

                      {/* Column 7: Properties Count */}
                      <td className="py-3.5 px-3.5 text-center whitespace-nowrap min-w-[100px]">
                        <button
                          onClick={() => handleOpenProperties(org)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 hover:bg-blue-50 dark:bg-[#1f212a] dark:hover:bg-blue-950/40 text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-semibold text-xs transition cursor-pointer"
                        >
                          <Layers className="w-3 h-3 text-slate-400" />
                          <span>{org.properties_count || 0}</span>
                        </button>
                      </td>

                      {/* Column 8: Status */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[110px]">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                            org.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : org.status === 'INACTIVE'
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                              : org.status === 'PENDING_ONBOARDING'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              org.status === 'ACTIVE'
                                ? 'bg-emerald-500'
                                : org.status === 'INACTIVE'
                                ? 'bg-rose-500'
                                : org.status === 'PENDING_ONBOARDING'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                            }`}
                          />
                          {org.status === 'ACTIVE'
                            ? 'Active'
                            : org.status === 'INACTIVE'
                            ? 'Inactive'
                            : org.status === 'PENDING_ONBOARDING'
                            ? 'Pending'
                            : org.status === 'SUSPENDED'
                            ? 'Suspended'
                            : 'Archived'}
                        </span>
                      </td>

                      {/* Column 9: Created At */}
                      <td className="py-3.5 px-3.5 whitespace-nowrap min-w-[110px] text-slate-500 dark:text-slate-400 text-xs">
                        {new Date(org.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      {/* Column 10: Actions (3-Dots Trigger) */}
                      <td className="py-3.5 px-3.5 text-right whitespace-nowrap min-w-[110px]">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/organizations/${org.id}`}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer"
                            title="View Organization Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={(e) => handleOpenMenu(e, org)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#20222a] transition cursor-pointer"
                            title="More Actions"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="p-3.5 border-t border-slate-200/80 dark:border-[#222430] bg-slate-50/50 dark:bg-[#12131a]/50 flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              Showing <strong className="text-slate-900 dark:text-white">{displayedOrganizations.length}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{totalCount}</strong> organizations
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdatePage(Math.max(1, currentPage - 1))}
                disabled={currentPage <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-[#1a1b22] transition cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-semibold text-slate-700 dark:text-slate-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => onUpdatePage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-[#252733] text-slate-600 dark:text-slate-300 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-[#1a1b22] transition cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed 3-Dots Action Menu (Upside Floating) */}
      {menuPosition && (
        <div
          style={{
            position: 'fixed',
            bottom: `${menuPosition.bottom}px`,
            left: `${menuPosition.left}px`,
            zIndex: 9999,
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-56 bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#252733] rounded-xl shadow-2xl py-1.5 text-xs animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-3 py-1.5 border-b border-slate-100 dark:border-[#222430]">
            <p className="font-bold text-slate-900 dark:text-white truncate">{menuPosition.org.name}</p>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
              Action Menu
            </span>
          </div>

          <Link
            href={`/admin/organizations/${menuPosition.org.id}`}
            onClick={() => setMenuPosition(null)}
            className="flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Full Details</span>
          </Link>

          <button
            onClick={() => {
              const targetOrg = menuPosition.org;
              setMenuPosition(null);
              setInviteModalOrg({ id: targetOrg.id, name: targetOrg.name });
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition cursor-pointer text-left font-semibold"
          >
            <Send className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Generate / View Invite Link</span>
          </button>

          <button
            onClick={() => handleOpenEditDrawer(menuPosition.org)}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212a] transition cursor-pointer text-left"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Edit Organization</span>
          </button>

          <button
            onClick={() => handleOpenContacts(menuPosition.org)}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212a] transition cursor-pointer text-left"
          >
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Manage Contacts</span>
          </button>

          <button
            onClick={() => handleOpenProperties(menuPosition.org)}
            className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1f212a] transition cursor-pointer text-left"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Assigned Properties</span>
          </button>

          <div className="border-t border-slate-100 dark:border-[#222430] my-1" />

          {menuPosition.org.status !== 'ACTIVE' && (
            <button
              onClick={() => handleUpdateStatus(menuPosition.org.id, 'ACTIVE')}
              className="w-full flex items-center gap-2 px-3 py-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition cursor-pointer text-left font-semibold"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Set as Active</span>
            </button>
          )}

          {menuPosition.org.status !== 'INACTIVE' && (
            <button
              onClick={() => handleUpdateStatus(menuPosition.org.id, 'INACTIVE')}
              className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer text-left font-semibold"
            >
              <X className="w-3.5 h-3.5" />
              <span>Set as Inactive</span>
            </button>
          )}

          {menuPosition.org.status !== 'SUSPENDED' && (
            <button
              onClick={() => handleUpdateStatus(menuPosition.org.id, 'SUSPENDED')}
              className="w-full flex items-center gap-2 px-3 py-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition cursor-pointer text-left font-semibold"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Suspend Tenant</span>
            </button>
          )}

          <div className="border-t border-slate-100 dark:border-[#222430] my-1" />

          <button
            onClick={() => {
              setOrgToDelete(menuPosition.org);
              setMenuPosition(null);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer text-left font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Organization</span>
          </button>
        </div>
      )}
    </>
  );
}
