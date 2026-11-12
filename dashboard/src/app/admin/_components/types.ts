import type { Variants } from 'framer-motion';

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 280,
    },
  },
};

export const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
      staggerChildren: 0.08,
    },
  },
};

export interface SuperAdminKPIs {
  managementGroupsCount: number;
  activeManagementGroupsCount: number;
  propertiesCount: number;
  activePropertiesCount: number;
  pendingPropertiesCount: number;
  grossMRR: number;
  activeMRR: number;
  pendingMRR: number;
  partnerCommissionOutflow: number;
  netRetainedMRR: number;
  retainedPct: number;
  outflowPct: number;
  averagePropertyMRR: number;
  totalPartnersCount: number;
  activePartnersCount: number;
  partnerAssignedPropsCount: number;
}

export interface OperationalStats {
  orgsCount: number;
  propsCount: number;
  servicesCount: number;
  portingCount: number;
  ticketsCount: number;
  urgentTicketsCount: number;
  onboardingsCount: number;
}

export interface OnboardingPipelineData {
  totalActive: number;
  stageCounts: {
    draft: number;
    contractSent: number;
    signed: number;
    cutSheetReview: number;
    portingSubmitted: number;
    focReceived: number;
    completed: number;
    total: number;
  };
  keyProperties: Array<{
    id: string;
    propertyName: string;
    stageName: string;
    percent: number;
    color?: string;
  }>;
}

export interface TicketAnalyticsData {
  open: number;
  urgent: number;
  pending: number;
  resolved: number;
  last7Days: Array<{
    dayName: string;
    created: number;
    resolved: number;
  }>;
}

export interface E911ComplianceData {
  verified: number;
  pending: number;
  correctionRequired: number;
  failed: number;
  total: number;
}
