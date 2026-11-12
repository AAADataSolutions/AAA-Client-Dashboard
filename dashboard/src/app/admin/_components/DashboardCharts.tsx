'use client';

import React from 'react';
import RevenueAllocationChart from './RevenueAllocationChart';
import OnboardingPipelineChart from './OnboardingPipelineChart';
import SupportTicketsChart from './SupportTicketsChart';
import E911ComplianceChart from './E911ComplianceChart';
import {
  SuperAdminKPIs,
  OnboardingPipelineData,
  TicketAnalyticsData,
  E911ComplianceData,
} from './types';

interface DashboardChartsProps {
  isSuperAdmin: boolean;
  superAdminKPIs: SuperAdminKPIs;
  onboardingPipeline: OnboardingPipelineData;
  ticketAnalytics: TicketAnalyticsData;
  e911Compliance: E911ComplianceData;
}

export default function DashboardCharts({
  isSuperAdmin,
  superAdminKPIs,
  onboardingPipeline,
  ticketAnalytics,
  e911Compliance,
}: DashboardChartsProps) {
  if (isSuperAdmin) {
    return <RevenueAllocationChart superAdminKPIs={superAdminKPIs} />;
  }

  return (
    <>
      <OnboardingPipelineChart pipeline={onboardingPipeline} />
      <SupportTicketsChart ticketAnalytics={ticketAnalytics} />
      <E911ComplianceChart compliance={e911Compliance} />
    </>
  );
}
