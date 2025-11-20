import { Blockchain, internal, printTransactionFees, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano, Address, beginCell } from '@ton/core';
import { compile } from '@ton/blueprint';
import '@ton/test-utils';
import { NFTCollection, nftContentToCell, NftCollectionConfig } from '../wrappers/NFTCollection';
import { NFTItem } from '../wrappers/NFTItem';
import { NftOp } from '../wrappers/NFTConstants';
import { inherits } from 'util';

let blockchain: Blockchain;
let deployer: SandboxContract<TreasuryContract>;
let owner: SandboxContract<TreasuryContract>;
let user: SandboxContract<TreasuryContract>;
let collection: SandboxContract<NFTCollection>;
let nftCollectionCode: Cell;
let nftItemCode: Cell;

describe('NFTCollection Contract', () => {
    beforeAll(async () => {
        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        owner = await blockchain.treasury('owner');
        user = await blockchain.treasury('user');

        // Compile the contracts
        nftCollectionCode = await compile('NFTCollection');
        nftItemCode = await compile('NFTItem');

        // Prepare the collection content
        const collectionContentCell = nftContentToCell({
            uri: 'https://example.com/collection.json',
        });

        const royaltyParams = beginCell()
            .storeUint(500, 16) // Example: 5% royalty fee
            .storeAddress(owner.address) // Royalty recipient address
            .endCell();

        // Create the collection config
        const collectionConfig: NftCollectionConfig = {
            ownerAddress: owner.address,
            nextItemIndex: 0n,
            nftItemCode: nftItemCode,
            collectionContent: collectionContentCell,
            royaltyParams: royaltyParams,
        };

        // Create the collection contract instance
        const collectionContract = NFTCollection.createFromConfig(collectionConfig, nftCollectionCode);

        collection = blockchain.openContract(collectionContract);
    });

    it('should deploy NFTCollection contract', async () => {
        const deployResult = await collection.sendDeploy(deployer.getSender(), toNano('1'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: collection.address,
            deploy: true,
            success: true,
        });
    });

    it('should get collection data', async () => {
        const collectionData = await collection.getCollectionData();

        expect(collectionData.nextItemIndex).toBe(0n);
        expect(collectionData.ownerAddress.equals(owner.address)).toBe(true);
    });

    it('should mint a new NFT item', async () => {
        // Prepare the NFT item content
        const nftItemContentCell = nftContentToCell({
            uri: 'https://example.com/nft1.json',
        });

        const initialCollectionData = await collection.getCollectionData();

        // Mint the NFT
        const mintResult = await collection.sendMint(owner.getSender(), {
            value: toNano('0.5'),
            queryId: 0,
            nftItemContent: nftItemContentCell,
            itemIndex: initialCollectionData.nextItemIndex,
            amount: toNano('0.1'),
        });

        expect(mintResult.transactions).toHaveTransaction({
            from: owner.address,
            to: collection.address,
            success: true,
        });

        // Check that nextItemIndex has incremented
        const updCollectionData = await collection.getCollectionData();
        expect(updCollectionData.nextItemIndex).toBe(initialCollectionData.nextItemIndex + 1n);
    });

    it('should verify not initialized NFT item', async () => {
        const nftItemAddress = await collection.getNftAddressByIndex(0n);
        const nftItemContract = NFTItem.createFromAddress(nftItemAddress);
        const nftItem = blockchain.openContract(nftItemContract);

        const nftData = await nftItem.getNftData();
        expect(nftData.isInitialized).toBe(0);
        expect(nftData.ownerAddress).toBe(null);
    });
});
