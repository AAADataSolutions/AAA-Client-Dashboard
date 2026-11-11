'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  Network,
  Search,
  Plus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  Upload,
  Trash2,
  DollarSign,
  Building2,
  Hotel,
  MapPin,
  ArrowUpRight,
  X,
  Check,
  Loader2,
  Eye,
  Edit2,
  ShieldCheck,
  Server,
  Calendar,
  Copy,
  ExternalLink,
  Sparkles,
  Layers,
  Info,
  Phone,
} from 'lucide-react';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export type CircuitStatus =
  | 'STARTED'
  | 'PRICING_FINALIZED'
  | 'QUOTATION_SENT'
  | 'PAPERWORK_SIGNED'
  | 'SITE_SURVEY'
  | 'FOC_STAGE'
  | 'INSTALLED'
  | 'CANCELLED'
  | 'REQUESTED'; // backward compatibility

const CIRCUIT_STAGES: {
  key: CircuitStatus;
  label: string;
  step: number;
  desc: string;
}[] = [
  { key: 'STARTED', label: '1. Started', step: 1, desc: 'New data circuit request initiated' },
  { key: 'PRICING_FINALIZED', label: '2. Wholesaler Pricing Finalized', step: 2, desc: 'Wholesaler offer evaluated & price finalized' },
  { key: 'QUOTATION_SENT', label: '3. Quotation Sent', step: 3, desc: 'Winning carrier proposal sent to client' },
  { key: 'PAPERWORK_SIGNED', label: '4. Paperwork Signed', step: 4, desc: 'Signed Agreement PDF uploaded (Required Gate)' },
  { key: 'SITE_SURVEY', label: '5. Site Survey', step: 5, desc: 'On-site technical survey status' },
  { key: 'FOC_STAGE', label: '6. FOC Confirmed / Pending', step: 6, desc: 'FOC date and cutover actions' },
  { key: 'INSTALLED', label: '7. Installed', step: 7, desc: 'Circuit live & operational' },
];

function getCircuitStageBadge(status: string) {
  switch (status) {
    case 'STARTED':
    case 'REQUESTED':
      return {
        label: '1. Started',
        bg: 'bg-slate-100 dark:bg-slate-800/80',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        pct: 14,
      };
    case 'PRICING_FINALIZED':
      return {
        label: '2. Pricing Finalized',
        bg: 'bg-blue-50 dark:bg-blue-950/50',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800/50',
        pct: 28,
      };
    case 'QUOTATION_SENT':
      return {
        label: '3. Quotation Sent',
        bg: 'bg-indigo-50 dark:bg-indigo-950/50',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800/50',
        pct: 42,
      };
    case 'PAPERWORK_SIGNED':
      return {
        label: '4. Paperwork Signed',
        bg: 'bg-teal-50 dark:bg-teal-950/50',
        text: 'text-teal-700 dark:text-teal-300',
        border: 'border-teal-200 dark:border-teal-800/50',
        pct: 57,
      };
    case 'SITE_SURVEY':
      return {
        label: '5. Site Survey',
        bg: 'bg-purple-50 dark:bg-purple-950/50',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800/50',
        pct: 71,
      };
    case 'FOC_STAGE':
      return {
        label: '6. FOC Status',
        bg: 'bg-amber-50 dark:bg-amber-950/50',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800/50',
        pct: 85,
      };
    case 'INSTALLED':
      return {
        label: '7. Installed',
        bg: 'bg-emerald-50 dark:bg-emerald-950/50',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800/50',
        pct: 100,
      };
    case 'CANCELLED':
      return {
        label: 'Cancelled',
        bg: 'bg-rose-50 dark:bg-rose-950/50',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800/50',
        pct: 0,
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        pct: 14,
      };
  }
}

interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

interface WholesalerItem {
  id: string;
  name: string;
  phone?: string | null;
}

