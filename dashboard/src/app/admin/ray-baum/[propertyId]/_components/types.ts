export interface RayBaumRecord {
  id: string;
  property_id: string;
  phone_number: string;
  assigned_to_room: string | null;
  location: string | null;
  price?: number;
  created_at: string;
  updated_at: string;
}

export interface PropertyDetails {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

export interface RayBaumFormState {
  phone_number: string;
  assigned_to_room: string;
  location: string;
  price: string;
}

