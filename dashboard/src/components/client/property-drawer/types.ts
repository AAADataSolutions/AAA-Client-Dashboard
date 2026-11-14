export type PropertyDrawerTab =
  | 'OVERVIEW'
  | 'SERVICES'
  | 'E911'
  | 'TICKETS'
  | 'DATA_CIRCUIT'
  | 'PORTING_DOCS';

export interface PropertyDetailDrawerProps {
  property: any;
  onClose: () => void;
  onCreateTicket?: (propertyId: string) => void;
  defaultTab?: PropertyDrawerTab;
  onPropertyUpdated?: (updatedProp: any) => void;
  onRefresh?: () => void;
}
