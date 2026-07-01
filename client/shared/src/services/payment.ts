import type { ServiceDeps } from "../platform/deps";
import {
  PaymentServiceApiEndpoints,
  ReferralServiceApiEndpoints,
} from "./endpoints";

export interface Payment {
  id: string;
  account: string;
  transaction_id: string;
  invoice_id: string;
  amount: string;
  currency: string;
  billing_interval: string;
  status: string;
  payment_method: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ValidateReferralResponse {
  valid: boolean;
  discount_percentage?: number;
  champion_name?: string;
  reason?: string;
}

export interface PaymentService {
  listPayments(): Promise<Payment[]>;
  initializePayment(
    billing_interval: string,
    referral_code?: string,
  ): Promise<{ payment_url: string }>;
  validateReferralCode(code: string): Promise<ValidateReferralResponse>;
}

export function createPaymentService(deps: ServiceDeps): PaymentService {
  const { http } = deps;

  return {
    listPayments: async () => {
      return await http.request<Payment[]>(
        PaymentServiceApiEndpoints.getPayments,
        "GET",
      );
    },

    initializePayment: async (billing_interval, referral_code) => {
      return await http.request<{ payment_url: string }>(
        PaymentServiceApiEndpoints.initiatePayment,
        "POST",
        {
          billing_interval,
          ...(referral_code ? { referral_code: referral_code } : {}),
        },
      );
    },

    validateReferralCode: async (code) => {
      return await http.request<ValidateReferralResponse>(
        ReferralServiceApiEndpoints.validateReferralCode,
        "POST",
        { referral_code: code },
      );
    },
  };
}
