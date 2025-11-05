import React, { useState } from 'react';
import { useTonConnectUI, useTonWallet } from '@tonconnect/ui-react';
import { useInvoices } from '../InvoiceContext';

const Checkout: React.FC = () => {
  const { addInvoice, markPaid, markFailed } = useInvoices();
  const [amount, setAmount] = useState<number>(0.01);
  const [merchantName, setMerchantName] = useState<string>('Demo Merchant');
  const [merchantAddress, setMerchantAddress] = useState<string>('');
  const [created, setCreated] = useState<any>(null);

  const [tonConnectUI]: any = useTonConnectUI();
  const wallet: any = useTonWallet();

  const createInvoice = () => {
    if (!amount || amount <= 0) return;
    const inv = addInvoice({ merchantName, merchantAddress, amount });
    setCreated(inv);
  };

  const payInvoice = async (invId: string) => {
    // find invoice from storage/state (we already have it via created)
    try {
      // try to use TON Connect if available
      if (tonConnectUI && merchantAddress) {
        const nanotons = String(Math.round(amount * 1e9));
        const result: any = await tonConnectUI.sendTransaction({
          validUntil: Math.floor(Date.now() / 1000) + 300,
          messages: [
            {
              address: merchantAddress,
              amount: nanotons
            }
          ]
        });
        // result may contain id or txHash depending on wallet; fallback to generated
        const txHash = (result && (result.id || result.txHash)) || `tx_${Date.now()}_${Math.random().toString(36).slice(2,6)}`;
        markPaid(invId, txHash);
        setCreated((c: any) => (c && c.id === invId ? { ...c, status: 'paid', txHash } : c));
        return;
      }

      // fallback simulation
      const txHash = `sim_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      // small delay to simulate
      setTimeout(() => {
        markPaid(invId, txHash);
        setCreated((c: any) => (c && c.id === invId ? { ...c, status: 'paid', txHash } : c));
      }, 900);
    } catch (e) {
      console.error('Payment failed', e);
      markFailed(invId);
      setCreated((c: any) => (c && c.id === invId ? { ...c, status: 'failed' } : c));
    }
  };

  return (
    <div className="page checkout">
      <div className="card">
        <h2>Create Invoice</h2>
        <label>
          Merchant name
          <input value={merchantName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMerchantName(e.target.value)} />
        </label>
        <label>
          Merchant receiving address (paste TON address or leave empty to simulate)
          <input value={merchantAddress} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMerchantAddress(e.target.value)} placeholder="EQ..." />
        </label>
        <label>
          Amount (TON)
          <input type="number" step="0.01" value={amount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(Number(e.target.value))} />
        </label>

        <div className="actions">
          <button onClick={createInvoice}>Create Invoice</button>
        </div>

        {created && (
          <div className="invoice">
            <h3>Invoice created</h3>
            <p>ID: {created.id}</p>
            <p>Amount: {created.amount} TON</p>
            <p>Merchant: {created.merchantName}</p>
            <p>Status: {created.status}</p>
            {created.status !== 'paid' && (
              <button onClick={() => payInvoice(created.id)}>Pay invoice</button>
            )}
            {created.txHash && (
              <p>Tx: <code>{created.txHash}</code></p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;
