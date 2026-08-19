import type { PaymentService } from "@freshr/shared";

const PaymentServiceMock: PaymentService = {
  listPayments: () => Promise.resolve([]),
  initializePayment: (_billing_interval, _referral_code) =>
    Promise.resolve({ payment_url: "https://mock-payment-url.example.com" }),
  validateReferralCode: (code) => {
    // Mock: treat "TEST-FRE-001" as valid, "USED-FRE-001" as already used, anything else as invalid
    if (code === "TEST-FRE-001") {
      return Promise.resolve({ valid: true, discount_percentage: 10, champion_name: "Test Champion" });
    }
    if (code === "USED-FRE-001") {
      return Promise.resolve({ valid: false, reason: "already_used" });
    }
    return Promise.resolve({ valid: false, reason: "invalid" });
  },
  // Flip `enabled` to true to exercise the gateway-outage fallback locally.
  getFallbackStatus: () =>
    Promise.resolve({
      enabled: false,
      headline: "Online payment is temporarily unavailable",
      message:
        "We're sorry for the inconvenience — leave your details and our team will contact you to get your paid access sorted.",
      whatsapp_url: "https://wa.me/8801700000000",
    }),
  requestAssistance: (billing_interval, options) =>
    Promise.resolve({
      reference_code: "FR-MOCK23",
      billing_interval,
      referral_code: options?.referral_code ?? "",
      phone: options?.phone ?? "",
      status: "NEW",
      whatsapp_url: "https://wa.me/8801700000000",
      created_at: new Date().toISOString(),
    }),
};

export default PaymentServiceMock;
