import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

export function Success() {
  const { state } = useLocation() as any;
  const navigate = useNavigate();

  useEffect(() => {
    const t = setTimeout(() => {
      // after a short while go back to home
      navigate('/');
    }, 5000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="page-container">
      <div className="success-card">
        <h2>Payment Confirmed ✅</h2>
        <p>Your payment was successful.</p>
        {state?.txHash && (
          <p className="tx">Transaction: <code>{state.txHash}</code></p>
        )}
        <p className="muted">You will be redirected to the shop shortly.</p>
      </div>
    </div>
  );
}

export default Success;
