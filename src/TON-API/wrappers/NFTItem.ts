import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

import { NftOp } from './NFTConstants';

export type NftItemConfig = {
    index: number | bigint;
    collectionAddress: Address;
    ownerAddress: Address | null;
    content: Cell | null;
};

export function nftItemConfigToCell(config: NftItemConfig): Cell {
    const dataCell = beginCell().storeUint(config.index, 64).storeAddress(config.collectionAddress);

    if (config.ownerAddress && config.content) {
        dataCell.storeAddress(config.ownerAddress).storeRef(config.content);
    }

    return dataCell.endCell();
}

export class NFTItem implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new NFTItem(address);
    }

    static createFromConfig(config: NftItemConfig, code: Cell, workchain = 0) {
        const data = nftItemConfigToCell(config);
        const init = { code, data };
        const address = contractAddress(workchain, init);
        return new NFTItem(address, init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: new Cell(),
        });
    }

    async sendTransfer(
        provider: ContractProvider,
        via: Sender,
        params: {
            value: bigint;
            queryId: number | bigint;
            newOwner: Address;
            responseAddress: Address;
            forwardAmount: bigint;
        },
    ) {
        const transferBody = beginCell()
            .storeUint(NftOp.Transfer, 32) // Operation Code (32 bits)
            .storeUint(params.queryId, 64) // Query ID (64 bits)
            .storeAddress(params.newOwner) // New Owner Address
            .storeAddress(params.responseAddress) // Response Destination
            .storeBit(false) // Custom Payload Flag (1 bit, false)
            .storeCoins(params.forwardAmount) // Forward Amount (Coins)
            .storeBit(false) // Additional bit (satisfies slice_bits >= 1)
            .endCell();

        await provider.internal(via, {
            value: params.value,
            body: transferBody,
        });
    }

    async getNftData(provider: ContractProvider) {
        const res = await provider.get('get_nft_data', []);

        const isInitialized = res.stack.readNumber();
        let index = null;
        let collectionAddress = null;
        let ownerAddress = null;
        let individualContent = null;

        if (isInitialized === -1) {
            index = res.stack.readBigNumber();
            collectionAddress = res.stack.readAddress();
            ownerAddress = res.stack.readAddress();
            individualContent = res.stack.readCell();
        }

        return {
            isInitialized,
            index,
            collectionAddress,
            ownerAddress,
            individualContent,
        };
    }
}
