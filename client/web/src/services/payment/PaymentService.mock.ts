import type { PaymentService } from "@freshr/shared";

const PaymentServiceMock: PaymentService = {
  listPayments: () => Promise.resolve([]),
  initializePayment: (_billing_interval) =>
    Promise.resolve({ payment_url: "https://mock-payment-url.example.com" }),
};

export default PaymentServiceMock;
