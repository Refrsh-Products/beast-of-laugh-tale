import type { StoredAccount } from "../types/entities";
import type { AccountMeResponse } from "../types/dto";

/**
 * The wire shape from GET /accounts/me/ narrowed to what we cache locally
 * (dropping onboarding_completed, timestamps and the user id, which callers
 * read off the response directly).
 *
 * This lived inline in three places — auth.login, auth.googleLogin and
 * account.getAccount — which meant every new profile field was a three-site
 * edit, and the copies had already drifted (only two defaulted address2).
 *
 * Every field defaults rather than trusting the response: during a rollout a
 * client can be talking to a server that predates a column, and a blank string
 * is a better cached value than `undefined` leaking into a profile form.
 */
export function toStoredAccount(resp: AccountMeResponse): StoredAccount {
  return {
    id: resp.id,
    first_name: resp.first_name,
    last_name: resp.last_name,
    profile_picture_url: resp.profile_picture_url,
    address1: resp.address1 ?? "",
    address2: resp.address2 ?? "",
    city: resp.city ?? "",
    postal_code: resp.postal_code ?? "",
    phone: resp.phone,
    university: resp.university ?? "",
    year_of_study: resp.year_of_study ?? "",
    tier_plan: resp.tier_plan,
    billing_interval: resp.billing_interval,
    subscription_status: resp.subscription_status,
  };
}
