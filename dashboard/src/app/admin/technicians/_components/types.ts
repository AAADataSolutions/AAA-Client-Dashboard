export interface Technician {
  id: string;
  name: string;
  area_name: string;
  phone_no: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

export interface TechnicianFormData {
  name: string;
  area_name: string;
  phone_no: string;
  status: string;
}

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

