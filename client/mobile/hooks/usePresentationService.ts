import { useMemo } from 'react';
import { createPresentationService } from '@freshr/shared';
import { deps } from '@/lib/deps';

export function usePresentationService() {
  return useMemo(() => createPresentationService(deps), []);
}
