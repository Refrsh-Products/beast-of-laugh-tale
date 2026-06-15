import createFreshrApiInstance, {
  PolicyServiceApiEndpoints,
} from "../freshr-api";

export interface PolicyDto {
  slug: string;
  version: number;
  title: string;
  body: string;
  effective_date: string;
  updated_at: string;
}

export async function getActivePolicy(slug: string): Promise<PolicyDto> {
  const api = createFreshrApiInstance();
  const { data } = await api.get<PolicyDto>(
    PolicyServiceApiEndpoints.getActive(slug),
  );
  return data;
}
