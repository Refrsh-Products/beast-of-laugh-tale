import type { HttpClient } from "../platform/http";
import { PolicyServiceApiEndpoints } from "./endpoints";

export interface PolicyDto {
  slug: string;
  version: number;
  title: string;
  body: string;
  effective_date: string;
  updated_at: string;
}

export interface PolicyService {
  getActive(slug: string): Promise<PolicyDto>;
}

/**
 * Policy endpoints are public (no auth), so this factory takes a bare
 * `HttpClient` rather than the full `ServiceDeps` — callers can pass an
 * interceptor-free client and use it outside of any React context.
 */
export function createPolicyService(http: HttpClient): PolicyService {
  return {
    getActive: async (slug: string) => {
      return await http.request<PolicyDto>(
        PolicyServiceApiEndpoints.getActive(slug),
        "GET",
      );
    },
  };
}
