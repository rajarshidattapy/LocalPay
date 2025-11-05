export interface Invoice {
  id: string;
  amount: string;
  timestamp: number;
  merchant: string;
  transactionHash: string;
  status: 'pending' | 'paid';
}

export interface PaymentHistory {
  invoices: Invoice[];
}
