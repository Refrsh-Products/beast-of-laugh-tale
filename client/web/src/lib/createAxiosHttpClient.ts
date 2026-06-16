import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type { HttpClient, HttpMethod, HttpRequestConfig } from "@freshr/shared";

/**
 * Adapts an axios instance to the shared `HttpClient` contract. This is the web
 * implementation of the platform HTTP port — the method dispatch mirrors the
 * old `useFetch` hook, minus the (unused) React loading state, so it can also
 * be used outside of a component (e.g. the public policy service).
 */
export function createAxiosHttpClient(api: AxiosInstance): HttpClient {
  return {
    request: async <T>(
      endpoint: string,
      method: HttpMethod = "GET",
      data: unknown = null,
      config: HttpRequestConfig = {},
    ): Promise<T> => {
      const axiosConfig: AxiosRequestConfig = {
        params: config.params,
        timeout: config.timeout,
        headers: config.headers as unknown as AxiosRequestConfig["headers"],
      };

      let response;
      switch (method) {
        case "GET":
          response = api.get<T>(endpoint, axiosConfig);
          break;
        case "POST":
          response = api.post<T>(endpoint, data, axiosConfig);
          break;
        case "PUT":
          response = api.put<T>(endpoint, data, axiosConfig);
          break;
        case "PATCH":
          response = api.patch<T>(endpoint, data, axiosConfig);
          break;
        case "DELETE":
          response = api.delete<T>(endpoint, axiosConfig);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      return (await response).data;
    },
  };
}
