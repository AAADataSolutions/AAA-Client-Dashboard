import { type Variants } from 'framer-motion';

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatCurrency = (val: number) => {
  const isNeg = val < 0;
  return `${isNeg ? '−' : ''}$${Math.abs(val).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export interface MonthOption {
  key: string;
  label: string;
  year: number;
}

export interface EmailQueueState {
  status: 'QUEUED' | 'SENDING' | 'SENT' | 'FAILED';
  queuePosition?: number;
  error?: string;
}

export interface EmailQueueMeta {
  isProcessing: boolean;
  pendingCount: number;
}

export interface BackorderFormData {
  partner_id: string;
  period_month: string;
  custom_commission_rate: string;
  status: string;
  notes: string;
  send_email: boolean;
}

export interface PortingRevenueItem {
  id: string;
  propertyName: string;
  organizationName: string;
  address?: string;
  monthlyPrice: number;
  servicesPrice: number;
  totalMonthly: number;
  servicesCount: number;
  billingStatus: 'BILLING_DONE' | 'BILLING_PENDING';
  onboardingDate?: string;
}

export interface DataCircuitRevenueItem {
  id: string;
  propertyName: string;
  propertyAddress?: string;
  wholesalerName: string;
  carrierName: string;
  bandwidth?: string;
  clientMonthlyPrice: number;
  revenueSharePercentage: number;
  monthlyCommission: number;
  isReceived: boolean;
  status: string;
}

export interface RevenueStreamsData {
  monthKey: string;
  portingRevenue: {
    totalPortingMrr: number;
    basePropertiesGmr: number;
    servicesGmr: number;
    propertiesCount: number;
    servicesCount: number;
    billingDoneCount: number;
    billingPendingCount: number;
    items: PortingRevenueItem[];
  };
  dataCircuitRevenue: {
    totalExpectedRevShare: number;
    receivedRevShare: number;
    pendingRevShare: number;
    circuitsCount: number;
    receivedCount: number;
    pendingCount: number;
    wholesalerBreakdown: Array<{
      wholesalerName: string;
      expectedAmount: number;
      receivedAmount: number;
      circuitsCount: number;
    }>;
    carrierBreakdown: Array<{
      carrierName: string;
      commissionAmount: number;
      circuitsCount: number;
    }>;
    items: DataCircuitRevenueItem[];
  };
  summary: {
    totalCombinedInflow: number;
    portingPercentage: number;
    circuitPercentage: number;
    annualizedInflow: number;
  };
  historicalTrends: Array<{
    monthKey: string;
    monthLabel: string;
    portingRevenue: number;
    circuitRevenue: number;
    totalRevenue: number;
  }>;
}
