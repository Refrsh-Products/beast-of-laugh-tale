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

export interface PaymentService {
  listPayments(): Promise<Payment[]>;
  initializePayment(billing_interval: string): Promise<{ payment_url: string }>;
}
