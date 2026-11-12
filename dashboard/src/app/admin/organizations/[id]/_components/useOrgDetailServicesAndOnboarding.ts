'use client';

import { type OrgDetail } from './types';
import { useOrgDetailServices } from './useOrgDetailServices';
import { useOrgDetailOnboarding } from './useOrgDetailOnboarding';

interface UseOrgDetailServicesAndOnboardingParams {
  orgId: string;
  org: OrgDetail | null;
  showToast: (text: string, type?: 'success' | 'error') => void;
  fetchOrgDetails: () => Promise<void>;
  fetchOrgProperties: () => Promise<void>;
}

export function useOrgDetailServicesAndOnboarding({
  orgId,
  org,
  showToast,
  fetchOrgDetails,
  fetchOrgProperties,
}: UseOrgDetailServicesAndOnboardingParams) {
  const services = useOrgDetailServices({
    orgId,
    org,
    showToast,
    fetchOrgDetails,
    fetchOrgProperties,
  });

  const onboarding = useOrgDetailOnboarding({
    orgId,
    org,
    showToast,
    fetchOrgDetails,
  });

  return {
    ...services,
    ...onboarding,
  };
}
