import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { PaymentProvider } from './src/context/PaymentContext';
import { Navbar } from './src/components/Navbar';
import { Checkout } from './src/pages/Checkout';
import { Dashboard } from './src/pages/Dashboard';
import './src/styles/global.css';
import { useEffect } from 'react';
import { Home } from './src/pages/Home';
import { Cart } from './src/pages/Cart';
import { Success } from './src/pages/Success';
import { ToastProvider } from './src/components/ToastProvider';

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
      <PaymentProvider>
        <ToastProvider>
          <BrowserRouter>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/success" element={<Success />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </PaymentProvider>
    </TonConnectUIProvider>
  );
}
