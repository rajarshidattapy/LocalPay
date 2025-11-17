import { useNavigate } from "react-router-dom";
import { usePayments } from "../context/PaymentContext";
import { useState } from "react";

export function Cart() {
  const { cart, removeFromCart, clearCart, cartTotal } = usePayments();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // const handleCheckout = async () => {
  //   setLoading(true);
  //   console.log("Navigating to cart", cart);
  //   // navigate to checkout - the checkout page will handle invoice/payment simulation
  //   navigate("/checkout");
  //   setLoading(false);
  // };
  const handleCheckout = async () => {
    // Check if cart has items
    if (!cart || cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    // Get the first product from the cart (or you can loop through all)
    const firstProduct = cart[0];
    console.log("First product in cart:", firstProduct);

    const body = {
      name: firstProduct.title,
      image: firstProduct.image,
    };

    console.log(body);
    const headers = {
      "Content-Type": "application/json",
    };
    const nft = await fetch("http://localhost:3000/deploy-collection", {
      method: "POST",
      headers: headers,
      body: JSON.stringify(body),
    });
    const data = await nft.json();
    console.log(data);
  };

  return (
    <div className="page-container">
      <h2 className="page-title">Your Cart</h2>
      {cart.length === 0 ? (
        <div className="empty-state">Your cart is empty</div>
      ) : (
        <div className="cart-list">
          {cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <img src={item.image} alt={item.title} />
              <div className="cart-info">
                <div className="cart-title">{item.title}</div>
                <div className="cart-meta">Qty: {item.quantity}</div>
              </div>
              <div className="cart-actions">
                <div className="cart-price">
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
                <button
                  className="remove-button"
                  onClick={() => removeFromCart(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="cart-summary">
            <div>Total: ${cartTotal().toFixed(2)}</div>
            <div className="cart-buttons">
              <button onClick={() => clearCart()} className="clear-button">
                Clear
              </button>
              <button
                onClick={handleCheckout}
                className="checkout-button"
                disabled={loading}
              >
                {loading ? "Preparing..." : "Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
