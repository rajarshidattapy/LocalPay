# LocalPay

TON‑powered mini commerce dApp: browse products, add to cart, simulate TON checkout, deploy an NFT collection, and view a live merchant dashboard.

## Features
- Product catalog (FakeStore API) with skeleton loaders
- Persistent cart (localStorage) & quantity merging
- Simulated TON payments (TonConnect UI + mock rate)
- Merchant dashboard: cumulative TON chart & invoice history
- NFT collection deployment (POST /deploy-collection) success screen
- Toast notifications & glassmorphic responsive UI
- Telegram WebApp integration (MainButton + dynamic theme)
- Mock invoices & transaction hashes for rapid prototyping
- AI Merchant Insights: turns raw sales & token data into direct actions (e.g. price tweaks, restock prompts, liquidity adjustment suggestions)
- AI Invoicing: natural-language invoice generation; formats simulated TON transactions for merchants & buyers

## Quick Start
```bash
npm install
npm run dev
# open http://localhost:5173
```

## Core Scripts
```bash
npm run build    # production bundle
npm run preview  # serve dist locally
```

## Tech Stack
React 18 · TypeScript · Vite · React Router · TonConnect UI · Chart.js

## Notes
- Payment & transaction logic is fully simulated (not on-chain).
- Success page expects navigation state; hard reload may clear data.

## Next Ideas
Real TON payment flow · API abstraction · Basic tests · Env config
