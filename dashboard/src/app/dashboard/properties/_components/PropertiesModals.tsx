import React from 'react';
import { PropertyDetailDrawer } from '@/components/client/PropertyDetailDrawer';
import { CreateTicketModal } from '@/components/client/CreateTicketModal';
import { EditGMModal } from '@/components/client/EditGMModal';
import { OnboardingTimelineModal } from '@/components/client/OnboardingTimelineModal';
import { PropertyRecord } from './types';

interface PropertiesModalsProps {
  showDrawer: boolean;
  selectedPropForDrawer: PropertyRecord | null;
  drawerDefaultTab: 'OVERVIEW' | 'SERVICES' | 'E911' | 'TICKETS' | 'DATA_CIRCUIT' | 'PORTING_DOCS';
  setShowDrawer: (show: boolean) => void;
  setSelectedPropForDrawer: (prop: PropertyRecord | null) => void;
  handleOpenTicketModalForProp: (propId: string) => void;

  showCreateTicketModal: boolean;
  setShowCreateTicketModal: (show: boolean) => void;
  ticketPropId: string | null;
  setTicketPropId: (id: string | null) => void;
  onRefresh: () => void;

  showEditGMModal: boolean;
  editingGMProp: PropertyRecord | null;
  setShowEditGMModal: (show: boolean) => void;
  setEditingGMProp: (prop: PropertyRecord | null) => void;

  showTimelineModal: boolean;
  viewingTimelineProp: PropertyRecord | null;
  setShowTimelineModal: (show: boolean) => void;
  setViewingTimelineProp: (prop: PropertyRecord | null) => void;
  orgName: string;
}

export function PropertiesModals({
  showDrawer,
  selectedPropForDrawer,
  drawerDefaultTab,
  setShowDrawer,
  setSelectedPropForDrawer,
  handleOpenTicketModalForProp,
  showCreateTicketModal,
  setShowCreateTicketModal,
  ticketPropId,
  setTicketPropId,
  onRefresh,
  showEditGMModal,
  editingGMProp,
  setShowEditGMModal,
  setEditingGMProp,
  showTimelineModal,
  viewingTimelineProp,
  setShowTimelineModal,
  setViewingTimelineProp,
  orgName,
}: PropertiesModalsProps) {
  return (
    <>
      {/* Property Details Slide-Over Drawer */}
      {showDrawer && selectedPropForDrawer && (
        <PropertyDetailDrawer
          property={selectedPropForDrawer}
          defaultTab={drawerDefaultTab}
          onClose={() => {
            setShowDrawer(false);
            setSelectedPropForDrawer(null);
          }}
          onCreateTicket={(propId) => {
            setShowDrawer(false);
            handleOpenTicketModalForProp(propId);
          }}
          onPropertyUpdated={(updated) => {
            setSelectedPropForDrawer(updated);
            onRefresh();
          }}
          onRefresh={onRefresh}
        />
      )}

      {/* Create Support Ticket Modal */}
      {showCreateTicketModal && (
        <CreateTicketModal
          isOpen={showCreateTicketModal}
          onClose={() => {
            setShowCreateTicketModal(false);
            setTicketPropId(null);
          }}
          preselectedPropertyId={ticketPropId || undefined}
          onSuccess={onRefresh}
        />
      )}

      {/* Edit GM Details Modal */}
      {showEditGMModal && editingGMProp && (
        <EditGMModal
          isOpen={showEditGMModal}
          onClose={() => {
            setShowEditGMModal(false);
            setEditingGMProp(null);
          }}
          property={editingGMProp}
          onSuccess={onRefresh}
        />
      )}

      {/* Onboarding Timeline Modal (Admin UI Roadmap) */}
      {showTimelineModal && viewingTimelineProp && (
        <OnboardingTimelineModal
          isOpen={showTimelineModal}
          onClose={() => {
            setShowTimelineModal(false);
            setViewingTimelineProp(null);
          }}
          record={{
            property_name: viewingTimelineProp.name,
            organization_name: viewingTimelineProp.organization_name || orgName,
            property_address: `${viewingTimelineProp.address}, ${viewingTimelineProp.city}, ${viewingTimelineProp.state}`,
            status: viewingTimelineProp.stage || viewingTimelineProp.onboarding_status || 'DRAFT',
            stage: viewingTimelineProp.stage || viewingTimelineProp.onboarding_status || 'DRAFT',
            target_date: viewingTimelineProp.onboarding_target_date,
            general_manager_name: viewingTimelineProp.general_manager_name,
            general_manager_phone: viewingTimelineProp.general_manager_phone,
            general_manager_email: viewingTimelineProp.general_manager_email,
          }}
        />
      )}
    </>
  );
}
