import { useMemo } from 'react';
import { createTranscriptionService } from '@freshr/shared';
import { deps } from '@/lib/deps';

export function useTranscriptionService() {
  return useMemo(() => createTranscriptionService(deps), []);
}
