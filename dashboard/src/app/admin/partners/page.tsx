'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import {
  CheckCircle2,
  AlertCircle,
  Check,
} from 'lucide-react';
import {
  Partner,
  PropertyOption,
  PartnerInvoiceItem,
} from './_components/types';
import {
  PRINT_INVOICE_GLOBAL_CSS,
  printAdminPartnerInvoice,
} from './_components/print-invoice-utils';
import { usePartnerInvoiceAndPropertyActions } from './_components/usePartnerInvoiceAndPropertyActions';
import { usePartnerFormAndInvite } from './_components/usePartnerFormAndInvite';
import { PartnerPageHeaderAndTabs } from './_components/PartnerPageHeaderAndTabs';
import PartnersDirectoryTab from './_components/PartnersDirectoryTab';
import PartnerInvoicesTab from './_components/PartnerInvoicesTab';
import PartnerMenuAndInviteModals from './_components/PartnerMenuAndInviteModals';
import PartnerFormModal from './_components/PartnerFormModal';
import PartnerPropertiesAndInvoicesModals from './_components/PartnerPropertiesAndInvoicesModals';
import PartnerStatementModal from './_components/PartnerStatementModal';

export default function AdminPartnersPage() {
  const { profile, effectiveRole } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';
  const [activeTab, setActiveTab] = useState<'PARTNERS' | 'INVOICES'>('PARTNERS');

  // Partners state
  const [partners, setPartners] = useState<Partner[]>([]);
  const [allProperties, setAllProperties] = useState<PropertyOption[]>([]);
  const [partnerMetrics, setPartnerMetrics] = useState({
    totalPartners: 0,
    activePartners: 0,
    totalCommissionPayout: 0,
    assignedPropertiesCount: 0,
  });

  // Invoices state
  const [invoices, setInvoices] = useState<PartnerInvoiceItem[]>([]);
  const [invoiceMetrics, setInvoiceMetrics] = useState({
    totalInvoicesCount: 0,
    totalInvoiced: 0,
    pendingPayout: 0,
    totalPaid: 0,
  });

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // 3-Dots Action Menu state
  const [menuPosition, setMenuPosition] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    partner: Partner;
  } | null>(null);

  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [toast, setToast] = useState<{ title: string; message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((title: string, message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ title, message, type });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'PARTNERS') {
        const params = new URLSearchParams({
          search: searchQuery.trim(),
          status: statusFilter,
        });
        const [resPartners, resProps] = await Promise.all([
          fetch(`/api/admin/partners?${params.toString()}`),
          fetch('/api/admin/properties?limit=200'),
        ]);

        const jsonPartners = await resPartners.json();
        const jsonProps = await resProps.json();

        if (jsonPartners.success) {
          setPartners(jsonPartners.data || []);
          if (jsonPartners.metrics) setPartnerMetrics(jsonPartners.metrics);
        }
        if (jsonProps.success) {
          setAllProperties(jsonProps.data || []);
        }
      } else {
        const params = new URLSearchParams({
          search: searchQuery.trim(),
          status: statusFilter,
        });
        const resInvoices = await fetch(`/api/admin/partners/invoices?${params.toString()}`);
        const jsonInvoices = await resInvoices.json();
        if (jsonInvoices.success) {
          setInvoices(jsonInvoices.data || []);
          if (jsonInvoices.metrics) setInvoiceMetrics(jsonInvoices.metrics);
        }
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery, statusFilter, showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const {
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
  } = usePartnerInvoiceAndPropertyActions({
    activeTab,
    selectedPartner,
    setSelectedPartner,
    loadData,
    showToast,
    setInvoices,
  });

  const {
    showCreateModal,
    setShowCreateModal,
    showEditModal,
    setShowEditModal,
    showDeleteModal,
    setShowDeleteModal,
    updatingPartnerStatusId,
    inviteModalData,
    setInviteModalData,
    copiedInvite,
    formData,
    setFormData,
    formLoading,
    formError,
    handleCreatePartner,
    handleUpdatePartner,
    handleDeletePartner,
    handleTogglePartnerStatus,
    handleGenerateInviteLink,
    handleCopyInviteUrl,
    handleAssignPropertySubmit,
  } = usePartnerFormAndInvite({
    loadData,
    showToast,
    selectedPartner,
    setSelectedPartner,
    setPartners,
    setPartnerMetrics,
    assignForm,
    setShowAssignModal,
  });

  // Handle 3-dots Action Menu with upside/downside space detection
  const handleOpenMenu = (e: React.MouseEvent, partner: Partner) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const menuHeight = 240;

    if (spaceBelow < menuHeight) {
      setMenuPosition({
        bottom: window.innerHeight - rect.top + 6,
        left: Math.max(10, rect.right - 230),
        partner,
      });
    } else {
      setMenuPosition({
        top: rect.bottom + 6,
        left: Math.max(10, rect.right - 230),
        partner,
      });
    }
  };

  const handlePrint = () => {
    printAdminPartnerInvoice(selectedInvoiceForView, selectedPartner);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 font-sans text-slate-900 dark:text-slate-100">
      <style jsx global>{PRINT_INVOICE_GLOBAL_CSS}</style>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 ${
            toast.type === 'success'
              ? 'bg-emerald-900/90 border border-emerald-500 text-white'
              : toast.type === 'error'
              ? 'bg-rose-900/90 border border-rose-500 text-white'
              : 'bg-blue-900/90 border border-blue-500 text-white'
          }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          ) : toast.type === 'error' ? (
            <AlertCircle className="w-5 h-5 text-rose-400" />
          ) : (
            <Check className="w-5 h-5 text-blue-400" />
          )}
          <div>
            <p className="font-bold text-xs">{toast.title}</p>
            <p className="text-xs opacity-90">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Header & Tabs */}
      <PartnerPageHeaderAndTabs
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        setSearchQuery={setSearchQuery}
        setStatusFilter={setStatusFilter}
        partnerMetrics={partnerMetrics}
        invoiceMetrics={invoiceMetrics}
        generatingMonthlyInvoices={generatingMonthlyInvoices}
        handleRunMonthlyInvoices={handleRunMonthlyInvoices}
        onAddPartnerClick={() => {
          setFormData({
            name: '',
            email: '',
            phone: '',
            company_name: '',
            default_commission_rate: 10,
            status: 'ACTIVE',
            notes: '',
          });
          setShowCreateModal(true);
        }}
      />

      {/* Partner Directory Tab */}
      {activeTab === 'PARTNERS' && (
        <PartnersDirectoryTab
          partners={partners}
          partnerMetrics={partnerMetrics}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          loadData={loadData}
          copiedPhoneId={copiedPhoneId}
          setCopiedPhoneId={setCopiedPhoneId}
          showToast={showToast}
          handleOpenViewProperties={handleOpenViewProperties}
          updatingPartnerStatusId={updatingPartnerStatusId}
          handleTogglePartnerStatus={handleTogglePartnerStatus}
          handleOpenMenu={handleOpenMenu}
        />
      )}

      {/* Invoices Tab */}
      {activeTab === 'INVOICES' && (
        <PartnerInvoicesTab
          invoices={invoices}
          invoiceMetrics={invoiceMetrics}
          loading={loading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          loadData={loadData}
          emailQueueMeta={emailQueueMeta}
          emailQueueStates={emailQueueStates}
          dispatchingEmailIds={dispatchingEmailIds}
          handleSendInvoiceEmail={handleSendInvoiceEmail}
          updatingInvoiceId={updatingInvoiceId}
          handleUpdateInvoiceStatus={handleUpdateInvoiceStatus}
          setSelectedInvoiceForView={setSelectedInvoiceForView}
          isSuperAdmin={isSuperAdmin}
          deletingInvoiceId={deletingInvoiceId}
          handleDeleteInvoice={handleDeleteInvoice}
        />
      )}

      {/* 3-Dots Action Menu & Invite Modals */}
      <PartnerMenuAndInviteModals
        menuPosition={menuPosition}
        setMenuPosition={setMenuPosition}
        setSelectedPartner={setSelectedPartner}
        assignForm={assignForm}
        setAssignForm={setAssignForm}
        showAssignModal={showAssignModal}
        setShowAssignModal={setShowAssignModal}
        handleOpenViewProperties={handleOpenViewProperties}
        handleGenerateInviteLink={handleGenerateInviteLink}
        handleOpenViewInvoices={handleOpenViewInvoices}
        handleTogglePartnerStatus={handleTogglePartnerStatus}
        setFormData={setFormData}
        setShowEditModal={setShowEditModal}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        selectedPartner={selectedPartner}
        inviteModalData={inviteModalData}
        setInviteModalData={setInviteModalData}
        copiedInvite={copiedInvite}
        handleCopyInviteUrl={handleCopyInviteUrl}
        handleDeletePartner={handleDeletePartner}
        formLoading={formLoading}
        formError={formError}
        handleAssignPropertySubmit={handleAssignPropertySubmit}
        allProperties={allProperties}
        isSuperAdmin={isSuperAdmin}
      />

      {/* Create / Edit Partner Modal */}
      <PartnerFormModal
        showCreateModal={showCreateModal}
        showEditModal={showEditModal}
        setShowCreateModal={setShowCreateModal}
        setShowEditModal={setShowEditModal}
        formData={formData}
        setFormData={setFormData}
        formLoading={formLoading}
        formError={formError}
        handleCreatePartner={handleCreatePartner}
        handleUpdatePartner={handleUpdatePartner}
      />

      {/* View Properties & Invoices Modal */}
      <PartnerPropertiesAndInvoicesModals
        showViewPropertiesModal={showViewPropertiesModal}
        setShowViewPropertiesModal={setShowViewPropertiesModal}
        showViewInvoicesModal={showViewInvoicesModal}
        setShowViewInvoicesModal={setShowViewInvoicesModal}
        selectedPartner={selectedPartner}
        loadingModalData={loadingModalData}
        partnerAssignedProps={partnerAssignedProps}
        partnerInvoicesList={partnerInvoicesList}
        setAssignForm={setAssignForm}
        setShowAssignModal={setShowAssignModal}
        isSuperAdmin={isSuperAdmin}
        handleUnassignProperty={handleUnassignProperty}
        updatingInvoiceId={updatingInvoiceId}
        handleUpdateInvoiceStatus={handleUpdateInvoiceStatus}
        emailQueueStates={emailQueueStates}
        dispatchingEmailIds={dispatchingEmailIds}
        handleSendInvoiceEmail={handleSendInvoiceEmail}
        setSelectedInvoiceForView={setSelectedInvoiceForView}
        deletingInvoiceId={deletingInvoiceId}
        handleDeleteInvoice={handleDeleteInvoice}
      />

      {/* Statement Print / Modal */}
      <PartnerStatementModal
        selectedInvoiceForView={selectedInvoiceForView}
        setSelectedInvoiceForView={setSelectedInvoiceForView}
        selectedPartner={selectedPartner}
        isSuperAdmin={isSuperAdmin}
        deletingInvoiceId={deletingInvoiceId}
        handleDeleteInvoice={handleDeleteInvoice}
        emailQueueStates={emailQueueStates}
        dispatchingEmailIds={dispatchingEmailIds}
        handleSendInvoiceEmail={handleSendInvoiceEmail}
        handlePrint={handlePrint}
        printRef={printRef}
      />
    </div>
  );
}
