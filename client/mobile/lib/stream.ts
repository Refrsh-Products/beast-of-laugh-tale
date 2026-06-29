import EventSource from 'react-native-sse';
import type { StreamClient } from '@freshr/shared';

/**
 * React Native implementation of the shared `StreamClient` port using `react-native-sse`.
 * Parses an SSE stream of `data: {...}` lines and emits each `text` fragment.
 */
export const mobileStreamClient: StreamClient = {
  streamSse: (url, token, onChunk) => {
    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const eventSource = new EventSource(url, { headers });

      eventSource.addEventListener('message', (event) => {
        if (!event.data || event.data === '[DONE]') {
          return;
        }
        
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.text) {
            onChunk(parsed.text);
          }
        } catch (err) {
          console.warn('[SSE Parse Error]', err);
        }
      });

      eventSource.addEventListener('error', (error: any) => {
        if (error.type === 'error') {
          console.error('[SSE Error]', error.message);
        } else if (error.type === 'exception') {
          console.error('[SSE Exception]', error.message);
          eventSource.removeAllEventListeners();
          eventSource.close();
          reject(new Error(error.message));
        }
      });

      eventSource.addEventListener('close', () => {
        eventSource.removeAllEventListeners();
        eventSource.close();
        resolve();
      });
    });
  },
};
