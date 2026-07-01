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
};

export default PaymentServiceMock;
