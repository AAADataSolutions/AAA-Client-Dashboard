import { type Variants } from 'framer-motion';

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 24,
    },
  },
};

export interface E911RecordItem {
  id: string;
  org_property_id: string;
  property_id: string;
  property_name: string;
  organization_name?: string;
  property_location: string;
  property_phone: string;
  property_address: string;
  emergency_address: string;
  status: string;
  correction_notes: string | null;
  verified_at: string | null;
  ray_baud_and_logs_enabled: boolean;
  updated_at: string;
}
