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
    if (!cart || cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    const firstProduct = cart[0];
    const body = {
      name: firstProduct.title,
      image: firstProduct.image,
    };

    const headers = {
      "Content-Type": "application/json",
    };

    try {
      setLoading(true);
      const nft = await fetch("http://localhost:3000/deploy-collection", {
        method: "POST",
        headers: headers,
        body: JSON.stringify(body),
      });
      const data = await nft.json();

      // 1. Clear the cart logic
      clearCart();

      // 2. Navigate to Success page and pass the API response in 'state'
      navigate("/success", { state: data });
    } catch (error) {
      console.error("Checkout error:", error);
      alert("Something went wrong during deployment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <h2 className="page-title">Your Cart</h2>

      {cart.length === 0 ? (
        <div className="empty-state">
          <p>Your cart is currently empty.</p>
          <br />
          <button
            className="clear-button"
            onClick={() => navigate("/")}
            style={{ marginTop: "1rem" }}
          >
            Return to Shop
          </button>
        </div>
      ) : (
        <div className="cart-list">
          {cart.map((item) => (
            <div className="cart-item" key={item.id}>
              <img src={item.image} alt={item.title} />
              <div className="cart-info">
                <div className="cart-title">{item.title}</div>
                <div className="cart-meta">Quantity: {item.quantity}</div>
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
            <div>
              <span
                style={{
                  color: "#94a3b8",
                  fontSize: "1rem",
                  marginRight: "10px",
                }}
              >
                Total:
              </span>
              ${cartTotal().toFixed(2)}
            </div>
            <div className="cart-buttons">
              <button onClick={() => clearCart()} className="clear-button">
                Clear Cart
              </button>
              <button
                onClick={handleCheckout}
                className="checkout-button"
                disabled={loading}
              >
                {loading ? "Processing..." : "Proceed to Checkout"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Cart;
