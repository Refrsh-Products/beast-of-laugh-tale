import { useMemo } from 'react';
import { createChatService } from '@freshr/shared';
import { deps } from '@/lib/deps';

export function useChatService() {
  return useMemo(() => createChatService(deps), []);
}
