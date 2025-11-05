import React, { createContext, useContext, useEffect, useState } from 'react';

export type Invoice = {
  id: string;
  merchantName: string;
  merchantAddress: string;
  amount: number; // TON
  createdAt: number; // epoch ms
  status: 'pending' | 'paid' | 'failed';
  txHash?: string;
};

type InvoiceContextType = {
  invoices: Invoice[];
  addInvoice: (inv: Omit<Invoice, 'id' | 'createdAt' | 'status'>) => Invoice;
  markPaid: (id: string, txHash?: string) => void;
  markFailed: (id: string) => void;
};

const STORAGE_KEY = 'localpay_invoices';

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const InvoiceProvider: React.FC<React.PropsWithChildren<{}>> = ({ children }: { children: React.ReactNode }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setInvoices(JSON.parse(raw));
    } catch (e) {
      console.warn('Failed to load invoices', e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    } catch (e) {
      console.warn('Failed to save invoices', e);
    }
  }, [invoices]);

  const addInvoice = (inv: Omit<Invoice, 'id' | 'createdAt' | 'status'>) => {
    const newInv: Invoice = {
      ...inv,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      createdAt: Date.now(),
      status: 'pending'
    };
  setInvoices((s: Invoice[]) => [newInv, ...s]);
    return newInv;
  };

  const markPaid = (id: string, txHash?: string) => {
  setInvoices((s: Invoice[]) => s.map((inv: Invoice) => (inv.id === id ? { ...inv, status: 'paid', txHash } : inv)));
  };

  const markFailed = (id: string) => {
  setInvoices((s: Invoice[]) => s.map((inv: Invoice) => (inv.id === id ? { ...inv, status: 'failed' } : inv)));
  };

  return (
    <InvoiceContext.Provider value={{ invoices, addInvoice, markPaid, markFailed }}>
      {children}
    </InvoiceContext.Provider>
  );
};

export const useInvoices = () => {
  const ctx = useContext(InvoiceContext);
  if (!ctx) throw new Error('useInvoices must be used within InvoiceProvider');
  return ctx;
};

export default InvoiceContext;
