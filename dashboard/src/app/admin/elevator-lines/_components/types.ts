export interface ElevatorLineItem {
  id: string;
  phone_number: string;
  extension?: string | null;
  description?: string | null;
  price?: number | null;
  status: string;
  property_id?: string | null;
  service_id?: string | null;
  created_at: string;
  updated_at: string;
  property?: { id: string; name: string; city?: string; state?: string } | null;
  service?: { id: string; service_name?: string; phone_number: string; price?: number | null } | null;
}

export interface PropertyOption {
  id: string;
  name: string;
}

export interface ElevatorLineFormData {
  phone_number: string;
  extension: string;
  description: string;
  price: string;
  status: string;
  property_id: string;
}

