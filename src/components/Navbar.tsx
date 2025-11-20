import { Link, useLocation } from "react-router-dom";
import { usePayments } from "../context/PaymentContext";
import { TonConnectButton } from "@tonconnect/ui-react";

export function Navbar() {
  const location = useLocation();
  const { cart } = usePayments();

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" style={{ textDecoration: "none" }}>
          <h1 className="logo">💎 LocalPay</h1>
        </Link>

        <div className="nav-links">
          <Link
            to="/"
            className={
              location.pathname === "/" ? "nav-link active" : "nav-link"
            }
          >
            Shop
          </Link>
          <Link
            to="/cart"
            className={
              location.pathname === "/cart" ? "nav-link active" : "nav-link"
            }
          >
            Cart
            {cart.length > 0
              ? ` (${cart.reduce((s, i) => s + i.quantity, 0)})`
              : ""}
          </Link>
          <Link
            to="/dashboard"
            className={
              location.pathname === "/dashboard"
                ? "nav-link active"
                : "nav-link"
            }
          >
            Dashboard
          </Link>
        </div>

        <div className="wallet-wrapper">
          <TonConnectButton />
        </div>
      </div>
    </nav>
  );
}
