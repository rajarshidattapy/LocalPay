import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import { TonClient, WalletContractV4, internal } from '@ton/ton';
import { mnemonicNew, mnemonicToPrivateKey } from '@ton/crypto';
import { toNano, beginCell, Address, Cell } from '@ton/core';
import { PinataSDK } from 'pinata-web3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NFTCollection, nftContentToCell } from './wrappers/NFTCollection.js';
import { compile } from '@ton/blueprint';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const app = express();
app.use(cors());
app.use(express.json());
const port = 3000;

// Cache wallet to avoid recreating on every request
let cachedWalletData: any = null;
let collectionAddress: string | null = null;
let nftCollectionContract: NFTCollection | null = null;
let nftItemCodeCell: Cell | null = null;

// Initialize Pinata for IPFS uploads
const pinata = new PinataSDK({
    pinataJwt: process.env.PINATA_JWT || '',
    pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud',
});

// === Initialize TON Wallet ===
async function initTonWallet() {
    if (cachedWalletData) {
        return cachedWalletData;
    }

    // Check if mnemonic exists in env
    if (!process.env.WALLET_MNEMONIC) {
        throw new Error('WALLET_MNEMONIC not found in .env file. Please add your wallet mnemonic.');
    }

    const client = new TonClient({
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        apiKey: process.env.TON_API_KEY,
    });

    const mnemonics = process.env.WALLET_MNEMONIC.split(' ');
    const keyPair = await mnemonicToPrivateKey(mnemonics);

    const wallet = WalletContractV4.create({
        workchain: 0,
        publicKey: keyPair.publicKey,
    });

    const contract = client.open(wallet);
    const address = wallet.address.toString();

    console.log('📍 Wallet Address:', address);

    cachedWalletData = { client, contract, keyPair, address };
    return cachedWalletData;
}

// === Get Wallet Info ===
app.get('/wallet-info', async (req, res) => {
    try {
        const { contract, address } = await initTonWallet();
        console.log('Contract: ', contract);
        console.log('Address: ', address);
        const balance = await contract.getBalance();
        console.log('💰 Wallet Balance:', balance);
        res.json({
            address: address,
            balance: balance.toString(),
            balanceInTON: (Number(balance) / 1e9).toFixed(4),
            funded: balance > 0n,
            instructions: balance === 0n ? 'Get testnet TON from: https://t.me/testgiver_ton_bot' : 'Wallet is ready!',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to get wallet info' });
    }
});

// === Deploy NFT Collection (Real Implementation) ===
app.post('/deploy-collection', async (req, res) => {
    try {
        const { collectionName, collectionDescription, collectionImage } = req.body;
        const { client, contract, keyPair, address } = await initTonWallet();

        console.log('🚀 Deploying NFT Collection...');

        // Check wallet balance
        const balance = await contract.getBalance();
        console.log('💰 Wallet Balance:', (Number(balance) / 1e9).toFixed(4), 'TON');

        if (Number(balance) < 0.5e9) {
            return res.status(400).json({
                error: 'Insufficient balance',
                message: 'You need at least 0.5 TON to deploy a collection',
                address: address,
                currentBalance: (Number(balance) / 1e9).toFixed(4) + ' TON',
            });
        }

        // Upload collection metadata to IPFS (TEP-64 format)
        const collectionMetadata = {
            name: collectionName,
            description: collectionDescription,
            image: collectionImage,
            external_url: "",
            attributes: []
        };

        console.log('📤 Uploading collection metadata to IPFS...');
        console.log('Metadata:', JSON.stringify(collectionMetadata, null, 2));
        const upload = await pinata.upload.json(collectionMetadata);
        const metadataUrl = `ipfs://${upload.IpfsHash}`;
        console.log('✅ Collection metadata URL:', metadataUrl);

        // Compile contracts
        console.log('📦 Compiling NFT contracts...');
        const nftCollectionCode = await compile('NFTCollection');
        nftItemCodeCell = await compile('NFTItem');

        // Create royalty params (5% royalty)
        const royaltyParams = beginCell()
            .storeUint(5, 16) // 5% royalty
            .storeUint(100, 16) // base 100
            .storeAddress(Address.parse(address)) // royalty address
            .endCell();

        // Create NFT collection
        nftCollectionContract = NFTCollection.createFromConfig(
            {
                ownerAddress: Address.parse(address),
                nextItemIndex: 0n,
                collectionContent: { uri: metadataUrl },
                nftItemCode: nftItemCodeCell,
                royaltyParams: royaltyParams,
            },
            nftCollectionCode
        );

        collectionAddress = nftCollectionContract.address.toString();
        console.log('📍 Collection Address:', collectionAddress);

        // Deploy collection
        const seqno = await contract.getSeqno();
        await contract.sendTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [
                internal({
                    to: nftCollectionContract.address,
                    value: toNano('0.5'),
                    init: nftCollectionContract.init,
                    body: new Cell(),
                }),
            ],
        });

        console.log('✅ Collection deployed!');

        res.json({
            status: 'success',
            message: 'NFT Collection deployed successfully!',
            collectionAddress: collectionAddress,
            metadataUrl: metadataUrl,
            explorer: `https://testnet.tonscan.org/address/${collectionAddress}`,
            instructions: 'Wait 30 seconds for deployment, then use /mint-nft to mint NFTs',
        });
    } catch (error: any) {
        console.error('Collection deployment error:', error);
        res.status(500).json({ error: error.message });
    }
});

