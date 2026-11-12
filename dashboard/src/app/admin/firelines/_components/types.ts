export interface FireLineItem {
  id: string;
  device_type: string;
  phone_number: string;
  serial_number?: string | null;
  description?: string | null;
  price?: number | null;
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

export interface FireLineFormData {
  device_type: string;
  phone_number: string;
  serial_number: string;
  description: string;
  price: string;
  property_id: string;
}

