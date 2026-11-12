'use client';

import { usePortingData } from './usePortingData';
import { usePortingUnifiedModal } from './usePortingUnifiedModal';
import { usePortingActions } from './usePortingActions';

export function usePortingManagement() {
  const data = usePortingData();
  const unifiedModal = usePortingUnifiedModal({
    loadData: data.loadData,
    showToast: data.showToast,
  });
  const actions = usePortingActions({
    loadData: data.loadData,
    showToast: data.showToast,
  });

  return {
    ...data,
    ...unifiedModal,
    ...actions,
  };
}
