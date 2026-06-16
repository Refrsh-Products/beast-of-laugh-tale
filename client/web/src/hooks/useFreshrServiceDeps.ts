import { useMemo } from "react";
import type { ServiceDeps } from "@freshr/shared";
import createFreshrApiInstance from "../services/freshr-api";
import useAxiosInterceptor from "./useAxiosInterceptor";
import { createAxiosHttpClient } from "../lib/createAxiosHttpClient";
import { webSessionStore } from "../lib/webSessionStore";
import { webStreamClient } from "../lib/webStreamClient";

/**
 * Assembles the platform adapter (`ServiceDeps`) the shared service factories
 * expect, wiring axios + the auth interceptor, `sessionStorage`/`storage.ts`,
 * Vite env, and the fetch-based SSE stream client.
 *
 * @param useToken whether the request interceptor should attach the bearer
 *   token. Auth endpoints (login/register/verify) run pre-token, so they pass
 *   `false`; everything else uses the default.
 */
export function useFreshrServiceDeps(useToken: boolean = true): ServiceDeps {
  const api = useMemo(() => createFreshrApiInstance(), []);
  const apiWithInterceptor = useAxiosInterceptor(api, useToken);

  return useMemo<ServiceDeps>(
    () => ({
      http: createAxiosHttpClient(apiWithInterceptor),
      session: webSessionStore,
      config: { apiBaseUrl: import.meta.env.VITE_API_BASE_URL },
      stream: webStreamClient,
    }),
    [apiWithInterceptor],
  );
}
