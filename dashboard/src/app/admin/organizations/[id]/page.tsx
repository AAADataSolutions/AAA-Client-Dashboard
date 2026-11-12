'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

import { containerVariants } from './_components/types';
import { useOrganizationDetail } from './_components/useOrganizationDetail';
import { OrgHeaderAndTabs } from './_components/OrgHeaderAndTabs';
import { OrgOverviewTab } from './_components/OrgOverviewTab';
import { OrgContactsTab } from './_components/OrgContactsTab';
import { OrgPropertiesTab } from './_components/OrgPropertiesTab';
import { OrgServicesTab } from './_components/OrgServicesTab';
import { OrgOnboardingTab } from './_components/OrgOnboardingTab';
import { OrgE911Tab } from './_components/OrgE911Tab';
import { OrgEditModal } from './_components/OrgEditModal';
import { OrgContactModals } from './_components/OrgContactModals';
import { OrgPropertyModals } from './_components/OrgPropertyModals';
import { OrgPropertyActionMenu } from './_components/OrgPropertyActionMenu';
import { OrgPropertySettingsModal } from './_components/OrgPropertySettingsModal';
import { OrgPropertyDeleteModal } from './_components/OrgPropertyDeleteModal';
import { OrgAssignServiceModal } from './_components/OrgAssignServiceModal';
import { OrgServiceActionModals } from './_components/OrgServiceActionModals';
import { OrgServiceDeleteModal } from './_components/OrgServiceDeleteModal';
import { OrgUnifiedOnboardingModal } from './_components/OrgUnifiedOnboardingModal';
import { OrgInitOnboardingModal } from './_components/OrgInitOnboardingModal';

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile, effectiveRole } = useAuth();
  const isSuperAdmin = effectiveRole === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN';
  const resolvedParams = use(params);
  const router = useRouter();
  const orgId = resolvedParams.id;

  const s = useOrganizationDetail(orgId);

  if (s.loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-500 font-medium">Loading organization...</p>
        </div>
      </div>
    );
  }

  if (s.error || !s.org) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl p-6 max-w-md w-full text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Organization Not Found</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {s.error || 'The requested organization does not exist or has been removed.'}
          </p>
          <button
            onClick={() => router.push('/admin/organizations')}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition"
          >
            Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto min-h-screen text-slate-900 dark:text-slate-100 font-sans"
    >
      {/* Toast Notification */}
      {s.toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-xs flex items-center gap-2 max-w-md animate-in slide-in-from-top-2 duration-200 ${
            s.toastMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : s.toastMsg.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/80 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-amber-50 dark:bg-amber-950/80 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
          }`}
        >
          {s.toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : s.toastMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          )}
          <span className="font-semibold">{s.toastMsg.text}</span>
        </div>
      )}

      {/* Header, Stats Bar & Navigation Tabs */}
      <OrgHeaderAndTabs
        org={s.org}
        activeTab={s.activeTab}
        setActiveTab={s.setActiveTab}
        fetchOrgProperties={s.fetchOrgProperties}
        setEditFormData={s.setEditFormData}
        setEditLogoPreview={s.setEditLogoPreview}
        setEditLogoFile={s.setEditLogoFile}
        setShowEditOrgModal={s.setShowEditOrgModal}
        setShowAddContactModal={s.setShowAddContactModal}
      />

      {/* Tab 1: Overview */}
      {s.activeTab === 'OVERVIEW' && (
        <OrgOverviewTab
          org={s.org}
          setEditFormData={s.setEditFormData}
          setEditLogoPreview={s.setEditLogoPreview}
          setEditLogoFile={s.setEditLogoFile}
          setShowEditOrgModal={s.setShowEditOrgModal}
          setShowAddContactModal={s.setShowAddContactModal}
        />
      )}

      {/* Tab 2: Contacts */}
      {s.activeTab === 'CONTACTS' && (
        <OrgContactsTab
          org={s.org}
          copiedId={s.copiedId}
          handleCopy={s.handleCopy}
          setShowAddContactModal={s.setShowAddContactModal}
          setContactToDelete={s.setContactToDelete}
        />
      )}

      {/* Tab 3: Properties */}
      {s.activeTab === 'PROPERTIES' && (
        <OrgPropertiesTab
          org={s.org}
          isSuperAdmin={isSuperAdmin}
          copiedId={s.copiedId}
          handleCopy={s.handleCopy}
          handleOpenAssignModal={s.handleOpenAssignModal}
          handleViewPropertyServices={s.handleViewPropertyServices}
          setActivePropMenu={s.setActivePropMenu}
        />
      )}

      {/* Tab 4: Services */}
      {s.activeTab === 'SERVICES' && (
        <OrgServicesTab
          org={s.org}
          handleOpenAssignServiceModal={s.handleOpenAssignServiceModal}
          setActiveServiceMenu={s.setActiveServiceMenu}
        />
      )}

      {/* Tab 5: Onboarding */}
      {s.activeTab === 'ONBOARDING' && (
        <OrgOnboardingTab
          org={s.org}
          onbSearchInput={s.onbSearchInput}
          setOnbSearchInput={s.setOnbSearchInput}
          onbStageFilter={s.onbStageFilter}
          setOnbStageFilter={s.setOnbStageFilter}
          onbSortBy={s.onbSortBy}
          setOnbSortBy={s.setOnbSortBy}
          handleExportOnbCSV={s.handleExportOnbCSV}
          setInitOnbError={s.setInitOnbError}
          setShowInitOnbModal={s.setShowInitOnbModal}
          openUnifiedOnboardingModal={s.openUnifiedOnboardingModal}
          handleCopy={s.handleCopy}
          copiedId={s.copiedId}
          setOnboardingMenuPosition={s.setOnboardingMenuPosition}
        />
      )}

      {/* Tab 6: E911 Compliance */}
      {s.activeTab === 'E911' && <OrgE911Tab org={s.org} />}

      {/* =========================================================================
          MODALS & DRAWERS
          ========================================================================= */}

      <OrgEditModal
        showEditOrgModal={s.showEditOrgModal}
        setShowEditOrgModal={s.setShowEditOrgModal}
        editFormData={s.editFormData}
        setEditFormData={s.setEditFormData}
        editLogoPreview={s.editLogoPreview}
        setEditLogoFile={s.setEditLogoFile}
        setEditLogoPreview={s.setEditLogoPreview}
        editLogoInputRef={s.editLogoInputRef}
        editSaving={s.editSaving}
        handleSaveOrgEdit={s.handleSaveOrgEdit}
        showToast={s.showToast}
      />

      <OrgContactModals
        org={s.org}
        showAddContactModal={s.showAddContactModal}
        setShowAddContactModal={s.setShowAddContactModal}
        contactFormData={s.contactFormData}
        setContactFormData={s.setContactFormData}
        savingContact={s.savingContact}
        handleAddContactSubmit={s.handleAddContactSubmit}
        contactToDelete={s.contactToDelete}
        setContactToDelete={s.setContactToDelete}
        deletingContact={s.deletingContact}
        handleConfirmDeleteContact={s.handleConfirmDeleteContact}
      />

      <OrgPropertyModals
        org={s.org}
        unassignTarget={s.unassignTarget}
        setUnassignTarget={s.setUnassignTarget}
        unassigningLoading={s.unassigningLoading}
        handleConfirmUnassign={s.handleConfirmUnassign}
        showAssignPropModal={s.showAssignPropModal}
        setShowAssignPropModal={s.setShowAssignPropModal}
        selectedPropToAssign={s.selectedPropToAssign}
        setSelectedPropToAssign={s.setSelectedPropToAssign}
        availableProps={s.availableProps}
        assigningLoading={s.assigningLoading}
        handleAssignPropertySubmit={s.handleAssignPropertySubmit}
        viewingPropDetails={s.viewingPropDetails}
        setViewingPropDetails={s.setViewingPropDetails}
        viewingPropServices={s.viewingPropServices}
        setViewingPropServices={s.setViewingPropServices}
        loadingPropServices={s.loadingPropServices}
        statusPropTarget={s.statusPropTarget}
        setStatusPropTarget={s.setStatusPropTarget}
        savingPropStatus={s.savingPropStatus}
        handleSavePropertyStatus={s.handleSavePropertyStatus}
      />

      <OrgPropertyActionMenu
        activePropMenu={s.activePropMenu}
        setActivePropMenu={s.setActivePropMenu}
        setViewingPropDetails={s.setViewingPropDetails}
        handleViewPropertyServices={s.handleViewPropertyServices}
        handleOpenAssignServiceModal={s.handleOpenAssignServiceModal}
        setUnassignTarget={s.setUnassignTarget}
        handleOpenPropertyContacts={s.handleOpenPropertyContacts}
        setStatusPropTarget={s.setStatusPropTarget}
        handleOpenEditPropertySettings={s.handleOpenEditPropertySettings}
        setDeletePropTarget={s.setDeletePropTarget}
      />

      <OrgPropertySettingsModal
        isSuperAdmin={isSuperAdmin}
        propContactsTarget={s.propContactsTarget}
        setPropContactsTarget={s.setPropContactsTarget}
        loadingPropContacts={s.loadingPropContacts}
        showAddPropContactForm={s.showAddPropContactForm}
        setShowAddPropContactForm={s.setShowAddPropContactForm}
        newPropContact={s.newPropContact}
        setNewPropContact={s.setNewPropContact}
        savingPropContact={s.savingPropContact}
        propContactsList={s.propContactsList}
        handleAddPropContact={s.handleAddPropContact}
        handleDeletePropContact={s.handleDeletePropContact}
        editingPropSettingsTarget={s.editingPropSettingsTarget}
        setEditingPropSettingsTarget={s.setEditingPropSettingsTarget}
        editPropSettingsForm={s.editPropSettingsForm}
        setEditPropSettingsForm={s.setEditPropSettingsForm}
        savingPropSettings={s.savingPropSettings}
        handleSavePropertySettings={s.handleSavePropertySettings}
      />

      <OrgPropertyDeleteModal
        deletePropTarget={s.deletePropTarget}
        setDeletePropTarget={s.setDeletePropTarget}
        deletingProp={s.deletingProp}
        handleDeletePropertySubmit={s.handleDeletePropertySubmit}
      />

      <OrgAssignServiceModal
        org={s.org}
        showAssignServiceModal={s.showAssignServiceModal}
        setShowAssignServiceModal={s.setShowAssignServiceModal}
        assignServiceTab={s.assignServiceTab}
        setAssignServiceTab={s.setAssignServiceTab}
        loadingUnassignedServices={s.loadingUnassignedServices}
        availableUnassignedServices={s.availableUnassignedServices}
        selectedServiceToAssign={s.selectedServiceToAssign}
        setSelectedServiceToAssign={s.setSelectedServiceToAssign}
        targetPropertyForService={s.targetPropertyForService}
        setTargetPropertyForService={s.setTargetPropertyForService}
        savingService={s.savingService}
        serviceTypesList={s.serviceTypesList}
        newServiceForm={s.newServiceForm}
        setNewServiceForm={s.setNewServiceForm}
        handleAssignExistingServiceSubmit={s.handleAssignExistingServiceSubmit}
        handleCreateNewServiceSubmit={s.handleCreateNewServiceSubmit}
      />

      <OrgServiceActionModals
        org={s.org}
        activeServiceMenu={s.activeServiceMenu}
        setActiveServiceMenu={s.setActiveServiceMenu}
        handleOpenEditService={s.handleOpenEditService}
        setViewingServiceDetails={s.setViewingServiceDetails}
        handleOpenAssignServiceToProp={s.handleOpenAssignServiceToProp}
        setDeleteServiceTarget={s.setDeleteServiceTarget}
        editingServiceTarget={s.editingServiceTarget}
        setEditingServiceTarget={s.setEditingServiceTarget}
        editServiceForm={s.editServiceForm}
        setEditServiceForm={s.setEditServiceForm}
        savingEditService={s.savingEditService}
        handleSaveEditService={s.handleSaveEditService}
        viewingServiceDetails={s.viewingServiceDetails}
        assignServiceToPropTarget={s.assignServiceToPropTarget}
        setAssignServiceToPropTarget={s.setAssignServiceToPropTarget}
        selectedPropForService={s.selectedPropForService}
        setSelectedPropForService={s.setSelectedPropForService}
        savingAssignServiceToProp={s.savingAssignServiceToProp}
        handleSaveAssignServiceToProp={s.handleSaveAssignServiceToProp}
      />

      <OrgServiceDeleteModal
        deleteServiceTarget={s.deleteServiceTarget}
        setDeleteServiceTarget={s.setDeleteServiceTarget}
        deletingService={s.deletingService}
        handleDeleteServiceSubmit={s.handleDeleteServiceSubmit}
      />

      <OrgUnifiedOnboardingModal
        org={s.org}
        unifiedOnboardingRecord={s.unifiedOnboardingRecord}
        setUnifiedOnboardingRecord={s.setUnifiedOnboardingRecord}
        unifiedOnboardingTab={s.unifiedOnboardingTab}
        setUnifiedOnboardingTab={s.setUnifiedOnboardingTab}
        editOnbStageStatus={s.editOnbStageStatus}
        setEditOnbStageStatus={s.setEditOnbStageStatus}
        editOnbTargetDate={s.editOnbTargetDate}
        setEditOnbTargetDate={s.setEditOnbTargetDate}
        onbStageDates={s.onbStageDates}
        setOnbStageDates={s.setOnbStageDates}
        updatingOnbStage={s.updatingOnbStage}
        handleUpdateOnbStageSubmit={s.handleUpdateOnbStageSubmit}
      />

      <OrgInitOnboardingModal
        org={s.org}
        onboardingMenuPosition={s.onboardingMenuPosition}
        setOnboardingMenuPosition={s.setOnboardingMenuPosition}
        openUnifiedOnboardingModal={s.openUnifiedOnboardingModal}
        showInitOnbModal={s.showInitOnbModal}
        setShowInitOnbModal={s.setShowInitOnbModal}
        initOnbForm={s.initOnbForm}
        setInitOnbForm={s.setInitOnbForm}
        initOnbLoading={s.initOnbLoading}
        initOnbError={s.initOnbError}
        handleCreateOnbSubmit={s.handleCreateOnbSubmit}
      />
    </motion.div>
  );
}
