export interface Partner {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company_name?: string | null;
  default_commission_rate: number;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'SUSPENDED';
  notes?: string | null;
  total_properties_count: number;
  active_properties_count: number;
  monthly_gross_revenue: number;
  monthly_commission_estimated: number;
  effective_share_rate?: number;
  share_display?: string;
  has_custom_override?: boolean;
  has_pending_invite?: boolean;
  created_at: string;
}

export interface PropertyOption {
  id: string;
  name: string;
  address?: string;
  city?: string;
  state?: string;
  monthly_price: number | null;
  partner_id?: string | null;
  partner_commission_override?: number | null;
  status?: string;
}

export interface PartnerInvoiceItem {
  id: string;
  partner_id: string;
  invoice_number: string;
  period_start: string;
  period_end: string;
  total_properties: number;
  gross_revenue: number;
  commission_amount: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'PAID' | 'REJECTED';
  paid_at?: string | null;
  payment_reference?: string | null;
  line_items?: any[];
  notes?: string | null;
  created_at: string;
  partner?: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    company_name?: string | null;
    default_commission_rate?: number;
  };
}

export interface EmailQueueState {
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';
  queuePosition?: number;
  error?: string;
  sentAt?: string;
}

export interface PartnerFormData {
  name: string;
  email: string;
  phone: string;
  company_name: string;
  default_commission_rate: number;
  status: 'ACTIVE' | 'INACTIVE';
  notes: string;
}
