import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { PaymentProvider } from './src/context/PaymentContext';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { Navbar } from './src/components/Navbar';
import { Checkout } from './src/pages/Checkout';
import { Dashboard } from './src/pages/Dashboard';
import './src/styles/global.css';
import { useEffect } from 'react';
import { Home } from './src/pages/Home';
import { Cart } from './src/pages/Cart';
import { Success } from './src/pages/Success';
import { ToastProvider } from './src/components/ToastProvider';
import { Login } from './src/pages/Login';
import { MerchantDashboard } from './src/pages/MerchantDashboard';
import { MerchantAi } from './src/pages/MerchantAi';

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  useEffect(() => {
    // Telegram WebApp initialization (if present)
    const win = window as any;
    try {
      if (win.Telegram && win.Telegram.WebApp) {
        const WebApp = win.Telegram.WebApp;
        WebApp.ready();
        // auto theme
        const themeParams = WebApp.themeParams || {};
        if (themeParams.bg_color) {
          document.documentElement.style.setProperty('--tg-bg', themeParams.bg_color);
        }
        // disable context menu in the mini app
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        // set viewport height CSS var
        const setVH = () => document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
        setVH();
        window.addEventListener('resize', setVH);
      }
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json">
      <AuthProvider>
        <PaymentProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route path="/*" element={
                  <ProtectedRoute>
                    <>
                      <Navbar />
                      <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/success" element={<Success />} />
                        <Route path="/dashboard" element={<Dashboard />} />

                        {/* Merchant Routes */}
                        <Route path="/merchant/home" element={<Home />} />
                        <Route path="/merchant/cart" element={<Cart />} />
                        <Route path="/merchant" element={<MerchantDashboard />} />
                        <Route path="/merchant/ai" element={<MerchantAi />} />
                      </Routes>
                    </>
                  </ProtectedRoute>
                } />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </PaymentProvider>
      </AuthProvider>
    </TonConnectUIProvider>
  );
}
