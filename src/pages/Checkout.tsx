import { useEffect, useState } from 'react';
import { TonConnectButton } from '@tonconnect/ui-react';
import { usePayments } from '../context/PaymentContext';
import { createInvoice, generateTransactionHash, simulatePayment } from '../utils/invoiceGenerator';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ToastProvider';

export function Checkout() {
  const { addInvoice, updateInvoiceStatus, cart, clearCart, cartTotal } = usePayments();
  const [merchant, setMerchant] = useState('LocalPay Store');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const { addToast } = useToast();

  // mock rate: 1 TON = 2.5 USD
  const MOCK_RATE = 2.5;
  const totalUSD = cartTotal();
  const amountTON = totalUSD > 0 ? +(totalUSD / MOCK_RATE).toFixed(4) : 0;

  useEffect(() => {
    // configure Telegram MainButton if available
    const win = window as any;
    try {
      if (win.Telegram && win.Telegram.WebApp) {
        const WebApp = win.Telegram.WebApp;
        WebApp.MainButton.setText(`Pay ${amountTON} TON`);
        WebApp.MainButton.show();
        WebApp.MainButton.onPress(handlePayment);
        return () => {
          WebApp.MainButton.offPress && WebApp.MainButton.offPress(handlePayment);
          WebApp.MainButton.hide();
        };
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amountTON, cart.length]);

  async function handlePayment() {
    if (cart.length === 0) {
      setMessage('Your cart is empty');
      addToast('Your cart is empty');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const invoice = createInvoice(String(amountTON), merchant, cart);
      addInvoice(invoice);

      addToast('Processing payment...');

      // simulate TON payment
      const { transactionHash } = await simulatePayment(amountTON, 1400 + Math.random() * 1600);

      updateInvoiceStatus(invoice.id, transactionHash);
      addToast('Payment confirmed');
      clearCart();

      navigate('/success', { state: { txHash: transactionHash } });
    } catch (err) {
      setMessage('Payment failed');
      addToast('Payment failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-container">
      <div className="checkout-card">
        <h2 className="page-title">Checkout</h2>
        <p className="subtitle">Complete your order using TON (simulated)</p>

        <div className="wallet-section">
          <TonConnectButton />
        </div>

        <div className="payment-form">
          <div className="form-group">
            <label>Merchant Name</label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              className="input-field"
              placeholder="Enter merchant name"
            />
          </div>

          <div className="form-group">
            <label>Order Total (USD)</label>
            <div className="total-amount">${totalUSD.toFixed(2)}</div>
          </div>

          <div className="form-group">
            <label>Amount (TON)</label>
            <div className="total-amount">{amountTON} TON (1 TON = ${MOCK_RATE} USD)</div>
          </div>

          <button onClick={handlePayment} disabled={loading} className="pay-button">
            {loading ? 'Processing...' : `Pay ${amountTON} TON`}
          </button>

          {message && <div className={`message ${message.includes('failed') ? 'error' : 'success'}`}>{message}</div>}
        </div>
      </div>
    </div>
  );
}
