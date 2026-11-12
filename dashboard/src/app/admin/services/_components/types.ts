import { type Variants } from 'framer-motion';

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export interface PropertyOption {
  id: string;
  name: string;
  city?: string;
  state?: string;
  organization_name?: string;
}

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'info';
}

export interface ServiceTypeItem {
  id: string;
  name: string;
  description?: string;
}

export interface ServiceFormData {
  custom_service_id: string;
  service_name: string;
  phone_number: string;
  service_type_name: string;
  custom_type_input: string;
  is_custom_type: boolean;
  property_id: string;
  description: string;
  price: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  device_type: string;
  serial_number: string;
  extension: string;
  pbx_server_id: number;
}

export const INITIAL_SERVICE_FORM_DATA: ServiceFormData = {
  custom_service_id: '',
  service_name: '',
  phone_number: '',
  service_type_name: 'Direct Inward Dial (DID)',
  custom_type_input: '',
  is_custom_type: false,
  property_id: '',
  description: '',
  price: '',
  status: 'ACTIVE',
  device_type: '',
  serial_number: '',
  extension: '',
  pbx_server_id: 1,
};

export const SERVICE_TYPES_LIST = [
  'Direct Inward Dial (DID)',
  'Fire Lines',
  'Elevator Lines',
  'SIP Trunk - 100 Channels',
  'Toll-Free 800 Route',
  'Analog Emergency FXS',
  'Cloud PBX Extension',
  'Ray Baum Dedicated E911',
];

export const isFireLineType = (type: string) => {
  const t = (type || '').toLowerCase().replace(/[\s_-]+/g, '');
  return t === 'firelines' || t === 'fireline' || t.includes('fireline');
};

export const isElevatorLineType = (type: string) => {
  const t = (type || '').toLowerCase().replace(/[\s_-]+/g, '');
  return t === 'elevatorlines' || t === 'elevatorline' || t.includes('elevatorline');
};
