# TON Connect React Example

A minimal demo dApp using [`@tonconnect/ui-react`](https://github.com/ton-connect/sdk/tree/main/packages/ui-react).

## Quick start

```bash
# install dependencies
npm i

# start dev server (Vite, default http://localhost:5173)
npm run dev
```

Open the page in your browser, press **Connect wallet** and use a TON wallet (e.g. **Tonkeeper** or **MyTonWallet**) to approve the connection and send a 1 TON transaction.

> **Note:** You can use a desktop wallet (e.g. **Tonkeeper Pro** or **Tondev Wallet**) that can access `http://localhost:5173` if you want to use a local manifest.

## "Production" build

```bash
npm run build
npm run preview   # local preview of the build
``` 