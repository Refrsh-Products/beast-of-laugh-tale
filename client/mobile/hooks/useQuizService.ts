import { useMemo } from 'react';
import { createQuizService } from '@freshr/shared';
import { deps } from '@/lib/deps';

export function useQuizService() {
  return useMemo(() => createQuizService(deps), []);
}
