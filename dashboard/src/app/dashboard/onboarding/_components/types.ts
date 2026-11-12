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

export interface OnboardingRecordItem {
  id: string;
  org_property_id: string;
  property_id: string;
  property_name: string;
  organization_name?: string;
  property_address: string;
  property_location: string;
  property_phone: string;
  contact_person_name: string;
  general_manager_name?: string | null;
  general_manager_phone?: string | null;
  general_manager_email?: string | null;
  services: any[];
  services_count: number;
  status: string;
  stage?: string;
  stage_label: string;
  step_index: number;
  is_waiting_on_client: boolean;
  target_date: string | null;
  progress_percentage: number;
  milestones: {
    contract_sent_at: string | null;
    signed_at: string | null;
    porting_waiting_at: string | null;
    porting_submitted_at: string | null;
    sof_waiting_at: string | null;
    foc_received_at: string | null;
    completed_at: string | null;
  };
  created_at: string;
  updated_at: string;
}
