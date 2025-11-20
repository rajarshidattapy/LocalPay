import express, { Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import { config } from "dotenv";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { toNano, beginCell, Address } from '@ton/core';
import { TonClient, WalletContractV4, internal } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { NFTCollection } from './wrappers/NFTCollection';
import { compile } from '@ton/blueprint';

config();
const app = express();
const port = 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(cors());
app.use(express.json());

// Helper function to initialize TON client and wallet
async function initTonWallet() {
  const client = new TonClient({
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: process.env.TON_API_KEY,
  });

  const mnemonic = process.env.WALLET_MNEMONIC;
  if (!mnemonic) {
    throw new Error('WALLET_MNEMONIC not found in environment variables');
  }
  
  const key = await mnemonicToPrivateKey(mnemonic.split(' '));
  const wallet = WalletContractV4.create({ publicKey: key.publicKey, workchain: 0 });
  const walletContract = client.open(wallet);

  // Create a sender object
  const sender = {
    address: walletContract.address,
    send: async (args: any) => {
      await walletContract.sendTransfer({
        secretKey: key.secretKey,
        seqno: await walletContract.getSeqno(),
        messages: [
          internal({
            to: args.to,
            value: args.value,
            body: args.body,
            bounce: args.bounce,
          })
        ]
      });
    }
  };

  return { client, walletContract, sender, key };
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log("Created uploads directory");
}

app.post(
  "/upload",
  upload.single("file"),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      console.log("Received file:", req.file);

      const filePath = path.join(__dirname, "uploads", req.file.filename);
      console.log("File exists? ", fs.existsSync(filePath));
      console.log("File path: ", filePath);

      // Initialize TON client and wallet
      const { client, sender, walletContract } = await initTonWallet();
      const walletAddress = walletContract.address;

      const nftItemCode = await compile('NFTItem');
      const royaltyParams = beginCell()
        .storeUint(5, 16)  // numerator
        .storeUint(100, 16)  // denominator
        .storeAddress(walletAddress)  // royalty destination
        .endCell();

      const nftCollection = client.open(
        NFTCollection.createFromConfig(
            {
                ownerAddress: walletAddress,
                nextItemIndex: 0n,
                nftItemCode: nftItemCode,
                collectionContent: {
                    uri: 'https://i.pinimg.com/originals/71/28/3b/71283bb49db55cfee5bb6acd1389c465.jpg',  // Replace with your metadata URI
                },
                royaltyParams: royaltyParams,
            },
            await compile('NFTCollection')
        )
      );

      // Deploy the collection
      await nftCollection.sendDeploy(sender, toNano('0.05'));

      console.log('NFT Collection deployment initiated at:', nftCollection.address);
      res.json({ success: true, address: nftCollection.address.toString() });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  }
);

// API endpoint to mint an NFT
app.post("/mint-nft", async (req: Request, res: Response) => {
  try {
    const { collectionAddress, nftMetadataUri, itemIndex } = req.body;

    if (!collectionAddress || !nftMetadataUri) {
      res.status(400).json({ 
        error: "Missing required fields: collectionAddress and nftMetadataUri" 
      });
      return;
    }

    // Initialize TON client and wallet
    const { client, sender } = await initTonWallet();

    // Open the existing NFT collection
    const nftCollection = client.open(
      NFTCollection.createFromAddress(Address.parse(collectionAddress))
    );

    // Get the next item index if not provided
    const collectionData = await nftCollection.getCollectionData();
    const nextIndex = itemIndex !== undefined ? BigInt(itemIndex) : collectionData.nextItemIndex;

    // Mint the NFT
    await nftCollection.sendMint(sender, {
      value: toNano('0.05'),
      queryId: Date.now(),
      nftItemContent: { uri: nftMetadataUri },
      itemIndex: nextIndex,
      amount: toNano('0.02'), // Amount to send to NFT item for storage
    });

    // Get the NFT address
    const nftAddress = await nftCollection.getNftAddressByIndex(nextIndex);

    console.log('NFT minted at index:', nextIndex.toString());
    console.log('NFT address:', nftAddress.toString());

    res.json({ 
      success: true, 
      nftAddress: nftAddress.toString(),
      itemIndex: nextIndex.toString(),
      collectionAddress: collectionAddress
    });
  } catch (error) {
    console.error("Mint error:", error);
    res.status(500).json({ 
      error: "Minting failed", 
      details: error instanceof Error ? error.message : String(error)
    });
  }
});


app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
