/**
 * Server-Sent-Events streaming contract (used by chat replies).
 *
 * Streaming primitives differ across platforms — web uses
 * `fetch().body.getReader()`, React Native needs an XHR/event-source shim — so
 * the parsing-and-dispatch loop is injected rather than living in shared.
 */
export interface StreamClient {
  /**
   * Open an SSE stream at `url` (with optional bearer `token`) and invoke
   * `onChunk` for every decoded text fragment until the stream completes.
   */
  streamSse(
    url: string,
    token: string | null,
    onChunk: (text: string) => void,
  ): Promise<void>;
}
