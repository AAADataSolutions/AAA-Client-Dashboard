export type PropertyDrawerTab = 'OVERVIEW' | 'SERVICES' | 'DATA_CIRCUIT' | 'E911' | 'ONBOARDING' | 'TICKETS';

export interface PropertyDetailDrawerProps {
  property: any;
  onClose: () => void;
  onCreateTicket?: (propertyId: string) => void;
  defaultTab?: PropertyDrawerTab;
}
