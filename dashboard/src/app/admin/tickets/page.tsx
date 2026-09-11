'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  LifeBuoy,
  Search,
  Plus,
  Filter,
  Download,
  MoreVertical,
  Settings,
  ShieldCheck,
  Building2,
  Hotel,
  CheckCircle2,
  AlertCircle,
  Clock,
  SlidersHorizontal,
  X,
  Edit2,
  Trash2,
  Archive,
  BarChart3,
  Layers,
  ArrowUpRight,
  Loader2,
  Check,
  Network,
  LayoutGrid,
  List,
  MessageSquare,
  Send,
  Paperclip,
  UserCheck,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CLIENT' | 'RESOLVED' | 'CLOSED';

interface TicketComment {
  id: string;
  author_name: string;
  author_role: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

interface TicketRecord {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  organization_name: string;
  property_name: string;
  property_city?: string;
  created_by_name: string;
  assigned_to_name: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  comments_count: number;
  comments: TicketComment[];
  created_at: string;
  updated_at: string;
}

const INITIAL_TICKETS: TicketRecord[] = [
  {
    id: 'tkt-1',
    ticket_number: 'TCK-8901',
    subject: 'Inbound Caller ID Name (CNAM) Display Mismatch on Primary Frontdesk DID',
    description: 'Callers to hotel frontdesk are seeing previous hotel brand name on their mobile displays instead of Courtyard Richmond.',
    organization_name: 'Shamin Hotels',
    property_name: 'Courtyard Richmond Downtown',
    property_city: 'Richmond, VA',
    created_by_name: 'Sarah Jenkins',
    assigned_to_name: 'Binoy (Super Admin)',
    priority: 'URGENT',
    status: 'OPEN',
    comments_count: 3,
    comments: [
      {
        id: 'c-1',
        author_name: 'Sarah Jenkins',
        author_role: 'Client Admin',
        content: 'Guests checking in are reporting the wrong hotel name appearing on their caller IDs.',
        is_internal: false,
        created_at: '2025-03-11T14:00:00Z',
      },
      {
        id: 'c-2',
        author_name: 'Binoy',
        author_role: 'Super Admin',
        content: 'CNAM dip query updated in Neustar database. Carrier propagation window is 4 hours.',
        is_internal: true,
        created_at: '2025-03-11T14:30:00Z',
      },
    ],
    created_at: '2025-03-11T14:00:00Z',
    updated_at: '2025-03-11T14:30:00Z',
  },
  {
    id: 'tkt-2',
    ticket_number: 'TCK-8902',
    subject: 'Request for Additional 8 DID Range Block for New Spa / Concierge Desk',
    description: 'We need to provision 8 new sequential direct extensions for the newly renovated spa facility.',
    organization_name: 'ABC Hospitality',
    property_name: 'Marriott Marquis San Francisco',
    property_city: 'San Francisco, CA',
    created_by_name: 'David Ross',
    assigned_to_name: 'Alex Rivera (Support Lead)',
    priority: 'MEDIUM',
    status: 'IN_PROGRESS',
    comments_count: 2,
    comments: [
      {
        id: 'c-3',
        author_name: 'David Ross',
        author_role: 'Client Admin',
        content: 'Please provision 8 DIDs in the (415) NPA-NXX range.',
        is_internal: false,
        created_at: '2025-03-10T11:00:00Z',
      },
    ],
    created_at: '2025-03-10T11:00:00Z',
    updated_at: '2025-03-10T16:00:00Z',
  },
  {
    id: 'tkt-3',
    ticket_number: 'TCK-8903',
    subject: 'Kari&apos;s Law 911 Test Call Notification Email Dispatch Verification',
    description: 'Confirm that frontdesk security receives immediate popup alerts when emergency calls are placed from guestrooms.',
    organization_name: 'Crestview Luxury Resorts',
    property_name: 'Crestview Ocean Grand Resort',
    property_city: 'Miami Beach, FL',
    created_by_name: 'Rachel Adams',
    assigned_to_name: 'Binoy (Super Admin)',
    priority: 'HIGH',
    status: 'WAITING_ON_CLIENT',
    comments_count: 2,
    comments: [
      {
        id: 'c-4',
        author_name: 'Rachel Adams',
        author_role: 'Client Admin',
        content: 'Test completed on room 402, waiting for security log receipt.',
        is_internal: false,
        created_at: '2025-03-09T10:00:00Z',
      },
    ],
    created_at: '2025-03-09T10:00:00Z',
    updated_at: '2025-03-09T15:00:00Z',
  },
  {
    id: 'tkt-4',
    ticket_number: 'TCK-8904',
    subject: 'Porting LOA Signature Verification Completed for Austin Location',
    description: 'Carrier accepted the Letter of Authorization without signature rejection.',
    organization_name: 'Summit Hospitality Partners',
    property_name: 'Residence Inn Austin Downtown',
    property_city: 'Austin, TX',
    created_by_name: 'Kevin Miller',
    assigned_to_name: 'Alex Rivera (Support Lead)',
    priority: 'LOW',
    status: 'RESOLVED',
    comments_count: 1,
    comments: [],
    created_at: '2025-03-05T09:00:00Z',
    updated_at: '2025-03-08T12:00:00Z',
  },
];

export default function AdminTicketsPage() {
  const supabase = createClient();

  const [tickets, setTickets] = useState<TicketRecord[]>(INITIAL_TICKETS);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState('ALL');

  // Modals & Drawers
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [drawerTicket, setDrawerTicket] = useState<TicketRecord | null>(null);

  // New Comment Form
  const [commentText, setCommentText] = useState('');
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);