// === Mint NFT (Using Collection Contract) ===
app.post('/mint-nft', async (req, res) => {
    try {
        const { name, image, description, recipientAddress } = req.body;
        const { client, contract, keyPair, address } = await initTonWallet();

        console.log('📦 Minting NFT:', { name, image, description });

        // Check if collection is deployed
        if (!nftCollectionContract || !collectionAddress) {
            return res.status(400).json({
                error: 'Collection not deployed',
                message: 'Please deploy an NFT collection first using /deploy-collection',
                instructions: 'POST to /deploy-collection with collectionName, collectionDescription, and collectionImage',
            });
        }

        // Check wallet balance
        const balance = await contract.getBalance();
        console.log('💰 Wallet Balance:', (Number(balance) / 1e9).toFixed(4), 'TON');

        if (Number(balance) < 0.08e9) {
            return res.status(400).json({
                error: 'Insufficient balance',
                message: 'You need at least 0.08 TON to mint an NFT',
                address: address,
                currentBalance: (Number(balance) / 1e9).toFixed(4) + ' TON',
                instructions: 'Get testnet TON from: https://t.me/testgiver_ton_bot',
            });
        }

        // Upload NFT metadata to IPFS (TEP-64 format)
        const nftMetadata = {
            name: name,
            description: description,
            image: image,
            external_url: "",
            attributes: []
        };

        console.log('📤 Uploading NFT metadata to IPFS...');
        console.log('NFT Metadata:', JSON.stringify(nftMetadata, null, 2));
        const upload = await pinata.upload.json(nftMetadata);
        const metadataUrl = `ipfs://${upload.IpfsHash}`;
        console.log('✅ Metadata URL:', metadataUrl);

        // Get collection data to find next item index
        const collectionContract = client.open(nftCollectionContract);
        const collectionData = await collectionContract.getCollectionData();
        const itemIndex = collectionData.nextItemIndex;

        console.log('🔢 Minting NFT #' + itemIndex);

        // Get NFT item address
        const nftItemAddress = await collectionContract.getNftAddressByIndex(itemIndex);
        console.log('📍 NFT Item Address:', nftItemAddress.toString());

        const recipient = recipientAddress ? Address.parse(recipientAddress) : Address.parse(address);

        // Create NFT content with owner
        const nftContent = beginCell()
            .storeAddress(recipient)
            .storeRef(
                beginCell()
                    .storeUint(0x01, 8) // offchain tag
                    .storeStringTail(metadataUrl)
                    .endCell()
            )
            .endCell();

        // Mint NFT through collection
        const seqno = await contract.getSeqno();
        await contract.sendTransfer({
            seqno,
            secretKey: keyPair.secretKey,
            messages: [
                internal({
                    to: nftCollectionContract.address,
                    value: toNano('0.05'),
                    body: beginCell()
                        .storeUint(1, 32) // op: mint
                        .storeUint(0, 64) // query_id
                        .storeUint(itemIndex, 64) // item_index
                        .storeCoins(toNano('0.02')) // amount for NFT
                        .storeRef(nftContent)
                        .endCell(),
                }),
            ],
        });

        console.log('✅ NFT minted!');

        res.json({
            status: 'success',
            message: 'NFT minted successfully from collection!',
            nftData: {
                name: name,
                description: description,
                image: image,
                metadataUrl: metadataUrl,
                ipfsHash: upload.IpfsHash,
                itemIndex: itemIndex.toString(),
                nftAddress: nftItemAddress.toString(),
                collectionAddress: collectionAddress,
                owner: recipient.toString(),
            },
            instructions: {
                viewNFT: 'NFT will appear in your wallet (Tonkeeper/Tonhub) within 1-2 minutes',
                nftExplorer: `https://testnet.tonscan.org/address/${nftItemAddress.toString()}`,
                collectionExplorer: `https://testnet.tonscan.org/address/${collectionAddress}`,
                note: 'This NFT is minted from a real collection contract and will show in wallets!',
            },
        });
    } catch (error: any) {
        console.error('Minting error:', error);
        res.status(500).json({ error: error.message });
    }
});

// === Get Collection Info ===
app.get('/collection-info', async (req, res) => {
    try {
        if (!nftCollectionContract || !collectionAddress) {
            return res.status(404).json({
                error: 'No collection deployed',
                message: 'Deploy a collection first using /deploy-collection',
            });
        }

        const { client } = await initTonWallet();
        const collectionContract = client.open(nftCollectionContract);
        const collectionData = await collectionContract.getCollectionData();

        res.json({
            collectionAddress: collectionAddress,
            nextItemIndex: collectionData.nextItemIndex.toString(),
            totalMinted: collectionData.nextItemIndex.toString(),
            owner: collectionData.ownerAddress.toString(),
            explorer: `https://testnet.tonscan.org/address/${collectionAddress}`,
        });
    } catch (error: any) {
        console.error('Collection info error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`🚀 Server running at http://localhost:${port}`);
});
