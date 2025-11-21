import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Invoice, CartItem } from '../types';

interface PaymentContextType {
  invoices: Invoice[];
  addInvoice: (invoice: Invoice) => void;
  updateInvoiceStatus: (id: string, transactionHash: string) => void;
  // cart
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (id: number | string) => void;
  clearCart: () => void;
  cartTotal: () => number;
}

const STORAGE_KEY = 'localpay_state_v1';

const PaymentContext = createContext<PaymentContextType | undefined>(undefined);

export function PaymentProvider({ children }: { children: ReactNode }) {
  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.invoices || [];
    } catch {
      return [];
    }
  });

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return parsed.cart || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const payload = { invoices, cart };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      // ignore
    }
  }, [invoices, cart]);

  const addInvoice = (invoice: Invoice) => {
    setInvoices(prev => [invoice, ...prev]);
  };

  const updateInvoiceStatus = (id: string, transactionHash: string) => {
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === id) {
          const updated = { ...inv, status: 'paid' as const, transactionHash };
          // Record to Supabase
          // Fire and forget, but log error if any
          import('../services/dataService').then(async ({ DataService }) => {
            try {
              await DataService.recordSale(updated);
            } catch (e) {
              console.error("Failed to record sale to Supabase", e);
            }
          });
          return updated;
        }
        return inv;
      })
    );
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setCart(prev => {
      const exists = prev.find(p => p.id === item.id);
      if (exists) {
        return prev.map(p => p.id === item.id ? { ...p, quantity: p.quantity + qty } : p);
      }
      return [{ ...item, quantity: qty }, ...prev];
    });
  };

  const removeFromCart = (id: number | string) => {
    setCart(prev => prev.filter(p => p.id !== id));
  };

  const clearCart = () => setCart([]);

  const cartTotal = () => cart.reduce((s, it) => s + it.price * it.quantity, 0);

  return (
    <PaymentContext.Provider value={{ invoices, addInvoice, updateInvoiceStatus, cart, addToCart, removeFromCart, clearCart, cartTotal }}>
      {children}
    </PaymentContext.Provider>
  );
}

export function usePayments() {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayments must be used within PaymentProvider');
  }
  return context;
}
