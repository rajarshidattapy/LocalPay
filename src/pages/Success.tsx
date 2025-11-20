import { useLocation, Link, Navigate } from "react-router-dom";
import { DeploymentResponse } from "../types";

export function Success() {
  const location = useLocation();
  // Retrieve the data passed from Cart.tsx
  const state = location.state as DeploymentResponse | null;

  // If someone navigates to /success manually without data, redirect them home
  if (!state) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="page-container success-container">
      <div className="success-card">
        <div className="success-icon">🎉</div>
        <h2 className="success-title">Deployment Successful!</h2>
        <p className="success-message">{state.message}</p>

        <div className="data-box">
          <div className="data-row">
            <span className="data-label">Collection Address</span>
            <span className="data-value">{state.collectionAddress}</span>
          </div>

          <div className="data-row">
            <span className="data-label">Status</span>
            <span style={{ color: "#4ade80", fontWeight: "bold" }}>
              Active on Testnet
            </span>
          </div>

          {state.instructions && (
            <div className="data-row">
              <span className="data-label">Instructions</span>
              <span style={{ color: "#94a3b8", fontSize: "0.9rem" }}>
                {state.instructions}
              </span>
            </div>
          )}
        </div>

        <div className="action-buttons">
          <Link to="/" className="secondary-button">
            Back to Shop
          </Link>

          {state.explorer && (
            <a
              href={state.explorer}
              target="_blank"
              rel="noopener noreferrer"
              className="primary-button"
            >
              View on Explorer ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default Success;
