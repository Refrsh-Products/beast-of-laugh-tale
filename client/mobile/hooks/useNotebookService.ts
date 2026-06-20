import { createNotebookService, NotebookService } from '@freshr/shared';
import { useMemo } from 'react';
import { deps } from '@/lib/deps';

export function useNotebookService(): NotebookService {
  return useMemo(() => createNotebookService(deps), []);
}
