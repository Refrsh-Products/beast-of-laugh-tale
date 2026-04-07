import type { PaymentService } from "./PaymentService.types";

const PaymentServiceMock: PaymentService = {
  listPayments: () => Promise.resolve([]),
  initializePayment: (_billing_interval) =>
    Promise.resolve({ payment_url: "https://mock-payment-url.example.com" }),
  initializeStripePayment: (_billing_interval) =>
    Promise.resolve({ payment_url: "https://mock-stripe-payment-url.example.com" }),
};

export default PaymentServiceMock;
