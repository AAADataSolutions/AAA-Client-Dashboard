export interface ForwardingTarget {
  name: string;
  number: string;
}

export interface SavedContact {
  id: string;
  name: string;
  phone_number: string;
  is_suggested?: boolean;
}

export interface ClientDidItem {
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
  pbx_server_id: 1 | 2 | 3;
  pbx_server_label: string;
  call_forwarding_state: 'ON' | 'OFF';
  active_forwarding_numbers: ForwardingTarget[];
  forwarding_updated_at: string;
}
