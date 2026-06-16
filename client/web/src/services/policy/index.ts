import createFreshrApiInstance from "../freshr-api";
import { createPolicyService, type PolicyDto } from "@freshr/shared";
import { createAxiosHttpClient } from "../../lib/createAxiosHttpClient";

// PolicyDto moved to @freshr/shared; re-exported for back-compat.
export type { PolicyDto };

// Policy endpoints are public, so this uses a plain (interceptor-free) client
// and can run outside any React context.
const policyService = createPolicyService(
  createAxiosHttpClient(createFreshrApiInstance()),
);

export function getActivePolicy(slug: string): Promise<PolicyDto> {
  return policyService.getActive(slug);
}
