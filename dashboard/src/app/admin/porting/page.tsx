'use client';

import React from 'react';
import { ImportPortingModal } from '@/components/admin/ImportPortingModal';
import {
  PortingHeaderAndFilters,
} from './_components/PortingHeaderAndFilters';
import { PortingTable } from './_components/PortingTable';
import { PortingUnifiedModal } from './_components/PortingUnifiedModal';
import { PortingCreateModal } from './_components/PortingCreateModal';
import { PortingActionModals } from './_components/PortingActionModals';
import { usePortingManagement } from './_components/usePortingManagement';

// Re-export types and helpers for backwards compatibility
export type { LifecycleStage } from './_components/portingTypes';
export {
  STAGES_ROAD,
  getStageBadge,
  normalizeStageKey,
  formatStageDate,
  getStageDate,
} from './_components/portingTypes';

export default function AdminPortingPage() {
  const mgr = usePortingManagement();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen text-slate-900 dark:text-slate-100 font-sans">
      {/* Header, Filters & Metrics */}
      <PortingHeaderAndFilters
        toasts={mgr.toasts}
        onResetFilters={mgr.handleResetFilters}
        handleExportCSV={mgr.handleExportCSV}
        exportingCSV={mgr.exportingCSV}
        onOpenImportModal={() => mgr.setShowImportModal(true)}
        onOpenCreateModal={() => mgr.setShowCreateModal(true)}
        metrics={mgr.metrics}
        searchInput={mgr.searchInput}
        handleSearchChange={mgr.handleSearchChange}
        selectedStatus={mgr.filters.selectedStatus}
        onStatusFilterChange={mgr.handleStatusFilterChange}
        sortBy={mgr.filters.sortBy}
        onSortByChange={mgr.handleSortByChange}
      />

      {/* Main Table */}
      <PortingTable
        isSuperAdmin={mgr.isSuperAdmin}
        loading={mgr.loading}
        portings={mgr.portings}
        openUnifiedModal={mgr.openUnifiedModal}
        handleCopy={mgr.handleCopy}
        copiedField={mgr.copiedField}
        handleOpenMenu={mgr.handleOpenMenu}
        pagination={mgr.pagination}
        onPageChange={mgr.handlePageChange}
        menuPosition={mgr.menuPosition}
        setMenuPosition={mgr.setMenuPosition}
        handleOpenAssignServices={mgr.handleOpenAssignServices}
        onRequestDelete={(record) => {
          mgr.setRecordToDelete(record);
          mgr.setShowDeleteModal(true);
        }}
      />

      {/* Unified Details / Stage / Media Modal */}
      <PortingUnifiedModal
        showUnifiedModal={mgr.showUnifiedModal}
        setShowUnifiedModal={mgr.setShowUnifiedModal}
        selectedRecord={mgr.selectedRecord}
        activeTab={mgr.activeTab}
        setActiveTab={mgr.setActiveTab}
        detailForm={mgr.detailForm}
        setDetailForm={mgr.setDetailForm}
        orgOptions={mgr.orgOptions}
        partnerOptions={mgr.partnerOptions}
        isSuperAdmin={mgr.isSuperAdmin}
        savingDetails={mgr.savingDetails}
        handleSaveDetailsSubmit={mgr.handleSaveDetailsSubmit}
        editStageStatus={mgr.editStageStatus}
        setEditStageStatus={mgr.setEditStageStatus}
        handleStageSelect={mgr.handleStageSelect}
        editTargetDate={mgr.editTargetDate}
        setEditTargetDate={mgr.setEditTargetDate}
        stageDates={mgr.stageDates}
        setStageDates={mgr.setStageDates}
        stageAssignments={mgr.stageAssignments}
        setStageAssignments={mgr.setStageAssignments}
        teammates={mgr.teammates}
        updatingStage={mgr.updatingStage}
        uploadingFiles={mgr.uploadingFiles}
        handleUpdateStageSubmit={mgr.handleUpdateStageSubmit}
        existingAttachments={mgr.existingAttachments}
        modalNewFiles={mgr.modalNewFiles}
        setModalNewFiles={mgr.setModalNewFiles}
        handleDownloadAttachment={mgr.handleDownloadAttachment}
        handleDeleteAttachment={mgr.handleDeleteAttachment}
        handleSaveMediaSubmit={mgr.handleSaveMediaSubmit}
      />

      {/* Initialize Porting Create Modal */}
      <PortingCreateModal
        showCreateModal={mgr.showCreateModal}
        setShowCreateModal={mgr.setShowCreateModal}
        createForm={mgr.createForm}
        setCreateForm={mgr.setCreateForm}
        createFiles={mgr.createFiles}
        setCreateFiles={mgr.setCreateFiles}
        createLoading={mgr.createLoading}
        createError={mgr.createError}
        handleCreateSubmit={mgr.handleCreateSubmit}
        orgOptions={mgr.orgOptions}
        partnerOptions={mgr.partnerOptions}
        isSuperAdmin={mgr.isSuperAdmin}
      />

      {/* Action Modals: Delete, Assign Services, Billing Confirm */}
      <PortingActionModals
        showDeleteModal={mgr.showDeleteModal}
        setShowDeleteModal={mgr.setShowDeleteModal}
        recordToDelete={mgr.recordToDelete}
        deleteLoading={mgr.deleteLoading}
        handleDeleteSubmit={mgr.handleDeleteSubmit}
        showAssignServiceModal={mgr.showAssignServiceModal}
        setShowAssignServiceModal={mgr.setShowAssignServiceModal}
        selectedRecordForAssign={mgr.selectedRecordForAssign}
        assignedServices={mgr.assignedServices}
        loadingServices={mgr.loadingServices}
        handleUnassignService={mgr.handleUnassignService}
        handleConfirmAssignService={mgr.handleConfirmAssignService}
        selectedServiceToAssign={mgr.selectedServiceToAssign}
        setSelectedServiceToAssign={mgr.setSelectedServiceToAssign}
        availableServices={mgr.availableServices}
        assigningService={mgr.assigningService}
        showBillingConfirmModal={mgr.showBillingConfirmModal}
        setShowBillingConfirmModal={mgr.setShowBillingConfirmModal}
        selectedRecord={mgr.selectedRecord}
        updatingStage={mgr.updatingStage}
        setEditStageStatus={mgr.setEditStageStatus}
        handleUpdateStageSubmit={mgr.handleUpdateStageSubmit}
      />

      {/* CSV Import Modal */}
      <ImportPortingModal
        isOpen={mgr.showImportModal}
        onClose={() => mgr.setShowImportModal(false)}
        onSuccess={mgr.loadData}
      />
    </div>
  );
}
