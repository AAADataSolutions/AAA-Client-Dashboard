export interface PropertyCatalogItem {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  main_phone: string | null;
  contact_person_name: string | null;
  general_manager_name: string | null;
  status: string;
}

export interface StartOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newOnboarding: any) => void;
}
