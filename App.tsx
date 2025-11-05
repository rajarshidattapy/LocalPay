import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { InvoiceProvider } from './src/InvoiceContext';
import Navbar from './src/components/Navbar';
import Checkout from './src/pages/Checkout';
import Dashboard from './src/pages/Dashboard';

import './src/styles.css';

export default function App() {
  return (
    <TonConnectUIProvider manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json">
      <InvoiceProvider>
        <BrowserRouter>
          <div className="app-root">
            <Navbar />
            <main className="app-main">
              <Routes>
                <Route path="/" element={<Checkout />} />
                <Route path="/dashboard" element={<Dashboard />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </InvoiceProvider>
    </TonConnectUIProvider>
  );
}
