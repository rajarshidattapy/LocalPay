#!/bin/bash

echo "🚀 NFT Collection Quick Start"
echo "=============================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/wallet-info > /dev/null; then
    echo "❌ Server is not running!"
    echo "Please start the server first: npm start"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Step 1: Check wallet
echo "📊 Step 1: Checking wallet balance..."
WALLET=$(curl -s http://localhost:3000/wallet-info)
echo "$WALLET" | jq '.'

BALANCE=$(echo "$WALLET" | jq -r '.balanceInTON')
echo ""
echo "💰 Balance: $BALANCE TON"

if (( $(echo "$BALANCE < 1" | bc -l) )); then
    echo "⚠️  Warning: You need at least 1 TON to deploy collection and mint NFTs"
    echo "Get testnet TON from: https://t.me/testgiver_ton_bot"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🎨 Step 2: Deploying NFT Collection..."
echo "This will take about 30 seconds..."
echo ""

COLLECTION=$(curl -s -X POST http://localhost:3000/deploy-collection \
  -H "Content-Type: application/json" \
  -d '{
    "collectionName": "Quick Start Collection",
    "collectionDescription": "NFT collection created with quick start script",
    "collectionImage": "https://picsum.photos/800"
  }')

echo "$COLLECTION" | jq '.'

if echo "$COLLECTION" | jq -e '.status == "success"' > /dev/null; then
    COLLECTION_ADDRESS=$(echo "$COLLECTION" | jq -r '.collectionAddress')
    echo ""
    echo "✅ Collection deployed successfully!"
    echo "📍 Collection Address: $COLLECTION_ADDRESS"
    echo "🔍 Explorer: https://testnet.tonscan.org/address/$COLLECTION_ADDRESS"
    echo ""
    echo "⏳ Waiting 30 seconds for blockchain confirmation..."
    
    for i in {30..1}; do
        echo -ne "\r   $i seconds remaining..."
        sleep 1
    done
    echo ""
    echo ""
    
    echo "🎨 Step 3: Minting first NFT..."
    echo ""
    
    NFT=$(curl -s -X POST http://localhost:3000/mint-nft \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Quick Start NFT #1",
        "description": "First NFT minted with quick start script",
        "image": "https://picsum.photos/500"
      }')
    
    echo "$NFT" | jq '.'
    
    if echo "$NFT" | jq -e '.status == "success"' > /dev/null; then
        NFT_ADDRESS=$(echo "$NFT" | jq -r '.nftData.nftAddress')
        echo ""
        echo "🎉 SUCCESS! Your NFT has been minted!"
        echo ""
        echo "📋 Details:"
        echo "   NFT Address: $NFT_ADDRESS"
        echo "   Collection: $COLLECTION_ADDRESS"
        echo ""
        echo "🔍 View on Explorer:"
        echo "   NFT: https://testnet.tonscan.org/address/$NFT_ADDRESS"
        echo "   Collection: https://testnet.tonscan.org/address/$COLLECTION_ADDRESS"
        echo ""
        echo "📱 View in Wallet:"
        echo "   1. Open Tonkeeper or Tonhub"
        echo "   2. Switch to Testnet mode"
        echo "   3. Go to Collectibles/NFTs tab"
        echo "   4. Your NFT will appear within 1-2 minutes!"
        echo ""
        echo "🎨 Mint more NFTs:"
        echo "   curl -X POST http://localhost:3000/mint-nft \\"
        echo "     -H 'Content-Type: application/json' \\"
        echo "     -d '{\"name\":\"NFT #2\",\"description\":\"Another NFT\",\"image\":\"https://picsum.photos/500\"}'"
        echo ""
    else
        echo "❌ NFT minting failed"
        echo "$NFT" | jq '.error'
    fi
else
    echo "❌ Collection deployment failed"
    echo "$COLLECTION" | jq '.error'
fi

echo ""
echo "=============================="
echo "Quick start complete!"
