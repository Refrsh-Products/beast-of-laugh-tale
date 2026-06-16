import type { StreamClient } from "@freshr/shared";

/**
 * Web implementation of the shared `StreamClient` port using the Fetch API's
 * streaming body reader. Parses an SSE stream of `data: {...}` lines and emits
 * each `text` fragment. Mobile will need an XHR/event-source-based equivalent.
 */
export const webStreamClient: StreamClient = {
  streamSse: async (url, token, onChunk) => {
    const response = await fetch(url, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.body) throw new Error("No response body");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
      for (const line of lines) {
        const raw = line.slice(6); // strip "data: "
        if (raw === "[DONE]") continue;
        const parsed = JSON.parse(raw);
        if (parsed.text) onChunk(parsed.text);
      }
    }
  },
};
