'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { CreateOrgModal } from '@/components/admin/CreateOrgModal';
import { InviteManagerModal } from '@/components/admin/InviteManagerModal';
import { ImportOrganizationsModal } from '@/components/admin/ImportOrganizationsModal';
import { containerVariants } from './_components/types';
import { useOrganizationsPage } from './_components/useOrganizationsPage';
import { OrganizationsHeaderAndKpis } from './_components/OrganizationsHeaderAndKpis';
import { OrganizationsTable } from './_components/OrganizationsTable';
import { EditAndPropertiesDrawers } from './_components/EditAndPropertiesDrawers';
import { ContactsDrawerAndModals } from './_components/ContactsDrawerAndModals';

export default function AdminOrganizationsPage() {
  const {
    dispatch,
    organizations,
    metrics,
    totalCount,
    totalPages,
    currentPage,
    searchQuery,
    selectedStatus,
    selectedTypeFilter,
    selectedPropFilter,
    loading,
    error,
    sortBy,
    setSortBy,
    copiedId,
    menuPosition,
    setMenuPosition,
    showCreateModal,
    setShowCreateModal,
    orgToDelete,
    setOrgToDelete,
    deleteLoading,
    inviteModalOrg,
    setInviteModalOrg,
    showImportModal,
    setShowImportModal,
    exporting,
    showEditDrawer,
    setShowEditDrawer,
    selectedOrgForEdit,
    editLogoFile,
    setEditLogoFile,
    editLogoPreview,
    setEditLogoPreview,
    editLogoInputRef,
    editFormData,
    setEditFormData,
    editSaving,
    showPropertiesDrawer,
    setShowPropertiesDrawer,
    selectedOrgForProps,
    orgPropertiesList,
    loadingOrgProps,
    showAssignPropModal,
    setShowAssignPropModal,
    allAvailableProps,
    loadingAvailableProps,
    selectedPropToAssign,
    setSelectedPropToAssign,
    assigningLoading,
    showContactsDrawer,
    setShowContactsDrawer,
    selectedOrgForContacts,
    loadingOrgContacts,
    showAddContactModal,
    setShowAddContactModal,
    contactFormData,
    setContactFormData,
    savingContact,
    syncingPbx,
    contactToDelete,
    setContactToDelete,
    deletingContact,
    toastMsg,
    showToast,
    fetchOrganizations,
    handleSyncPbxPortal,
    displayedOrganizations,
    handleExportCSV,
    handleOpenMenu,
    handleCopyText,
    handleUpdateStatus,
    handleConfirmDeleteOrg,
    handleOpenEditDrawer,
    handleSaveEdit,
    handleOpenProperties,
    handleOpenAssignModal,
    handleAssignPropertySubmit,
    handleOpenContacts,
    currentOrgContactsList,
    handleConfirmDeleteContact,
    handleAddContactSubmit,
    hasActiveFilters,
    setFilters,
  } = useOrganizationsPage();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-12 font-sans"
    >
      <OrganizationsHeaderAndKpis
        toastMsg={toastMsg}
        syncingPbx={syncingPbx}
        handleSyncPbxPortal={handleSyncPbxPortal}
        exporting={exporting}
        handleExportCSV={handleExportCSV}
        setShowImportModal={setShowImportModal}
        setShowCreateModal={setShowCreateModal}
        metrics={metrics}
        organizations={organizations}
        searchQuery={searchQuery}
        selectedTypeFilter={selectedTypeFilter}
        selectedStatus={selectedStatus}
        selectedPropFilter={selectedPropFilter}
        sortBy={sortBy}
        setSortBy={setSortBy}
        hasActiveFilters={hasActiveFilters}
        onUpdateFilters={(filters) => dispatch(setFilters(filters))}
      />

      <OrganizationsTable
        loading={loading}
        error={error}
        fetchOrganizations={fetchOrganizations}
        displayedOrganizations={displayedOrganizations}
        hasActiveFilters={hasActiveFilters}
        setShowCreateModal={setShowCreateModal}
        copiedId={copiedId}
        handleCopyText={handleCopyText}
        handleOpenContacts={handleOpenContacts}
        handleOpenProperties={handleOpenProperties}
        handleOpenMenu={handleOpenMenu}
        totalCount={totalCount}
        currentPage={currentPage}
        totalPages={totalPages}
        onUpdatePage={(page) => dispatch(setFilters({ currentPage: page }))}
        menuPosition={menuPosition}
        setMenuPosition={setMenuPosition}
        setInviteModalOrg={setInviteModalOrg}
        handleOpenEditDrawer={handleOpenEditDrawer}
        handleUpdateStatus={handleUpdateStatus}
        setOrgToDelete={setOrgToDelete}
      />

      {/* Create Organization Modal */}
      <CreateOrgModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          showToast('Client organization created successfully.');
          fetchOrganizations();
        }}
      />

      <EditAndPropertiesDrawers
        showEditDrawer={showEditDrawer}
        setShowEditDrawer={setShowEditDrawer}
        selectedOrgForEdit={selectedOrgForEdit}
        handleSaveEdit={handleSaveEdit}
        editLogoPreview={editLogoPreview}
        setEditLogoPreview={setEditLogoPreview}
        editLogoFile={editLogoFile}
        setEditLogoFile={setEditLogoFile}
        editLogoInputRef={editLogoInputRef}
        editFormData={editFormData}
        setEditFormData={setEditFormData}
        editSaving={editSaving}
        showToast={showToast}
        showPropertiesDrawer={showPropertiesDrawer}
        setShowPropertiesDrawer={setShowPropertiesDrawer}
        selectedOrgForProps={selectedOrgForProps}
        orgPropertiesList={orgPropertiesList}
        loadingOrgProps={loadingOrgProps}
        handleOpenAssignModal={handleOpenAssignModal}
        showAssignPropModal={showAssignPropModal}
        setShowAssignPropModal={setShowAssignPropModal}
        handleAssignPropertySubmit={handleAssignPropertySubmit}
        loadingAvailableProps={loadingAvailableProps}
        selectedPropToAssign={selectedPropToAssign}
        setSelectedPropToAssign={setSelectedPropToAssign}
        allAvailableProps={allAvailableProps}
        assigningLoading={assigningLoading}
      />

      <ContactsDrawerAndModals
        showContactsDrawer={showContactsDrawer}
        setShowContactsDrawer={setShowContactsDrawer}
        selectedOrgForContacts={selectedOrgForContacts}
        currentOrgContactsList={currentOrgContactsList}
        setShowAddContactModal={setShowAddContactModal}
        loadingOrgContacts={loadingOrgContacts}
        copiedId={copiedId}
        handleCopyText={handleCopyText}
        setContactToDelete={setContactToDelete}
        contactToDelete={contactToDelete}
        deletingContact={deletingContact}
        handleConfirmDeleteContact={handleConfirmDeleteContact}
        showAddContactModal={showAddContactModal}
        handleAddContactSubmit={handleAddContactSubmit}
        contactFormData={contactFormData}
        setContactFormData={setContactFormData}
        savingContact={savingContact}
        orgToDelete={orgToDelete}
        setOrgToDelete={setOrgToDelete}
        handleConfirmDeleteOrg={handleConfirmDeleteOrg}
        deleteLoading={deleteLoading}
      />

      {/* Invite Manager Modal */}
      {inviteModalOrg && (
        <InviteManagerModal
          isOpen={Boolean(inviteModalOrg)}
          onClose={() => setInviteModalOrg(null)}
          orgId={inviteModalOrg.id}
          orgName={inviteModalOrg.name}
          onSuccess={fetchOrganizations}
        />
      )}

      {/* Import Organizations Modal */}
      <ImportOrganizationsModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={() => {
          fetchOrganizations();
        }}
      />
    </motion.div>
  );
}