export default function AdminDataCircuitsPage(props?: any) {
  const defaultView: 'PIPELINE' | 'INSTALLED' = props?.defaultView === 'INSTALLED' ? 'INSTALLED' : 'PIPELINE';
  const [activeViewTab, setActiveViewTab] = useState<'PIPELINE' | 'INSTALLED'>(defaultView);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab')?.toUpperCase();
      if (tabParam === 'INSTALLED') {
        setActiveViewTab('INSTALLED');
      } else if (tabParam === 'PIPELINE') {
        setActiveViewTab('PIPELINE');
      }
    }
  }, []);
  const now = new Date();
  const defaultMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState(defaultMonthKey);

  // Data state
  const [circuits, setCircuits] = useState<any[]>([]);
  const [properties, setProperties] = useState<any[]>([]);
  const [monthlyRevenueRows, setMonthlyRevenueRows] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalCircuits: 0,
    installedCircuits: 0,
    inProgressCircuits: 0,
    expectedMonthlyRevShare: 0,
    receivedMonthlyRevShare: 0,
    pendingMonthlyRevShare: 0,
  });
  const [tableMissing, setTableMissing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Wholesalers Management State
  const [wholesalers, setWholesalers] = useState<WholesalerItem[]>([]);
  const [showWholesalersModal, setShowWholesalersModal] = useState(false);
  const [wholesalerForm, setWholesalerForm] = useState({ id: '', name: '', phone: '' });
  const [editingWholesalerId, setEditingWholesalerId] = useState<string | null>(null);
  const [savingWholesaler, setSavingWholesaler] = useState(false);
  const [deletingWholesalerId, setDeletingWholesalerId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const pipelineCircuits = useMemo(
    () => circuits.filter((c) => c.status !== 'INSTALLED'),
    [circuits]
  );
  const installedCircuitsList = useMemo(
    () => circuits.filter((c) => c.status === 'INSTALLED'),
    [circuits]
  );
  const displayedCircuits = useMemo(
    () => (activeViewTab === 'INSTALLED' ? installedCircuitsList : pipelineCircuits),
    [activeViewTab, installedCircuitsList, pipelineCircuits]
  );

  // Create Circuit Modal (Initial status: 'STARTED')
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    property_id: '',
    connectivity_type: 'BOTH' as 'PORTED' | 'DATA_CIRCUITED' | 'BOTH',
    status: 'STARTED' as CircuitStatus,
    technical_details: '',
    internal_admin_notes: '',
  });

  // Unified Manage Circuit Modal - default tab: 'PRICING'
  const [selectedCircuit, setSelectedCircuit] = useState<any | null>(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [modalTab, setModalTab] = useState<'PRICING' | 'STAGES' | 'TECHNICAL' | 'QUOTATION_PREVIEW'>('PRICING');

  // Quote Add Form inside Manage Modal (Wholesaler Pricing Management)
  const [newQuoteForm, setNewQuoteForm] = useState({
    wholesaler_name: '',
    carrier_name: '',
    bandwidth: '1 Gig',
    quoted_monthly_price: '',
    proposed_rev_share_percentage: '10',
    is_selected: false,
    notes: '',
  });
  const [addingQuote, setAddingQuote] = useState(false);

  // Stage & Details Form inside Manage Modal
  const [stageForm, setStageForm] = useState({
    status: 'STARTED' as CircuitStatus,
    wholesaler_name: '',
    carrier_name: '',
    bandwidth: '1 Gig',
    circuit_monthly_price: '' as string | number,
    revenue_share_percentage: '' as string | number,
    connectivity_type: 'BOTH' as 'PORTED' | 'DATA_CIRCUITED' | 'BOTH',
    site_survey_status: 'PENDING',
    site_survey_notes: '',
    foc_status: 'PENDING_ACTIONS',
    foc_date: '',
    foc_pending_actions_notes: '',
    technical_details: '',
    internal_admin_notes: '',
  });
  const [savingStage, setSavingStage] = useState(false);

  // PDF Agreement Upload state
  const [agreementFile, setAgreementFile] = useState<File | null>(null);
  const [uploadingPdf, setUploadingPdf] = useState(false);

  // Toggling Monthly Revenue Received Yes/No
  const [togglingCircuitId, setTogglingCircuitId] = useState<string | null>(null);

  // Delete Confirmation
  const [circuitToDelete, setCircuitToDelete] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  // Fetch Wholesalers directory
  const fetchWholesalers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/data-circuits/wholesalers');
      const json = await res.json();
      if (json.success && json.data) {
        setWholesalers(json.data);
      }
    } catch (err) {
      console.error('Failed to load wholesalers', err);
    }
  }, []);

  useEffect(() => {
    fetchWholesalers();
  }, [fetchWholesalers]);

  const handleSaveWholesaler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wholesalerForm.name.trim()) {
      showToast('Name required', 'Wholesaler name cannot be empty.', 'error');
      return;
    }
    try {
      setSavingWholesaler(true);
      const isEdit = Boolean(editingWholesalerId);
      const res = await fetch('/api/admin/data-circuits/wholesalers', {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingWholesalerId,
          name: wholesalerForm.name.trim(),
          phone: wholesalerForm.phone?.trim() || '',
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to save wholesaler');
      }
      showToast(isEdit ? 'Wholesaler Updated' : 'Wholesaler Added', `${wholesalerForm.name} saved.`);
      setWholesalerForm({ id: '', name: '', phone: '' });
      setEditingWholesalerId(null);
      fetchWholesalers();
    } catch (err: any) {
      showToast('Save failed', err.message, 'error');
    } finally {
      setSavingWholesaler(false);
    }
  };

  const handleDeleteWholesaler = async (id: string, name: string) => {
    try {
      setDeletingWholesalerId(id);
      const res = await fetch(`/api/admin/data-circuits/wholesalers?id=${id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete wholesaler');
      }
      showToast('Wholesaler Removed', `${name} deleted.`);
      if (editingWholesalerId === id) {
        setEditingWholesalerId(null);
        setWholesalerForm({ id: '', name: '', phone: '' });
      }
      fetchWholesalers();
    } catch (err: any) {
      showToast('Delete failed', err.message, 'error');
    } finally {
      setDeletingWholesalerId(null);
    }
  };

  const fetchCircuitsData = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: selectedMonth,
        status: statusFilter,
        search: searchQuery,
      });
      const res = await fetch(`/api/admin/data-circuits?${params.toString()}`);
      const json = await res.json();
      if (json.success) {
        setCircuits(json.data || []);
        setProperties(json.properties || []);
        setMonthlyRevenueRows(json.monthlyRevenueRows || []);
        if (json.metrics) setMetrics(json.metrics);
        setTableMissing(Boolean(json.tableMissing));

        if (selectedCircuit) {
          const refreshed = (json.data || []).find((c: any) => c.id === selectedCircuit.id);
          if (refreshed) setSelectedCircuit(refreshed);
        }
      } else {
        showToast('Error loading Data Circuits', json.error, 'error');
      }
    } catch (err: any) {
      showToast('Failed to load Data Circuits', err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, statusFilter, searchQuery, showToast, selectedCircuit?.id]);

  useEffect(() => {
    fetchCircuitsData();
  }, [selectedMonth, statusFilter, searchQuery]);

  const handleOpenManageModal = (circuit: any, initialTab: 'PRICING' | 'STAGES' | 'TECHNICAL' | 'QUOTATION_PREVIEW' = 'PRICING') => {
    setSelectedCircuit(circuit);
    setModalTab(initialTab);
    setStageForm({
      status: circuit.status || 'STARTED',
      wholesaler_name: circuit.wholesaler_name || '',
      carrier_name: circuit.carrier_name || '',
      bandwidth: circuit.bandwidth || '1 Gig',
      circuit_monthly_price: circuit.circuit_monthly_price ?? 0,
      revenue_share_percentage: circuit.revenue_share_percentage ?? 10,
      connectivity_type: circuit.property_connectivity_type || 'BOTH',
      site_survey_status: circuit.site_survey_status || 'PENDING',
      site_survey_notes: circuit.site_survey_notes || '',
      foc_status: circuit.foc_status || 'PENDING_ACTIONS',
      foc_date: circuit.foc_date ? String(circuit.foc_date).slice(0, 10) : '',
      foc_pending_actions_notes: circuit.foc_pending_actions_notes || '',
      technical_details: circuit.technical_details || '',
      internal_admin_notes: circuit.internal_admin_notes || '',
    });
    setAgreementFile(null);
    setShowManageModal(true);
  };

  const handleCreateCircuit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.property_id) {
      showToast('Property required', 'Please select a property for this Data Circuit.', 'error');
      return;
    }

    try {
      setCreating(true);
      const res = await fetch('/api/admin/data-circuits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          property_id: createForm.property_id,
          connectivity_type: createForm.connectivity_type,
          status: 'STARTED',
          technical_details: createForm.technical_details,
          internal_admin_notes: createForm.internal_admin_notes,
          quotes: [],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to create Data Circuit');
      }
      showToast('Data Circuit Created', 'Circuit started. Open Manage to add wholesaler pricing.');
      setShowCreateModal(false);
      setCreateForm({
        property_id: '',
        connectivity_type: 'BOTH',
        status: 'STARTED',
        technical_details: '',
        internal_admin_notes: '',
      });
      fetchCircuitsData();
    } catch (err: any) {
      showToast('Creation failed', err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleAddWholesalerQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCircuit) return;
    if (!newQuoteForm.wholesaler_name.trim() || !newQuoteForm.carrier_name.trim()) {
      showToast('Missing fields', 'Both Wholesaler Name and Carrier Name are required.', 'error');
      return;
    }
    try {
      setAddingQuote(true);
      const res = await fetch('/api/admin/data-circuits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCircuit.id,
          action: 'ADD_QUOTE',
          ...newQuoteForm,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to add pricing');
      }
      showToast('Pricing Added', `${newQuoteForm.carrier_name} ($${newQuoteForm.quoted_monthly_price}/mo) added.`);
      setNewQuoteForm({
        wholesaler_name: '',
        carrier_name: '',
        bandwidth: '1 Gig',
        quoted_monthly_price: '',
        proposed_rev_share_percentage: '10',
        is_selected: false,
        notes: '',
      });
      await fetchCircuitsData();
    } catch (err: any) {
      showToast('Error adding pricing', err.message, 'error');
    } finally {
      setAddingQuote(false);
    }
  };

  const handleFinalizePrice = async (quote: any) => {
    if (!selectedCircuit) return;
    try {
      setSavingStage(true);
      const res = await fetch('/api/admin/data-circuits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCircuit.id,
          action: 'SELECT_QUOTE',
          quote_id: quote.id,
          send_quotation: false,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to finalize price');
      }
      setStageForm((prev) => ({
        ...prev,
        status: 'PRICING_FINALIZED',
        wholesaler_name: quote.wholesaler_name,
        carrier_name: quote.carrier_name,
        bandwidth: quote.bandwidth,
        circuit_monthly_price: quote.quoted_monthly_price,
        revenue_share_percentage: quote.proposed_rev_share_percentage,
      }));
      showToast(
        'Wholesaler Price Finalized!',
        `Selected ${quote.wholesaler_name} / ${quote.carrier_name} ($${quote.quoted_monthly_price}/mo). Moved to stage: 2. Wholesaler Pricing Finalized.`
      );
      await fetchCircuitsData();
    } catch (err: any) {
      showToast('Finalize failed', err.message, 'error');
    } finally {
      setSavingStage(false);
    }
  };

  const handleSelectWinningQuote = async (quote: any, sendQuotation = false) => {
    if (!selectedCircuit) return;
    try {
      setSavingStage(true);
      const res = await fetch('/api/admin/data-circuits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCircuit.id,
          action: 'SELECT_QUOTE',
          quote_id: quote.id,
          send_quotation: sendQuotation,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to select quote');
      }
      setStageForm((prev) => ({
        ...prev,
        status: json.data.status,
        wholesaler_name: quote.wholesaler_name,
        carrier_name: quote.carrier_name,
        bandwidth: quote.bandwidth,
        circuit_monthly_price: quote.quoted_monthly_price,
        revenue_share_percentage: quote.proposed_rev_share_percentage,
      }));
      showToast(
        sendQuotation ? 'Quotation Sent to Client!' : 'Price Finalized',
        `Carrier: ${quote.carrier_name} ($${quote.quoted_monthly_price}/mo) at ${quote.proposed_rev_share_percentage}% share.`
      );
      await fetchCircuitsData();
    } catch (err: any) {
      showToast('Selection failed', err.message, 'error');
    } finally {
      setSavingStage(false);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!selectedCircuit) return;
    try {
      await fetch('/api/admin/data-circuits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCircuit.id,
          action: 'DELETE_QUOTE',
          quote_id: quoteId,
        }),
      });
      showToast('Pricing Removed');
      await fetchCircuitsData();
    } catch (err: any) {
      showToast('Failed to delete pricing', err.message, 'error');
    }
  };

  const handleUploadAgreementPdf = async (advanceStage = true) => {
    if (!selectedCircuit || !agreementFile) {
      showToast('Select PDF File', 'Please choose the signed Agreement PDF file first.', 'error');
      return;
    }
    try {
      setUploadingPdf(true);
      const fd = new FormData();
      fd.append('circuit_id', selectedCircuit.id);
      fd.append('file', agreementFile);
      fd.append('advance_stage', advanceStage ? 'true' : 'false');

      const res = await fetch('/api/admin/data-circuits/attachment', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to upload Agreement PDF');
      }
      setAgreementFile(null);
      if (advanceStage) {
        setStageForm((prev) => ({ ...prev, status: 'PAPERWORK_SIGNED' }));
      }
      showToast('Signed Agreement PDF Uploaded', 'Paperwork gate unlocked for Site Survey, FOC, and Installation.');
      await fetchCircuitsData();
    } catch (err: any) {
      showToast('Upload failed', err.message, 'error');
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleSaveCircuitChanges = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCircuit) return;

    const stagesRequiringPdf = ['PAPERWORK_SIGNED', 'SITE_SURVEY', 'FOC_STAGE', 'INSTALLED'];
    const hasPdf = Boolean(
      selectedCircuit.agreement_storage_path ||
      selectedCircuit.agreement_file_url ||
      selectedCircuit.agreement_file_name
    );

    if (stagesRequiringPdf.includes(stageForm.status) && !hasPdf) {
      showToast(
        'Agreement PDF Required',
        'Please upload the signed Agreement PDF before advancing to Paperwork Signed, Site Survey, FOC, or Installed.',
        'error'
      );
      return;
    }

    try {
      setSavingStage(true);
      const res = await fetch('/api/admin/data-circuits', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedCircuit.id,
          ...stageForm,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update Data Circuit');
      }
      if (stageForm.status === 'INSTALLED' && selectedCircuit.status !== 'INSTALLED') {
        showToast(
          'Circuit Installed & Moved!',
          `${selectedCircuit.property_name} is now INSTALLED and moved to the Data Circuit Installed tab.`
        );
        setShowManageModal(false);
      } else {
        showToast('Data Circuit Updated', `Saved stage (${stageForm.status}) and circuit configuration.`);
      }
      await fetchCircuitsData();
    } catch (err: any) {
      showToast('Update failed', err.message, 'error');
    } finally {
      setSavingStage(false);
    }
  };

  const handleToggleMonthlyRevenue = async (circuitId: string, receiveYes: boolean) => {
    try {
      setTogglingCircuitId(circuitId);
      const res = await fetch('/api/admin/data-circuits/monthly-revenue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data_circuit_id: circuitId,
          month_key: selectedMonth,
          revenue_received: receiveYes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to update monthly revenue status');
      }
      showToast(
        receiveYes ? 'Monthly Revenue Added (Yes)' : 'Marked as Not Received (No)',
        receiveYes
          ? `Added $${Number(json.data.revenue_share_amount || 0).toFixed(2)} to ${selectedMonth} revenue & Finances dashboard.`
          : `Removed from ${selectedMonth} received revenue.`
      );
      await fetchCircuitsData();
    } catch (err: any) {
      showToast('Error updating revenue share', err.message, 'error');
    } finally {
      setTogglingCircuitId(null);
    }
  };

  const handleDeleteCircuit = async () => {
    if (!circuitToDelete) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/data-circuits?id=${circuitToDelete.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to delete Data Circuit');
      }
      showToast('Data Circuit Deleted');
      setCircuitToDelete(null);
      if (selectedCircuit?.id === circuitToDelete.id) {
        setShowManageModal(false);
        setSelectedCircuit(null);
      }
      await fetchCircuitsData();
    } catch (err: any) {
      showToast('Delete failed', err.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (val: number) =>
    `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const computedRevSharePreview = useMemo(() => {
    const p = Number(newQuoteForm.quoted_monthly_price || 0);
    const r = Number(newQuoteForm.proposed_rev_share_percentage || 0);
    return Math.round(p * (r / 100) * 100) / 100;
  }, [newQuoteForm.quoted_monthly_price, newQuoteForm.proposed_rev_share_percentage]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-20 font-sans max-w-7xl mx-auto"
    >
      {/* Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`pointer-events-auto p-4 rounded-xl shadow-xl border flex items-start gap-3 ${
                t.type === 'error'
                  ? 'bg-rose-950/95 border-rose-800 text-white'
                  : 'bg-slate-900/95 border-slate-700 text-white'
              }`}
            >
              {t.type === 'error' ? (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="text-xs">
                <p className="font-bold">{t.title}</p>
                {t.message && <p className="text-slate-300 mt-0.5">{t.message}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Header */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#222430]"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shrink-0">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Data Circuit & Wholesaler Revenue Share
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Request wholesaler quotes, finalize winning prices, send client quotations (wholesaler hidden), enforce Agreement PDF sign-off, and track monthly revenue share.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowWholesalersModal(true)}
            className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1e202b] text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
            title="Manage Wholesalers Directory"
          >
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Wholesalers ({wholesalers.length})</span>
          </button>

          <button
            onClick={() => fetchCircuitsData()}
            className="p-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#1d1f29] transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> New Data Circuit Request
          </button>
        </div>
      </motion.div>

      {tableMissing && (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Database Migration Pending</p>
            <p className="mt-0.5">
              Please run <code className="font-mono font-bold">DB_Queries/24_data_circuits_schema.sql</code> and{' '}
              <code className="font-mono font-bold">27_update_circuit_stages_enum.sql</code> in your Supabase SQL Editor to initialize all 7 lifecycle stages.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards - Deep Blue Theme */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Total Data Circuits</span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <Network className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{metrics.totalCircuits}</span>
            <span className="text-xs text-blue-200 font-medium">({metrics.inProgressCircuits} in pipeline)</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Active requests, quotes &amp; live installations
          </p>
        </div>

        {/* Card 2: Installed & Live */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">Installed &amp; Live</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-300">
              {metrics.installedCircuits}
            </span>
            <span className="text-xs text-blue-200 font-medium">live properties</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Synced to Admin &amp; Client Property pages
          </p>
        </div>

        {/* Card 3: Expected Monthly Rev Share */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              Expected Monthly Rev Share
            </span>
            <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-blue-200" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white">{formatCurrency(metrics.expectedMonthlyRevShare)}</span>
            <span className="text-[11px] text-blue-200">/ month</span>
          </div>
          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Total AAA commission across wholesalers
          </p>
        </div>

        {/* Card 4: Received Monthly Rev Share */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-900 to-blue-800 text-white border border-blue-700/50 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-200">
              Received ({selectedMonth})
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Check className="w-4 h-4 text-emerald-300" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-black text-white">{formatCurrency(metrics.receivedMonthlyRevShare)}</span>
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/15 text-blue-100 font-bold">
              Pending: {formatCurrency(metrics.pendingMonthlyRevShare)}
            </span>
          </div>
          <p className="text-[11px] text-blue-200 mt-2 pt-2 border-t border-white/10">
            Confirmed received &amp; added to Finances GMR
          </p>
        </div>
      </motion.div>

      {/* 2 MAIN TABS: DATA CIRCUIT PIPELINE vs DATA CIRCUIT INSTALLED */}
      <motion.div
        variants={itemVariants}
        className="flex flex-wrap items-center gap-2 bg-white dark:bg-[#15161c] p-2 rounded-2xl border border-slate-200/80 dark:border-[#222430] shadow-xs"
      >
        <button
          type="button"
          onClick={() => {
            setActiveViewTab('PIPELINE');
            setStatusFilter('ALL');
          }}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
            activeViewTab === 'PIPELINE'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e202b]'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Data Circuit Pipeline</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeViewTab === 'PIPELINE'
                ? 'bg-white/20 text-white'
                : 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
            }`}
          >
            {pipelineCircuits.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveViewTab('INSTALLED');
            setStatusFilter('ALL');
          }}
          className={`flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer ${
            activeViewTab === 'INSTALLED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1e202b]'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Data Circuit Installed</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[11px] font-black ${
              activeViewTab === 'INSTALLED'
                ? 'bg-white/20 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
            }`}
          >
            {installedCircuitsList.length}
          </span>
        </button>

        <span className="text-[11px] text-slate-400 ml-auto hidden md:inline pr-2">
          {activeViewTab === 'PIPELINE'
            ? 'Showing active pipeline circuits (Stages 1–6). Circuits automatically move to Installed once Stage 7 is saved.'
            : 'Showing live, installed Data Circuits (Stage 7: Installed).'}
        </span>
      </motion.div>

      {/* Filter and Search Bar */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#15161c] p-3 rounded-2xl border border-slate-200/80 dark:border-[#222430]"
      >
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 ${
              activeViewTab === 'INSTALLED'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300'
                : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200/60 dark:border-blue-800/40 text-blue-700 dark:text-blue-300'
            }`}
          >
            {activeViewTab === 'INSTALLED' ? <CheckCircle2 className="w-4 h-4" /> : <Network className="w-4 h-4" />}
            <span>
              {activeViewTab === 'INSTALLED'
                ? `Installed Data Circuits (${displayedCircuits.length})`
                : `Pipeline Circuits (${displayedCircuits.length})`}
            </span>
          </div>
        </div>

        {/* Search & Stage Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search property, wholesaler, carrier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-blue-500 w-60"
            />
          </div>

          {activeViewTab === 'PIPELINE' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-hidden cursor-pointer"
            >
              <option value="ALL">All Pipeline Stages (1-6)</option>
              {CIRCUIT_STAGES.filter((st) => st.key !== 'INSTALLED').map((st) => (
                <option key={st.key} value={st.key}>
                  {st.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </motion.div>

      {/* DATA CIRCUITS TABLE */}
      <motion.div
        variants={itemVariants}
        className="bg-white dark:bg-[#15161c] rounded-2xl border border-slate-200/80 dark:border-[#222430] shadow-xs overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-[#222430] bg-slate-50 dark:bg-[#111217] text-xs font-black uppercase tracking-wider text-black dark:text-white">
                <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Property</th>
                <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Wholesaler</th>
                <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Carieer</th>
                <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Client Price</th>
                <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Revenue Share</th>
                <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Stage</th>
                <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Site Survey &amp; FOC</th>
                <th className="py-3.5 px-4 text-black dark:text-white font-black whitespace-nowrap">Monthly revenue</th>
                <th className="py-3.5 px-4 text-black dark:text-white font-black text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#222430] text-xs">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Loading Data Circuits...
                  </td>
                </tr>
              ) : displayedCircuits.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-16 text-center text-slate-500">
                    <Network className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
                    <p className="font-bold text-slate-700 dark:text-slate-200">
                      {activeViewTab === 'INSTALLED'
                        ? 'No Installed Data Circuits Yet'
                        : 'No Pipeline Data Circuits Found'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeViewTab === 'INSTALLED'
                        ? 'Circuits automatically move here from the Pipeline the moment their stage is set to Installed.'
                        : 'Click "New Data Circuit Request" to start a new property data circuit.'}
                    </p>
                  </td>
                </tr>
              ) : (
                displayedCircuits.map((c) => {
                  const badge = getCircuitStageBadge(c.status);
                  const hasPdf = Boolean(c.agreement_file_name || c.agreement_storage_path || c.agreement_file_url);
                  const isRec = Boolean(c.current_month_revenue?.revenue_received);

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-[#191b24] transition-colors cursor-pointer"
                      onClick={() => handleOpenManageModal(c, 'PRICING')}
                    >
                      {/* Property (shows name and address only) */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Hotel className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{c.property_name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[240px]">
                          {c.property_address}
                        </p>
                      </td>

                      {/* Wholesaler */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {c.wholesaler_name || <span className="text-slate-400 italic">Pending selection</span>}
                        </div>
                      </td>

                      {/* Carieer */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {c.carrier_name || '—'}
                        </div>
                        {c.bandwidth && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {c.bandwidth}
                          </span>
                        )}
                      </td>

                      {/* Client Price */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {formatCurrency(c.circuit_monthly_price)}
                          <span className="text-[10px] font-normal text-slate-400">/mo</span>
                        </div>
                      </td>

                      {/* Revenue Share */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(c.monthly_revenue_share_amount)}/mo
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          ({c.revenue_share_percentage}%)
                        </span>
                      </td>

                      {/* Stage */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          {badge.label}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-slate-500">
                          <span className={hasPdf ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600'}>
                            {hasPdf ? '✓ PDF Signed' : '• Needs PDF'}
                          </span>
                        </div>
                      </td>

                      {/* Site Survey & FOC Status + Notes */}
                      <td
                        className="py-3.5 px-4 max-w-[260px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenManageModal(c, 'STAGES');
                        }}
                        title="Click to update Site Survey & FOC status and notes"
                      >
                        <div className="space-y-1.5">
                          {/* Site Survey Status Badge + Notes */}
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold border ${
                                  c.site_survey_status === 'COMPLETED' || c.site_survey_status === 'DONE'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                    : c.site_survey_status === 'NOT_REQUIRED'
                                    ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                }`}
                              >
                                {c.site_survey_status === 'COMPLETED' || c.site_survey_status === 'DONE'
                                  ? '✓ Site Survey: Done'
                                  : c.site_survey_status === 'NOT_REQUIRED'
                                  ? 'Site Survey: N/A'
                                  : '• Site Survey: Pending'}
                              </span>
                            </div>
                            {c.site_survey_notes && (
                              <p
                                className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-0.5 truncate"
                                title={c.site_survey_notes}
                              >
                                Note: {c.site_survey_notes}
                              </p>
                            )}
                          </div>

                          {/* FOC Status Badge + Date + Notes */}
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold border ${
                                  c.foc_status === 'CONFIRMED'
                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                                }`}
                              >
                                {c.foc_status === 'CONFIRMED'
                                  ? `✓ FOC Confirmed${c.foc_date ? ` (${String(c.foc_date).slice(0, 10)})` : ''}`
                                  : `• FOC: Pending Actions${c.foc_date ? ` (${String(c.foc_date).slice(0, 10)})` : ''}`}
                              </span>
                            </div>
                            {c.foc_pending_actions_notes && (
                              <p
                                className="text-[10.5px] text-slate-600 dark:text-slate-400 mt-0.5 truncate"
                                title={c.foc_pending_actions_notes}
                              >
                                FOC Note: {c.foc_pending_actions_notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Monthly revenue */}
                      <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-1.5">
                          <button
                            disabled={togglingCircuitId === c.id}
                            onClick={() => handleToggleMonthlyRevenue(c.id, true)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                              isRec
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-[#1e202b] text-slate-600 dark:text-slate-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            Yes
                          </button>
                          <button
                            disabled={togglingCircuitId === c.id}
                            onClick={() => handleToggleMonthlyRevenue(c.id, false)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                              !isRec
                                ? 'bg-rose-600 text-white shadow-xs'
                                : 'bg-slate-100 dark:bg-[#1e202b] text-slate-600 dark:text-slate-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
                            }`}
                          >
                            No
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {isRec
                            ? `Added ${formatCurrency(c.monthly_revenue_share_amount)}`
                            : `Pending (${selectedMonth})`}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenManageModal(c, 'PRICING')}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            Manage
                          </button>
                          <button
                            onClick={() => setCircuitToDelete(c)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                            title="Delete Circuit"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* MODAL 1: CREATE NEW DATA CIRCUIT REQUEST */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8"
            >
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/50 dark:bg-[#111217]">
                <div className="flex items-center gap-2.5">
                  <Network className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      New Data Circuit Request
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Select a property to start a data circuit (Stage: 1. Started). Wholesaler pricing can be added via Manage.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateCircuit} className="p-5 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Select Property *
                    </label>
                    <select
                      required
                      value={createForm.property_id}
                      onChange={(e) => setCreateForm((p) => ({ ...p, property_id: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="">-- Choose Property --</option>
                      {properties.map((prop) => (
                        <option key={prop.id} value={prop.id}>
                          {prop.name} ({prop.city}, {prop.state})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                      Property Connectivity Mode
                    </label>
                    <select
                      value={createForm.connectivity_type}
                      onChange={(e) =>
                        setCreateForm((p) => ({
                          ...p,
                          connectivity_type: e.target.value as 'PORTED' | 'DATA_CIRCUITED' | 'BOTH',
                        }))
                      }
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white cursor-pointer"
                    >
                      <option value="BOTH">Both (Ported & Data Circuited)</option>
                      <option value="DATA_CIRCUITED">Data Circuited Only</option>
                      <option value="PORTED">Ported Only</option>
                    </select>
                  </div>
                </div>

                {/* Descriptive Technical Details Textarea */}
                {/* <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Descriptive Technical Details (Visible to Client — IP Address, WAN IP, Gateway, DNS, etc.)
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Enter IP Address, WAN IP, Usable Block, Gateway, Subnet Mask, Circuit ID, etc. (No separate input boxes needed)"
                    value={createForm.technical_details}
                    onChange={(e) => setCreateForm((p) => ({ ...p, technical_details: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white"
                  />
                </div> */}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#282a36] text-slate-600 dark:text-slate-300 font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                    Start Data Circuit
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: UNIFIED MANAGE CIRCUIT MODAL */}
      <AnimatePresence>
        {showManageModal && selectedCircuit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-8"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/60 dark:bg-[#111217]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      {selectedCircuit.property_name} — Data Circuit
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                      {getCircuitStageBadge(selectedCircuit.status).label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedCircuit.property_address}</p>
                </div>
                <button
                  onClick={() => setShowManageModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Sub-Navigation Tabs: Tab 1 is WHOLESALER PRICING MANAGEMENT */}
              <div className="flex items-center border-b border-slate-200 dark:border-[#222430] px-5 bg-white dark:bg-[#15161c] text-xs font-bold overflow-x-auto">
                {[
                  { key: 'PRICING', label: `1. Wholesaler Pricing Management (${selectedCircuit.quotes?.length || 0})` },
                  { key: 'STAGES', label: '2. Lifecycle Stages & Agreement PDF' },
                  { key: 'TECHNICAL', label: '3. Technical Details (Client Textbox)' },
                  { key: 'QUOTATION_PREVIEW', label: '4. Client Quotation Preview (No Wholesaler)' },
                ].map((tb) => (
                  <button
                    key={tb.key}
                    onClick={() => setModalTab(tb.key as any)}
                    className={`py-3 px-4 border-b-2 transition cursor-pointer shrink-0 ${
                      modalTab === tb.key
                        ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                        : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {tb.label}
                  </button>
                ))}
              </div>

              <div className="p-5 max-h-[75vh] overflow-y-auto space-y-6 text-xs">
                {/* TAB 1: WHOLESALER PRICING MANAGEMENT */}
                {modalTab === 'PRICING' && (
                  <div className="space-y-6">
                    {/* Add Pricing Form */}
                    <div className="p-5 rounded-2xl bg-slate-50/80 dark:bg-[#1a1c24]/80 border border-slate-200/80 dark:border-[#282a36] shadow-xs space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                            Add Wholesaler Pricing
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Enter the carrier pricing offer received from a wholesaler. You can add multiple options and click &quot;Finalize Price&quot; on the best offer.
                          </p>
                        </div>
                        {computedRevSharePreview > 0 && (
                          <div className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                            Est. AAA Share: {formatCurrency(computedRevSharePreview)}/mo
                          </div>
                        )}
                      </div>

                      <form onSubmit={handleAddWholesalerQuote} className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                          {/* 1. Wholesaler Selection */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                              Wholesaler *
                            </label>
                            {wholesalers.length > 0 ? (
                              <div className="space-y-1">
                                <select
                                  value={wholesalers.some((w) => w.name === newQuoteForm.wholesaler_name) ? newQuoteForm.wholesaler_name : ''}
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      setNewQuoteForm((p) => ({ ...p, wholesaler_name: e.target.value }));
                                    }
                                  }}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white"
                                >
                                  <option value="">-- Select Wholesaler --</option>
                                  {wholesalers.map((w) => (
                                    <option key={w.id} value={w.name}>
                                      {w.name} {w.phone ? `(${w.phone})` : ''}
                                    </option>
                                  ))}
                                </select>
                                <input
                                  type="text"
                                  placeholder="Or type custom wholesaler"
                                  value={newQuoteForm.wholesaler_name}
                                  onChange={(e) => setNewQuoteForm((p) => ({ ...p, wholesaler_name: e.target.value }))}
                                  className="w-full px-2.5 py-1 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-[11px]"
                                />
                              </div>
                            ) : (
                              <input
                                type="text"
                                required
                                placeholder="e.g. Airtel Wholesale / Wholesaler A"
                                value={newQuoteForm.wholesaler_name}
                                onChange={(e) => setNewQuoteForm((p) => ({ ...p, wholesaler_name: e.target.value }))}
                                className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white"
                              />
                            )}
                          </div>

                          {/* 2. Carrier Name */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                              Carrier Name *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. Vodafone, Jio, Airtel"
                              value={newQuoteForm.carrier_name}
                              onChange={(e) => setNewQuoteForm((p) => ({ ...p, carrier_name: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white"
                            />
                          </div>

                          {/* 3. Bandwidth */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                              Bandwidth *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 1 Gig, 500 Mbps"
                              value={newQuoteForm.bandwidth}
                              onChange={(e) => setNewQuoteForm((p) => ({ ...p, bandwidth: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white"
                            />
                          </div>

                          {/* 4. Price */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                              Price ($/mo) *
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              required
                              placeholder="e.g. 600.00"
                              value={newQuoteForm.quoted_monthly_price}
                              onChange={(e) => setNewQuoteForm((p) => ({ ...p, quoted_monthly_price: e.target.value }))}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white"
                            />
                          </div>

                          {/* 5. Revenue Share % */}
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                              Revenue Share (%) *
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              required
                              placeholder="e.g. 10"
                              value={newQuoteForm.proposed_rev_share_percentage}
                              onChange={(e) =>
                                setNewQuoteForm((p) => ({ ...p, proposed_rev_share_percentage: e.target.value }))
                              }
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-xs font-medium text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-end pt-1">
                          <button
                            type="submit"
                            disabled={addingQuote}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                          >
                            {addingQuote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                            Add Pricing
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Wholesaler Pricing Rows */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          Wholesaler Pricing Comparison ({selectedCircuit.quotes?.length || 0})
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Click &quot;Finalize Price&quot; on any quote to advance the circuit to &quot;2. Wholesaler Pricing Finalized&quot;.
                        </p>
                      </div>

                      {(selectedCircuit.quotes || []).length === 0 ? (
                        <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-[#282a36] rounded-2xl">
                          <DollarSign className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                          <p className="font-bold text-slate-700 dark:text-slate-300">No Wholesaler Pricing Added Yet</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Fill out the form above to record carrier offers from wholesalers.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {(selectedCircuit.quotes || []).map((q: any) => {
                            const isSelected = Boolean(q.is_selected);
                            return (
                              <div
                                key={q.id}
                                className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                                  isSelected
                                    ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-xs'
                                    : 'border-slate-200 dark:border-[#282a36] bg-white dark:bg-[#181920]'
                                }`}
                              >
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-2.5 flex-wrap">
                                    <span className="font-black text-slate-900 dark:text-white text-sm">
                                      Carrier: {q.carrier_name} ({q.bandwidth})
                                    </span>
                                    <span className="text-base font-black text-blue-600 dark:text-blue-400">
                                      {formatCurrency(q.quoted_monthly_price)}/mo
                                    </span>
                                    {isSelected && (
                                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black tracking-wide uppercase flex items-center gap-1">
                                        <Check className="w-3 h-3" /> Finalized Price
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                                    <span>
                                      Wholesaler (Hidden): <strong className="text-slate-800 dark:text-slate-200">{q.wholesaler_name}</strong>
                                    </span>
                                    <span>•</span>
                                    <span>
                                      AAA Revenue Share:{' '}
                                      <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                                        {q.proposed_rev_share_percentage}% ({formatCurrency(q.proposed_rev_share_amount)}/mo)
                                      </strong>
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleFinalizePrice(q)}
                                    className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                                      isSelected
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                    }`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    {isSelected ? 'Price Finalized' : 'Finalize Price'}
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleSelectWinningQuote(q, true)}
                                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 dark:bg-[#252836] dark:hover:bg-indigo-950/40 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
                                    title="Choose this price and advance stage directly to Quotation Sent"
                                  >
                                    Finalize &amp; Send Quotation
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleDeleteQuote(q.id)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition"
                                    title="Delete pricing"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: LIFECYCLE STAGES & AGREEMENT PDF GATE (Selected pricing section removed as requested) */}
                {modalTab === 'STAGES' && (
                  <div className="space-y-6">
                    {/* Visual 7-Stage Process Bar */}
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                        Data Circuit Lifecycle Stages (1 to 7)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                        {CIRCUIT_STAGES.map((st) => {
                          const isCurrent = stageForm.status === st.key;
                          const currentStepNum =
                            CIRCUIT_STAGES.find((x) => x.key === stageForm.status)?.step || 1;
                          const isCompleted = st.step < currentStepNum || stageForm.status === 'INSTALLED';
                          const hasPdf = Boolean(
                            selectedCircuit.agreement_file_name ||
                            selectedCircuit.agreement_storage_path ||
                            selectedCircuit.agreement_file_url
                          );
                          const isLockedByPdf = st.step >= 4 && !hasPdf;

                          return (
                            <button
                              key={st.key}
                              type="button"
                              onClick={() => {
                                if (isLockedByPdf) {
                                  showToast(
                                    'Agreement PDF Required First',
                                    'Upload the signed Agreement PDF below to advance to Paperwork Signed, Site Survey, FOC, or Installed.',
                                    'error'
                                  );
                                  return;
                                }
                                setStageForm((p) => ({ ...p, status: st.key }));
                              }}
                              className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                                isCurrent
                                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 shadow-xs'
                                  : isCompleted
                                  ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300'
                                  : 'border-slate-200 dark:border-[#282a36] text-slate-500 opacity-80'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase">Step {st.step}</span>
                                {isCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                              </div>
                              <p className="font-bold text-[11px] mt-1 leading-snug">{st.label.replace(/^\d+\.\s*/, '')}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* STEP 4 GATE: Signed Agreement PDF Upload */}
                    <div className="p-4 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800/60 bg-blue-50/30 dark:bg-blue-950/20 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-blue-600" />
                            Step 4 Gate: Signed Agreement PDF (Required Before Site Survey / FOC / Installed)
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Once quotation is sent and paperwork is signed by the client, upload the executed Agreement PDF here to unlock subsequent stages.
                          </p>
                        </div>
                        {(selectedCircuit.agreement_file_name || selectedCircuit.agreement_file_url) && (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Agreement PDF Uploaded
                          </span>
                        )}
                      </div>

                      {selectedCircuit.agreement_file_name && (
                        <div className="p-3 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-600" />
                            <span className="font-bold text-slate-900 dark:text-white">
                              {selectedCircuit.agreement_file_name}
                            </span>
                          </div>
                          {selectedCircuit.agreement_file_url && (
                            <a
                              href={selectedCircuit.agreement_file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:underline font-bold flex items-center gap-1"
                            >
                              Download / View PDF <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={(e) => setAgreementFile(e.target.files?.[0] || null)}
                          className="text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                        />
                        {agreementFile && (
                          <button
                            type="button"
                            disabled={uploadingPdf}
                            onClick={() => handleUploadAgreementPdf(true)}
                            className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                          >
                            {uploadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                            Upload Signed PDF &amp; Mark Paperwork Signed
                          </button>
                        )}
                      </div>
                    </div>

                    {/* STEP 5 & STEP 6: Site Survey & FOC Status */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Step 5: Site Survey */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] space-y-3">
                        <h4 className="font-bold text-slate-900 dark:text-white">Step 5: Site Survey Status &amp; Notes</h4>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Site Survey Status (Shown on Pipeline Table UI)
                          </label>
                          <select
                            value={stageForm.site_survey_status}
                            onChange={(e) => setStageForm((p) => ({ ...p, site_survey_status: e.target.value }))}
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] font-semibold"
                          >
                            <option value="PENDING">Site Survey: Pending</option>
                            <option value="COMPLETED">Site Survey: Done (Completed)</option>
                            <option value="NOT_REQUIRED">Not Required</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Site Survey Notes (Saved to DB &amp; Visible in Property Right Sidebar)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Demarc room verified, conduit ready..."
                            value={stageForm.site_survey_notes}
                            onChange={(e) => setStageForm((p) => ({ ...p, site_survey_notes: e.target.value }))}
                            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36]"
                          />
                        </div>
                      </div>

                      {/* Step 6: FOC Status */}
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] space-y-3">
                        <h4 className="font-bold text-slate-900 dark:text-white">
                          Step 6: FOC Confirmed or Pending Actions &amp; Notes
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              FOC Status (Shown on Table UI)
                            </label>
                            <select
                              value={stageForm.foc_status}
                              onChange={(e) => setStageForm((p) => ({ ...p, foc_status: e.target.value }))}
                              className="w-full px-2.5 py-2 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] font-semibold"
                            >
                              <option value="PENDING_ACTIONS">FOC: Pending Actions</option>
                              <option value="CONFIRMED">FOC: Confirmed</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">FOC Date</label>
                            <input
                              type="date"
                              value={stageForm.foc_date}
                              onChange={(e) => setStageForm((p) => ({ ...p, foc_date: e.target.value }))}
                              className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            FOC / Pending Actions Notes (Saved to DB &amp; Visible in Property Right Sidebar)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Waiting on rack power / CPE delivery..."
                            value={stageForm.foc_pending_actions_notes}
                            onChange={(e) =>
                              setStageForm((p) => ({ ...p, foc_pending_actions_notes: e.target.value }))
                            }
                            className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Property Connectivity Type & Internal Notes */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                          Property Connectivity Badge (Shown on Admin &amp; Client Properties Page)
                        </label>
                        <select
                          value={stageForm.connectivity_type}
                          onChange={(e) =>
                            setStageForm((p) => ({
                              ...p,
                              connectivity_type: e.target.value as 'PORTED' | 'DATA_CIRCUITED' | 'BOTH',
                            }))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36]"
                        >
                          <option value="BOTH">Both (Ported & Data Circuited)</option>
                          <option value="DATA_CIRCUITED">Data Circuited</option>
                          <option value="PORTED">Ported</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                          Internal Admin Notes (Hidden from Client)
                        </label>
                        <input
                          type="text"
                          value={stageForm.internal_admin_notes}
                          onChange={(e) => setStageForm((p) => ({ ...p, internal_admin_notes: e.target.value }))}
                          placeholder="Internal wholesaler tracking notes..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36]"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-[#222430]">
                      <button
                        type="button"
                        onClick={() => handleSaveCircuitChanges()}
                        disabled={savingStage}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {savingStage && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Stage &amp; Details
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 3: DESCRIPTIVE TECHNICAL DETAILS TEXTAREA */}
                {modalTab === 'TECHNICAL' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40">
                      <h4 className="font-bold text-slate-900 dark:text-white">
                        Descriptive Technical Details Box (Shown on Client Property Page)
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Enter IP address, WAN IP, Gateway, Subnet Mask, DNS, Circuit ID, and handoff details in this single descriptive text box. The client can read these details on their Property page (without any wholesaler info).
                      </p>
                    </div>

                    <textarea
                      rows={8}
                      value={stageForm.technical_details}
                      onChange={(e) => setStageForm((p) => ({ ...p, technical_details: e.target.value }))}
                      placeholder={`Example:\nCircuit ID: VOD-1G-99281\nWAN IP: 198.51.100.14/30\nGateway IP: 198.51.100.13\nUsable Static IP Block: 203.0.113.80/29\nPrimary DNS: 8.8.8.8 | Secondary DNS: 1.1.1.1\nDemarcation Location: Main MDF Room Rack 2`}
                      className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] font-mono text-xs text-slate-900 dark:text-white leading-relaxed"
                    />

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveCircuitChanges()}
                        disabled={savingStage}
                        className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        {savingStage && <Loader2 className="w-4 h-4 animate-spin" />}
                        Save Technical Details
                      </button>
                    </div>
                  </div>
                )}

                {/* TAB 4: CLIENT QUOTATION PREVIEW (STRICTLY NO WHOLESALER NAME) */}
                {modalTab === 'QUOTATION_PREVIEW' && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                        <ShieldCheck className="w-4 h-4 shrink-0" />
                        <span className="font-bold">
                          Privacy Verified: Wholesaler Name & AAA Revenue Share % are 100% excluded from this client quotation.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const text = `AAA DATA SOLUTIONS — DATA CIRCUIT QUOTATION\nProperty: ${selectedCircuit.property_name}\nAddress: ${selectedCircuit.property_address}\nCarrier: ${stageForm.carrier_name || 'N/A'}\nBandwidth: ${stageForm.bandwidth || '1 Gig'}\nMonthly Recurring Charge (MRC): ${formatCurrency(Number(stageForm.circuit_monthly_price || 0))}/month`;
                          navigator.clipboard.writeText(text);
                          showToast('Client Quotation Copied', 'Copied client-safe quotation to clipboard.');
                        }}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy Quotation Text
                      </button>
                    </div>

                    <div className="p-6 rounded-2xl bg-white dark:bg-[#111217] border border-slate-200 dark:border-[#282a36] space-y-4 shadow-inner">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222430] pb-4">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
                            AAA Data Solutions — Official Client Quotation
                          </p>
                          <h4 className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                            Dedicated Enterprise Data Circuit Proposal
                          </h4>
                        </div>
                        <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-2">
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Property Location</span>
                          <span className="font-bold text-slate-900 dark:text-white">{selectedCircuit.property_name}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Carrier Network</span>
                          <span className="font-bold text-slate-900 dark:text-white">{stageForm.carrier_name || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Committed Bandwidth</span>
                          <span className="font-bold text-slate-900 dark:text-white">{stageForm.bandwidth || '1 Gig'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Monthly Pricing</span>
                          <span className="text-base font-black text-blue-600 dark:text-blue-400">
                            {formatCurrency(Number(stageForm.circuit_monthly_price || 0))}/mo
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: WHOLESALERS DIRECTORY (ADD / EDIT / DELETE) */}
      <AnimatePresence>
        {showWholesalersModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-8"
            >
              <div className="p-5 border-b border-slate-100 dark:border-[#222430] flex items-center justify-between bg-slate-50/50 dark:bg-[#111217]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Wholesalers Directory
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Add, edit, or delete wholesalers (strictly hidden from clients).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowWholesalersModal(false);
                    setEditingWholesalerId(null);
                    setWholesalerForm({ id: '', name: '', phone: '' });
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5 text-xs">
                {/* Form to Add / Edit Wholesaler */}
                <form onSubmit={handleSaveWholesaler} className="p-4 rounded-xl bg-slate-50 dark:bg-[#1a1c24] border border-slate-200 dark:border-[#282a36] space-y-3">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{editingWholesalerId ? 'Edit Wholesaler' : 'Add New Wholesaler'}</span>
                    {editingWholesalerId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingWholesalerId(null);
                          setWholesalerForm({ id: '', name: '', phone: '' });
                        }}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-[11px] font-normal cursor-pointer"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Wholesaler Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Airtel Wholesale / Jio"
                        value={wholesalerForm.name}
                        onChange={(e) => setWholesalerForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. +1 (555) 019-2834"
                        value={wholesalerForm.phone}
                        onChange={(e) => setWholesalerForm((p) => ({ ...p, phone: e.target.value }))}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#282a36] text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={savingWholesaler}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      {savingWholesaler ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingWholesalerId ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      {editingWholesalerId ? 'Update Wholesaler' : 'Save Wholesaler'}
                    </button>
                  </div>
                </form>

                {/* Wholesalers Directory List */}
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>Saved Wholesalers ({wholesalers.length})</span>
                  </h4>

                  {wholesalers.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-[#282a36] rounded-xl">
                      <Building2 className="w-6 h-6 mx-auto mb-1 text-slate-300 dark:text-slate-600" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">No Wholesalers Added Yet</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Use the form above to add your telecom wholesalers.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-[#282a36] border border-slate-200 dark:border-[#282a36] rounded-xl overflow-hidden bg-white dark:bg-[#15161c]">
                      {wholesalers.map((w) => (
                        <div key={w.id} className="p-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-[#1a1c24]/50">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-xs">{w.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {w.phone ? (
                                <span className="flex items-center gap-1">
                                  📞 {w.phone}
                                </span>
                              ) : (
                                <span className="italic text-slate-400">No phone number</span>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingWholesalerId(w.id);
                                setWholesalerForm({ id: w.id, name: w.name, phone: w.phone || '' });
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
                              title="Edit Wholesaler"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={deletingWholesalerId === w.id}
                              onClick={() => handleDeleteWholesaler(w.id, w.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                              title="Delete Wholesaler"
                            >
                              {deletingWholesalerId === w.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {circuitToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-[#15161c] border border-slate-200 dark:border-[#222430] rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Data Circuit for {circuitToDelete.property_name}?
              </h3>
              <p className="text-xs text-slate-500">
                This will remove this Data Circuit request, its wholesaler quotes, and its monthly revenue share entries.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setCircuitToDelete(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#282a36] text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCircuit}
                  disabled={deleting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
