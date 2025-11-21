export interface CartItem {
  id: number | string;
  title: string;
  price: number;
  image?: string;
  quantity: number;
}

export interface Invoice {
  id: string;
  amount: string;
  timestamp: number;
  merchant: string;
  transactionHash: string;
  status: "pending" | "paid";
  items: CartItem[];
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
