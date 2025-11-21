import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePayments } from "../context/PaymentContext";
import { TonConnectButton } from "@tonconnect/ui-react";
import { useAuth } from "../context/AuthContext";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { cart } = usePayments();
  const { userRole, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" style={{ textDecoration: "none" }}>
          <h1 className="logo">💎 LocalPay</h1>
        </Link>

        <div className="nav-links">
          <Link
            to={userRole === 'merchant' ? "/merchant/home" : "/"}
            className={
              location.pathname === "/" || location.pathname === "/merchant/home" ? "nav-link active" : "nav-link"
            }
          >
            Shop
          </Link>
          <Link
            to={userRole === 'merchant' ? "/merchant/cart" : "/cart"}
            className={
              location.pathname === "/cart" || location.pathname === "/merchant/cart" ? "nav-link active" : "nav-link"
            }
          >
            Cart
            {cart.length > 0
              ? ` (${cart.reduce((s, i) => s + i.quantity, 0)})`
              : ""}
          </Link>

          {userRole === 'merchant' ? (
            <Link
              to="/merchant"
              className={
                location.pathname === "/merchant" || location.pathname === "/merchant/ai"
                  ? "nav-link active"
                  : "nav-link"
              }
            >
              Merchant Dashboard
            </Link>
          ) : (
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
          )}
        </div>

        <div className="wallet-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <TonConnectButton />
          <button
            onClick={handleLogout}
            className="secondary-button"
            style={{ padding: '6px 12px', fontSize: '0.8rem' }}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
