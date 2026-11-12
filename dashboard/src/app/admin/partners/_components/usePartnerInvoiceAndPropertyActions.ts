'use client';

import { useState, useEffect, useCallback } from 'react';
import { Partner, PropertyOption, PartnerInvoiceItem, EmailQueueState } from './types';

interface UsePartnerInvoiceAndPropertyActionsParams {
  activeTab: 'PARTNERS' | 'INVOICES';
  selectedPartner: Partner | null;
  setSelectedPartner: (p: Partner | null) => void;
  loadData: () => void;
  showToast: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  setInvoices: React.Dispatch<React.SetStateAction<PartnerInvoiceItem[]>>;
}

export function usePartnerInvoiceAndPropertyActions({
  activeTab,
  selectedPartner,
  setSelectedPartner,
  loadData,
  showToast,
  setInvoices,
}: UsePartnerInvoiceAndPropertyActionsParams) {
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showViewPropertiesModal, setShowViewPropertiesModal] = useState(false);
  const [showViewInvoicesModal, setShowViewInvoicesModal] = useState(false);
  const [partnerAssignedProps, setPartnerAssignedProps] = useState<PropertyOption[]>([]);
  const [partnerInvoicesList, setPartnerInvoicesList] = useState<PartnerInvoiceItem[]>([]);
  const [loadingModalData, setLoadingModalData] = useState(false);

  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<PartnerInvoiceItem | null>(null);
  const [updatingInvoiceId, setUpdatingInvoiceId] = useState<string | null>(null);
  const [deletingInvoiceId, setDeletingInvoiceId] = useState<string | null>(null);
  const [generatingMonthlyInvoices, setGeneratingMonthlyInvoices] = useState(false);
  const [emailQueueStates, setEmailQueueStates] = useState<Record<string, EmailQueueState>>({});
  const [emailQueueMeta, setEmailQueueMeta] = useState<{ isProcessing: boolean; pendingCount: number }>({
    isProcessing: false,
    pendingCount: 0,
  });
  const [dispatchingEmailIds, setDispatchingEmailIds] = useState<Record<string, boolean>>({});

  const [assignForm, setAssignForm] = useState({
    property_id: '',
    commission_override: '',
  });

  const handleOpenViewProperties = async (partner: Partner) => {
    setSelectedPartner(partner);
    setLoadingModalData(true);
    setShowViewPropertiesModal(true);
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPartnerAssignedProps(json.data.properties || []);
      }
    } catch (err) {
      console.error('Failed to load partner properties:', err);
    } finally {
      setLoadingModalData(false);
    }
  };

  const handleUnassignProperty = async (propertyId: string) => {
    if (!selectedPartner) return;
    try {
      const res = await fetch(`/api/admin/partners/${selectedPartner.id}/properties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ property_id: propertyId, action: 'UNASSIGN' }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Unassign failed.');

      showToast('Unassigned', 'Property unassigned from partner.');
      setPartnerAssignedProps((prev) => prev.filter((p) => p.id !== propertyId));
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Unassign failed.', 'error');
    }
  };

  const handleOpenViewInvoices = async (partner: Partner) => {
    setSelectedPartner(partner);
    setLoadingModalData(true);
    setShowViewInvoicesModal(true);
    try {
      const res = await fetch(`/api/admin/partners/${partner.id}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPartnerInvoicesList(json.data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load partner invoices:', err);
    } finally {
      setLoadingModalData(false);
    }
  };

  const handleUpdateInvoiceStatus = async (invoiceId: string, newStatus: string) => {
    try {
      setUpdatingInvoiceId(invoiceId);
      const res = await fetch('/api/admin/partners/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: invoiceId, status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update invoice status.');

      showToast('Status Updated', `Invoice status set to ${newStatus}.`);
      loadData();
      if (selectedPartner) {
        setPartnerInvoicesList((prev) =>
          prev.map((inv) => (inv.id === invoiceId ? { ...inv, status: newStatus as any } : inv))
        );
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Update failed', 'error');
    } finally {
      setUpdatingInvoiceId(null);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string, invoiceNumber?: string) => {
    if (!confirm(`Are you sure you want to permanently delete invoice ${invoiceNumber || ''}? This cannot be undone.`)) {
      return;
    }
    try {
      setDeletingInvoiceId(invoiceId);
      const res = await fetch(`/api/admin/partners/invoices?id=${invoiceId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete invoice.');

      showToast('Invoice Deleted', `Invoice ${invoiceNumber || ''} has been deleted successfully.`);
      if (selectedInvoiceForView?.id === invoiceId) {
        setSelectedInvoiceForView(null);
      }
      setInvoices((prev) => prev.filter((inv) => inv.id !== invoiceId));
      setPartnerInvoicesList((prev) => prev.filter((inv) => inv.id !== invoiceId));
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to delete invoice', 'error');
    } finally {
      setDeletingInvoiceId(null);
    }
  };

  const handleRunMonthlyInvoices = async () => {
    try {
      setGeneratingMonthlyInvoices(true);
      const res = await fetch('/api/admin/partners/invoices/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to generate monthly partner invoices.');
      showToast('Monthly Invoices Generated', json.message || 'Invoices created successfully for all active partners.', 'success');
      loadData();
    } catch (err: any) {
      showToast('Error', err.message || 'Generation failed', 'error');
    } finally {
      setGeneratingMonthlyInvoices(false);
    }
  };

  const fetchEmailQueueStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/partners/invoices/send-email');
      const json = await res.json();
      if (json.success) {
        setEmailQueueStates(json.states || {});
        setEmailQueueMeta({
          isProcessing: Boolean(json.isProcessing),
          pendingCount: Number(json.pendingCount || 0),
        });
      }
    } catch {
      // ignore background poll error
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'INVOICES' || showViewInvoicesModal || selectedInvoiceForView) {
      fetchEmailQueueStatus();
    }
  }, [activeTab, showViewInvoicesModal, selectedInvoiceForView, fetchEmailQueueStatus]);

  useEffect(() => {
    if (!emailQueueMeta.isProcessing && emailQueueMeta.pendingCount === 0) {
      return;
    }
    const timer = setInterval(() => {
      fetchEmailQueueStatus();
    }, 1200);
    return () => clearInterval(timer);
  }, [emailQueueMeta.isProcessing, emailQueueMeta.pendingCount, fetchEmailQueueStatus]);

  const handleSendInvoiceEmail = async (invoiceIds: string[], contextLabel?: string) => {
    if (!invoiceIds || invoiceIds.length === 0) return;
    try {
      setDispatchingEmailIds((prev) => {
        const next = { ...prev };
        invoiceIds.forEach((id) => {
          next[id] = true;
        });
        return next;
      });

      const res = await fetch('/api/admin/partners/invoices/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice_ids: invoiceIds }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to queue invoice email.');
      }

      if (json.snapshot) {
        setEmailQueueStates(json.snapshot.states || {});
        setEmailQueueMeta({
          isProcessing: Boolean(json.snapshot.isProcessing),
          pendingCount: Number(json.snapshot.pendingCount || 0),
        });
      } else {
        fetchEmailQueueStatus();
      }

      showToast(
        invoiceIds.length > 1 ? 'Invoices Added to Email Queue' : 'Invoice Email Queued',
        json.message || (contextLabel ? `Queued email with PDF for ${contextLabel}.` : 'Email with PDF attachment will be dispatched sequentially.'),
        'success'
      );
    } catch (err: any) {
      showToast('Email Error', err.message || 'Could not queue invoice email.', 'error');
    } finally {
      setDispatchingEmailIds((prev) => {
        const next = { ...prev };
        invoiceIds.forEach((id) => {
          delete next[id];
        });
        return next;
      });
    }
  };

  return {
    showAssignModal,
    setShowAssignModal,
    showViewPropertiesModal,
    setShowViewPropertiesModal,
    showViewInvoicesModal,
    setShowViewInvoicesModal,
    partnerAssignedProps,
    partnerInvoicesList,
    loadingModalData,
    selectedInvoiceForView,
    setSelectedInvoiceForView,
    updatingInvoiceId,
    deletingInvoiceId,
    generatingMonthlyInvoices,
    emailQueueStates,
    emailQueueMeta,
    dispatchingEmailIds,
    assignForm,
    setAssignForm,
    handleOpenViewProperties,
    handleUnassignProperty,
    handleOpenViewInvoices,
    handleUpdateInvoiceStatus,
    handleDeleteInvoice,
    handleRunMonthlyInvoices,
    handleSendInvoiceEmail,
  };
}
