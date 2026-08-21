import EventSource from 'react-native-sse';
import type { StreamClient } from '@freshr/shared';

/**
 * React Native implementation of the shared `StreamClient` port using `react-native-sse`.
 * Parses an SSE stream of `data: {...}` lines and emits each `text` fragment.
 *
 * react-native-sse re-polls every 5s after ANY terminal state — HTTP errors, but
 * also a successfully completed stream. So we must explicitly close on the
 * server's `[DONE]` sentinel and on errors, or the client silently re-hits the
 * endpoint forever (generating duplicate LLM replies / spamming failed requests).
 */
export const mobileStreamClient: StreamClient = {
  streamSse: (url, token, onChunk) => {
    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const eventSource = new EventSource(url, { headers });

      const finish = (error?: Error) => {
        eventSource.removeAllEventListeners();
        eventSource.close();
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      };

      eventSource.addEventListener('message', (event) => {
        if (!event.data) return;
        if (event.data === '[DONE]') {
          finish();
          return;
        }

        try {
          const parsed = JSON.parse(event.data);
          if (parsed.error) {
            finish(new Error(parsed.error));
          } else if (parsed.text) {
            onChunk(parsed.text);
          }
        } catch (err) {
          console.warn('[SSE Parse Error]', err);
        }
      });

      eventSource.addEventListener('error', (error: any) => {
        console.error('[SSE Error]', error.message);
        finish(new Error(error.message || 'Stream connection failed.'));
      });

      eventSource.addEventListener('close', () => {
        finish();
      });
    });
  },
};
