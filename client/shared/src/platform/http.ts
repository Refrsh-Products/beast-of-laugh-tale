/**
 * Platform-agnostic HTTP contract.
 *
 * The shape mirrors the web `useFetch` hook's `fetchData` exactly so the web
 * adapter is a thin pass-through. Mobile will implement this over its own
 * client (axios/fetch) with its own interceptor.
 */

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface HttpRequestConfig {
  params?: Record<string, unknown>;
  // `undefined` is allowed so callers can unset a default header (e.g. let the
  // platform set the multipart boundary for FormData uploads).
  headers?: Record<string, string | undefined>;
  timeout?: number;
}

export interface HttpClient {
  request<T>(
    endpoint: string,
    method?: HttpMethod,
    data?: unknown,
    config?: HttpRequestConfig,
  ): Promise<T>;
}
