import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

import { NftOp } from './NFTConstants';

export type NftCollectionContent = {
    uri: string;
};

export type NftCollectionConfig = {
    ownerAddress: Address;
    nextItemIndex: bigint;
    nftItemCode: Cell;
    collectionContent: Cell | NftCollectionContent;
    royaltyParams: Cell;
};

export function nftContentToCell(content: NftCollectionContent): Cell {
    return beginCell()
        .storeRef(
            beginCell()
                .storeUint(0x01, 8) // Content type (off-chain)
                .storeStringTail(content.uri)
                .endCell(),
        )
        .endCell();
}

export function nftCollectionConfigToCell(config: NftCollectionConfig): Cell {
    const content =
        config.collectionContent instanceof Cell
            ? config.collectionContent
            : nftContentToCell(config.collectionContent);

    return beginCell()
        .storeAddress(config.ownerAddress)
        .storeUint(config.nextItemIndex, 64)
        .storeRef(content)
        .storeRef(config.nftItemCode)
        .storeRef(config.royaltyParams)
        .endCell();
}

export class NFTCollection implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new NFTCollection(address);
    }

    static createFromConfig(config: NftCollectionConfig, code: Cell, workchain = 0) {
        const data = nftCollectionConfigToCell(config);
        const init = { code, data };
        return new NFTCollection(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: new Cell(),
        });
    }

    async sendMint(
        provider: ContractProvider,
        via: Sender,
        params: {
            value: bigint;
            queryId: number | bigint;
            nftItemContent: Cell | NftCollectionContent;
            itemIndex: number | bigint;
            amount: bigint;
        },
    ) {
        const content =
            params.nftItemContent instanceof Cell ? params.nftItemContent : nftContentToCell(params.nftItemContent);

        const mintBody = beginCell()
            .storeUint(NftOp.Mint, 32)
            .storeUint(params.queryId, 64)
            .storeUint(params.itemIndex, 64)
            .storeCoins(params.amount)
            .storeRef(content)
            .endCell();

        await provider.internal(via, {
            value: params.value,
            body: mintBody,
        });
    }

    async getCollectionData(provider: ContractProvider) {
        const res = await provider.get('get_collection_data', []);

        const nextItemIndex = res.stack.readBigNumber();
        const collectionContent = res.stack.readCell();
        const ownerAddress = res.stack.readAddress();

        return {
            nextItemIndex,
            collectionContent,
            ownerAddress,
        };
    }

    async getNftAddressByIndex(provider: ContractProvider, index: bigint): Promise<Address> {
        const res = await provider.get('get_nft_address_by_index', [{ type: 'int', value: index }]);

        return res.stack.readAddress();
    }
}
