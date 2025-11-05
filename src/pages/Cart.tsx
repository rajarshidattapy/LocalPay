import { useNavigate } from 'react-router-dom';
import { usePayments } from '../context/PaymentContext';
import { useState } from 'react';

export function Cart() {
  const { cart, removeFromCart, clearCart, cartTotal } = usePayments();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    setLoading(true);
    // navigate to checkout - the checkout page will handle invoice/payment simulation
    navigate('/checkout');
    setLoading(false);
  };

  return (
    <div className="page-container">
      <h2 className="page-title">Your Cart</h2>
      {cart.length === 0 ? (
        <div className="empty-state">Your cart is empty</div>
      ) : (
        <div className="cart-list">
          {cart.map(item => (
            <div className="cart-item" key={item.id}>
              <img src={item.image} alt={item.title} />
              <div className="cart-info">
                <div className="cart-title">{item.title}</div>
                <div className="cart-meta">Qty: {item.quantity}</div>
              </div>
              <div className="cart-actions">
                <div className="cart-price">${(item.price * item.quantity).toFixed(2)}</div>
                <button className="remove-button" onClick={() => removeFromCart(item.id)}>Remove</button>
              </div>
            </div>
          ))}

          <div className="cart-summary">
            <div>Total: ${cartTotal().toFixed(2)}</div>
            <div className="cart-buttons">
              <button onClick={() => clearCart()} className="clear-button">Clear</button>
              <button onClick={handleCheckout} className="checkout-button" disabled={loading}>{loading ? 'Preparing...' : 'Checkout'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
