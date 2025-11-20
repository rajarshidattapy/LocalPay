# TON NFT Collection API

Complete NFT minting system with collection deployment. NFTs will appear in Tonkeeper, Tonhub, and all TON wallets.

## Features

- ✅ Deploy NFT collection contracts
- ✅ Mint NFTs from collection
- ✅ NFTs appear in wallets
- ✅ IPFS metadata storage
- ✅ TON standard compliant (TEP-62)
- ✅ Marketplace compatible

## Quick Start

### 1. Setup

```bash
npm install
```

Add to `.env`:
```env
WALLET_MNEMONIC="your 24 word mnemonic"
PINATA_JWT="your_pinata_jwt_token"
```

Get Pinata JWT from: https://pinata.cloud

### 2. Start Server

```bash
npm start
```

### 3. Deploy & Mint

Run the automated script:
```bash
./quick-start.sh
```

Or manually:

**Deploy Collection:**
```bash
curl -X POST http://localhost:3000/deploy-collection \
  -H "Content-Type: application/json" \
  -d '{
    "collectionName": "My Collection",
    "collectionDescription": "NFT Collection",
    "collectionImage": "https://picsum.photos/800"
  }'
```

Wait 30 seconds, then **Mint NFT:**
```bash
curl -X POST http://localhost:3000/mint-nft \
  -H "Content-Type: application/json" \
  -d '{
    "name": "NFT #1",
    "description": "My NFT",
    "image": "https://picsum.photos/500"
  }'
```

## API Endpoints

### `GET /wallet-info`
Get wallet balance and address

### `POST /deploy-collection`
Deploy NFT collection contract

**Body:**
```json
{
  "collectionName": "string",
  "collectionDescription": "string",
  "collectionImage": "string (URL)"
}
```

**Requirements:** ≥ 0.5 TON

### `POST /mint-nft`
Mint NFT from collection

**Body:**
```json
{
  "name": "string",
  "description": "string",
  "image": "string (URL)",
  "recipientAddress": "string (optional)"
}
```

**Requirements:** 
- Collection deployed
- ≥ 0.08 TON per NFT

### `GET /collection-info`
Get collection details and total minted

## View Your NFTs

### Tonkeeper (Recommended)
1. Download Tonkeeper app
2. Import wallet with mnemonic
3. Settings → Network → **Testnet**
4. Collectibles tab → Your NFTs appear! 🎨

### TON Explorer
Visit the NFT address from mint response:
```
https://testnet.tonscan.org/address/YOUR_NFT_ADDRESS
```

## Costs

**Testnet (Free):**
- Collection: ~0.5 TON
- Per NFT: ~0.05 TON

Get testnet TON: https://t.me/testgiver_ton_bot

**Mainnet:**
- Collection: ~0.5 TON (~$2-3)
- Per NFT: ~0.05 TON (~$0.20-0.30)

## Project Structure

- `contracts/` - NFT collection and item contracts (FunC)
- `wrappers/` - TypeScript wrappers for contracts
- `index.ts` - API server with endpoints
- `quick-start.sh` - Automated deployment script
- `example-requests.http` - API examples

## Troubleshooting

**"Collection not deployed"**
→ Run `/deploy-collection` first

**"Insufficient balance"**
→ Get testnet TON from bot

**"IPFS not configured"**
→ Add `PINATA_JWT` to `.env`

**NFT not in wallet**
→ Wait 1-2 minutes
→ Check Testnet mode is enabled

## Resources

- **TON Docs:** https://docs.ton.org
- **NFT Standard:** https://github.com/ton-blockchain/TEPs/blob/master/text/0062-nft-standard.md
- **Tonkeeper:** https://tonkeeper.com
- **Pinata:** https://pinata.cloud

## License

MIT
