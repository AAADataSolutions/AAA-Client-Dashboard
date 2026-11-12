export interface ForwardingTarget {
  name: string;
  number: string;
}

export interface SavedContact {
  id: string;
  organization_id?: string;
  property_id?: string | null;
  name: string;
  phone_number: string;
  is_suggested?: boolean;
}

export interface CallForwardingItem {
  id: string;
  custom_service_id: string;
  service_name: string;
  phone_number: string;
  normalized_did: string;
  service_type: string;
  status: string;
  property_id: string | null;
  property_name: string;
  property_location: string;
  organization_id: string | null;
  organization_name: string;
  portal_username: string;
  pbx_server_id: 1 | 2 | 3;
  pbx_server_label: string;
  portal_did_synced: boolean;
  call_forwarding_state: 'ON' | 'OFF';
  active_forwarding_numbers: ForwardingTarget[];
  saved_contacts: SavedContact[];
  forwarding_updated_at: string;
}

