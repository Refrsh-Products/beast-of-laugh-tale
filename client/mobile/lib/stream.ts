import type { StreamClient } from '@freshr/shared';

/**
 * Placeholder SSE client. `ServiceDeps` requires a `StreamClient`, but only the
 * chat service streams, which isn't part of the auth epic. A real React Native
 * SSE shim (XHR/event-source based) lands with the chat epic; until then any
 * attempt to stream fails loudly rather than silently hanging.
 */
export const mobileStreamClient: StreamClient = {
  streamSse: async () => {
    throw new Error('streamSse is not implemented on mobile yet (chat epic).');
  },
};