  // Create Form State
  const [createData, setCreateData] = useState({
    subject: '',
    description: '',
    organization_name: 'Shamin Hotels',
    property_name: 'Courtyard Richmond Downtown',
    priority: 'MEDIUM' as TicketPriority,
    assigned_to_name: 'Binoy (Super Admin)',
  });

  // Filtered
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      const matchesSearch =
        t.ticket_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.organization_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.property_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesPriority = selectedPriorityFilter === 'ALL' || t.priority === selectedPriorityFilter;
      const matchesStatus = selectedStatusFilter === 'ALL' || t.status === selectedStatusFilter;
      const matchesOrg = selectedOrgFilter === 'ALL' || t.organization_name.includes(selectedOrgFilter);

      return matchesSearch && matchesPriority && matchesStatus && matchesOrg;
    });
  }, [tickets, searchQuery, selectedPriorityFilter, selectedStatusFilter, selectedOrgFilter]);

  // KPIs
  const totalOpen = tickets.filter((t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const totalUrgent = tickets.filter((t) => t.priority === 'URGENT').length;
  const totalWaiting = tickets.filter((t) => t.status === 'WAITING_ON_CLIENT').length;
  const totalResolved = tickets.filter((t) => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus, updated_at: new Date().toISOString() } : t))
    );
    if (drawerTicket && drawerTicket.id === ticketId) {
      setDrawerTicket({ ...drawerTicket, status: newStatus });
    }
  };

  const handleUpdatePriority = (ticketId: string, newPriority: TicketPriority) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, priority: newPriority, updated_at: new Date().toISOString() } : t))
    );
    if (drawerTicket && drawerTicket.id === ticketId) {
      setDrawerTicket({ ...drawerTicket, priority: newPriority });
    }
  };

  const handleUpdateAssignee = (ticketId: string, newAssignee: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === ticketId ? { ...t, assigned_to_name: newAssignee } : t))
    );
    if (drawerTicket && drawerTicket.id === ticketId) {
      setDrawerTicket({ ...drawerTicket, assigned_to_name: newAssignee });
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !drawerTicket) return;

    setSubmittingComment(true);

    const newComment: TicketComment = {
      id: `c-${Date.now()}`,
      author_name: 'Binoy (Super Admin)',
      author_role: 'SUPER_ADMIN',
      content: commentText.trim(),
      is_internal: isInternalComment,
      created_at: new Date().toISOString(),
    };

    const updatedComments = [...(drawerTicket.comments || []), newComment];

    setTickets((prev) =>
      prev.map((t) =>
        t.id === drawerTicket.id
          ? {
              ...t,
              comments_count: updatedComments.length,
              comments: updatedComments,
              updated_at: new Date().toISOString(),
            }
          : t
      )
    );

    setDrawerTicket({
      ...drawerTicket,
      comments_count: updatedComments.length,
      comments: updatedComments,
    });

    setCommentText('');
    setSubmittingComment(false);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createData.subject.trim()) return;

    const newTicket: TicketRecord = {
      id: `tkt-${Date.now()}`,
      ticket_number: `TCK-${Math.floor(Math.random() * 9000) + 1000}`,
      subject: createData.subject.trim(),
      description: createData.description.trim() || 'No description provided',
      organization_name: createData.organization_name,
      property_name: createData.property_name,
      property_city: 'Richmond, VA',
      created_by_name: 'Binoy (Super Admin)',
      assigned_to_name: createData.assigned_to_name,
      priority: createData.priority,
      status: 'OPEN',
      comments_count: 0,
      comments: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTickets([newTicket, ...tickets]);
    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Support &amp; Operations Tickets</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
              {totalOpen} Open Issues
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Central ticket management across all tenant organizations, carrier port escalations, and technical inquiries.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4338ca] hover:bg-[#3730a3] text-white font-semibold text-xs transition-colors shadow-sm shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Ticket</span>
          </button>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Tickets */}
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Active Open Tickets
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <LifeBuoy className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalOpen}</span>
              <span className="text-[11px] font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/40">
                +2 in last 24h
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Avg Response</span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">&lt; 18 mins</span>
            </div>
          </div>
        </div>

        {/* Urgent Escalations */}
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Urgent Escalations
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalUrgent}</span>
              <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/40">
                P1 Critical
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Carrier SLA</span>
              <span className="font-semibold text-rose-600 dark:text-rose-400">&lt; 1h SLA</span>
            </div>
          </div>
        </div>

        {/* Waiting on Client */}
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Waiting on Client
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalWaiting}</span>
              <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/40">
                Awaiting Info
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Client Action</span>
              <span className="font-semibold text-amber-700 dark:text-amber-300">Verification</span>
            </div>
          </div>
        </div>

        {/* Resolved Tickets */}
        <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Resolved This Week
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">{totalResolved}</span>
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/40">
                100% SLA OK
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Avg Resolution</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">2.4h</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Search & Filter Bar */}
      <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] p-3 shadow-sm flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search ticket #, subject, client organization, hotel..."
            className="w-full bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] focus:border-[#f97316] focus:bg-white dark:focus:bg-[#1a1b22] rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 dark:text-slate-500 bg-white dark:bg-[#1a1b22] border border-slate-200 dark:border-[#272935] rounded">
            ⌘F
          </div>
        </div>

        {/* Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Priority */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Priority:</span>
            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL" className="dark:bg-[#15161c]">All Priorities</option>
              <option value="URGENT" className="dark:bg-[#15161c]">Urgent</option>
              <option value="HIGH" className="dark:bg-[#15161c]">High</option>
              <option value="MEDIUM" className="dark:bg-[#15161c]">Medium</option>
              <option value="LOW" className="dark:bg-[#15161c]">Low</option>
            </select>
          </div>

          {/* Status */}
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] rounded-lg px-2.5 py-1.5">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="bg-transparent text-slate-800 dark:text-slate-200 font-semibold outline-none cursor-pointer"
            >
              <option value="ALL" className="dark:bg-[#15161c]">All Statuses</option>
              <option value="OPEN" className="dark:bg-[#15161c]">Open</option>
              <option value="IN_PROGRESS" className="dark:bg-[#15161c]">In Progress</option>
              <option value="WAITING_ON_CLIENT" className="dark:bg-[#15161c]">Waiting on Client</option>
              <option value="RESOLVED" className="dark:bg-[#15161c]">Resolved</option>
              <option value="CLOSED" className="dark:bg-[#15161c]">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* 4. Table Representation */}
      <div className="bg-white dark:bg-[#15161c] rounded-xl border border-slate-200 dark:border-[#222430] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] dark:bg-[#111217] border-b border-slate-200 dark:border-[#222430] text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4">Ticket &amp; Subject</th>
                <th className="py-3 px-4">Organization &amp; Property</th>
                <th className="py-3 px-4">Assignee</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Updated</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#1f212a] text-xs">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 dark:text-slate-400">
                    <LifeBuoy className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No support tickets found</p>
                  </td>
                </tr>
              ) : (
                filteredTickets.map((tkt) => (
                  <tr
                    key={tkt.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#1a1b22] transition-colors group cursor-pointer"
                    onClick={() => setDrawerTicket(tkt)}
                  >
                    {/* 1. Ticket & Subject */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#20222a] text-slate-700 dark:text-slate-300 font-mono font-bold text-[10px] border border-slate-200 dark:border-[#2c2f3c]">
                          {tkt.ticket_number}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-[#f97316] transition-colors line-clamp-1">
                          {tkt.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        <span>By {tkt.created_by_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          {tkt.comments_count} replies
                        </span>
                      </div>
                    </td>

                    {/* 2. Organization & Property */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">{tkt.property_name}</div>
                      <div className="text-[11px] text-indigo-600 dark:text-[#f97316] font-semibold mt-0.5">{tkt.organization_name}</div>
                    </td>

                    {/* 3. Assignee */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-medium">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>{tkt.assigned_to_name || 'Unassigned'}</span>
                      </div>
                    </td>

                    {/* 4. Priority */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {tkt.priority === 'URGENT' && (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40">
                          Urgent (P1)
                        </span>
                      )}
                      {tkt.priority === 'HIGH' && (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                          High (P2)
                        </span>
                      )}
                      {tkt.priority === 'MEDIUM' && (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                          Medium
                        </span>
                      )}
                      {tkt.priority === 'LOW' && (
                        <span className="px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-slate-100 dark:bg-[#20222a] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-[#2e313e]">
                          Low
                        </span>
                      )}
                    </td>

                    {/* 5. Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {tkt.status === 'OPEN' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                          Open
                        </span>
                      )}
                      {tkt.status === 'IN_PROGRESS' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                          In Progress
                        </span>
                      )}
                      {tkt.status === 'WAITING_ON_CLIENT' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          Waiting on Client
                        </span>
                      )}
                      {tkt.status === 'RESOLVED' && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          Resolved
                        </span>
                      )}
                    </td>

                    {/* 6. Updated */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(tkt.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* 7. Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setDrawerTicket(tkt)}
                        className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-[#20222a] hover:bg-slate-200 dark:hover:bg-[#282a36] text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-[#2e313e]"
                      >
                        Reply &amp; Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. CREATE TICKET MODAL                                                    */}
      {/* ========================================================================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-[#15161c] rounded-2xl border border-slate-200 dark:border-[#222430] shadow-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-[#222430]">
              <div className="flex items-center gap-2">
                <LifeBuoy className="w-5 h-5 text-[#f97316]" />
                <h3 className="font-bold text-slate-900 dark:text-white">Create Support / Operational Ticket</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Subject</label>
                <input
                  type="text"
                  required
                  value={createData.subject}
                  onChange={(e) => setCreateData({ ...createData, subject: e.target.value })}
                  placeholder="e.g. Inbound DID routing issue"
                  className="w-full bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] focus:bg-white dark:focus:bg-[#1a1b22] focus:border-[#f97316] rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Organization</label>
                  <select
                    value={createData.organization_name}
                    onChange={(e) => setCreateData({ ...createData, organization_name: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] focus:bg-white dark:focus:bg-[#1a1b22] focus:border-[#f97316] rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="Shamin Hotels" className="dark:bg-[#15161c]">Shamin Hotels</option>
                    <option value="ABC Hospitality" className="dark:bg-[#15161c]">ABC Hospitality</option>
                    <option value="Summit Hospitality Partners" className="dark:bg-[#15161c]">Summit Hospitality Partners</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Priority</label>
                  <select
                    value={createData.priority}
                    onChange={(e) => setCreateData({ ...createData, priority: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] focus:bg-white dark:focus:bg-[#1a1b22] focus:border-[#f97316] rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                  >
                    <option value="URGENT" className="dark:bg-[#15161c]">Urgent (P1)</option>
                    <option value="HIGH" className="dark:bg-[#15161c]">High (P2)</option>
                    <option value="MEDIUM" className="dark:bg-[#15161c]">Medium</option>
                    <option value="LOW" className="dark:bg-[#15161c]">Low</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Description</label>
                <textarea
                  rows={3}
                  value={createData.description}
                  onChange={(e) => setCreateData({ ...createData, description: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] focus:bg-white dark:focus:bg-[#1a1b22] focus:border-[#f97316] rounded-lg p-2 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-[#222430]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-[#282a36] hover:bg-slate-50 dark:hover:bg-[#20222a] font-semibold text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold shadow-sm"
                >
                  Create Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TICKET DETAIL & REPLY SLIDE-OVER DRAWER                                */}
      {/* ========================================================================= */}
      {drawerTicket && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#15161c] w-full max-w-2xl h-full shadow-2xl border-l border-slate-200 dark:border-[#222430] flex flex-col animate-in slide-in-from-right duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-200 dark:border-[#222430] bg-slate-50 dark:bg-[#111217] flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-bold border border-indigo-200 dark:border-indigo-800/40">
                    {drawerTicket.ticket_number}
                  </span>
                  <span className="font-semibold text-slate-500 dark:text-slate-400 text-xs">{drawerTicket.organization_name}</span>
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">{drawerTicket.subject}</h2>
              </div>

              <button
                onClick={() => setDrawerTicket(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-[#20222a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Controls Bar */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#222430]">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Status</span>
                  <select
                    value={drawerTicket.status}
                    onChange={(e) => handleUpdateStatus(drawerTicket.id, e.target.value as any)}
                    className="bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#2a2d39] rounded px-2 py-1 font-semibold text-slate-800 dark:text-slate-200 outline-none mt-1 w-full"
                  >
                    <option value="OPEN" className="dark:bg-[#15161c]">Open</option>
                    <option value="IN_PROGRESS" className="dark:bg-[#15161c]">In Progress</option>
                    <option value="WAITING_ON_CLIENT" className="dark:bg-[#15161c]">Waiting on Client</option>
                    <option value="RESOLVED" className="dark:bg-[#15161c]">Resolved</option>
                    <option value="CLOSED" className="dark:bg-[#15161c]">Closed</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Priority</span>
                  <select
                    value={drawerTicket.priority}
                    onChange={(e) => handleUpdatePriority(drawerTicket.id, e.target.value as any)}
                    className="bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#2a2d39] rounded px-2 py-1 font-semibold text-slate-800 dark:text-slate-200 outline-none mt-1 w-full"
                  >
                    <option value="URGENT" className="dark:bg-[#15161c]">Urgent (P1)</option>
                    <option value="HIGH" className="dark:bg-[#15161c]">High (P2)</option>
                    <option value="MEDIUM" className="dark:bg-[#15161c]">Medium</option>
                    <option value="LOW" className="dark:bg-[#15161c]">Low</option>
                  </select>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assignee</span>
                  <select
                    value={drawerTicket.assigned_to_name || 'Binoy (Super Admin)'}
                    onChange={(e) => handleUpdateAssignee(drawerTicket.id, e.target.value)}
                    className="bg-white dark:bg-[#181920] border border-slate-200 dark:border-[#2a2d39] rounded px-2 py-1 font-semibold text-slate-800 dark:text-slate-200 outline-none mt-1 w-full"
                  >
                    <option value="Binoy (Super Admin)" className="dark:bg-[#15161c]">Binoy (Super Admin)</option>
                    <option value="Alex Rivera (Support Lead)" className="dark:bg-[#15161c]">Alex Rivera</option>
                    <option value="Unassigned" className="dark:bg-[#15161c]">Unassigned</option>
                  </select>
                </div>
              </div>

              {/* Initial Issue Description */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-[#222430] bg-white dark:bg-[#15161c] space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Issue Description</span>
                <p className="text-slate-800 dark:text-slate-200 text-xs leading-relaxed">{drawerTicket.description}</p>
              </div>

              {/* Comment Thread */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Communication History &amp; Internal Notes
                </h4>
                <div className="space-y-2.5">
                  {drawerTicket.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border ${
                        c.is_internal
                          ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                          : 'bg-slate-50 dark:bg-[#111217] border-slate-200 dark:border-[#222430]'
                      }`}
                    >
                      <div className="flex items-center justify-between pb-1.5 border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{c.author_name}</span>
                          {c.is_internal && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-300 dark:border-amber-800">
                              <Lock className="w-2.5 h-2.5" /> Internal Note Only
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-800 dark:text-slate-200 text-xs mt-2 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reply Box */}
              <form onSubmit={handleAddComment} className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 dark:text-slate-300">Add Reply / Note</span>
                  <label className="flex items-center gap-1.5 text-xs text-amber-800 dark:text-amber-400 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalComment}
                      onChange={(e) => setIsInternalComment(e.target.checked)}
                      className="w-3.5 h-3.5 rounded text-[#f97316] focus:ring-orange-500"
                    />
                    <span>Make this an Internal Note (hidden from client)</span>
                  </label>
                </div>

                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={
                    isInternalComment
                      ? 'Write an internal engineering note...'
                      : 'Type response to the client organization...'
                  }
                  className="w-full bg-slate-50 dark:bg-[#111217] border border-slate-200 dark:border-[#232530] focus:bg-white dark:focus:bg-[#1a1b22] focus:border-[#f97316] rounded-xl p-3 text-xs text-slate-900 dark:text-slate-100 outline-none"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submittingComment || !commentText.trim()}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#f97316] hover:bg-[#ea580c] text-white font-semibold text-xs shadow-sm disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isInternalComment ? 'Save Internal Note' : 'Send Reply to Client'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
