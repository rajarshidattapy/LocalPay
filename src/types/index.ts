export interface Invoice {
  id: string;
  amount: string;
  timestamp: number;
  merchant: string;
  transactionHash: string;
  status: "pending" | "paid";
}

export interface PaymentHistory {
  invoices: Invoice[];
}

// Add this new interface for your NFT deployment response
export interface DeploymentResponse {
  status: string;
  message: string;
  collectionAddress: string;
  metadataUrl: string;
  explorer: string;
  instructions?: string;
}
