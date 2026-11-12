import { type Variants } from 'framer-motion';

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

export interface ServiceItem {
  id: string;
  ops_id: string;
  custom_service_id?: string;
  service_name?: string;
  phone_number: string;
  service_type: string;
  service_type_description: string;
  organization_name?: string;
  description: string;
  price?: number;
  status: string;
  property_id: string | null;
  property_name: string;
  property_location: string;
  property_address: string;
  is_porting: boolean;
  porting_request_id: string | null;
  porting_status: string | null;
  porting_foc_date: string | null;
  created_at: string;
  updated_at: string;
}
