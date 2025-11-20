import { toNano, beginCell } from '@ton/core';
import { NFTCollection } from '../wrappers/NFTCollection';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    // Compile NFT Item code first
    const nftItemCode = await compile('NFTItem');

    // Create royalty params (5% royalty, 1/20)
    const royaltyParams = beginCell()
        .storeUint(5, 16) // numerator
        .storeUint(100, 16) // denominator
        .storeAddress(provider.sender().address) // royalty destination
        .endCell();

    // Create NFT Collection
    const nftCollection = provider.open(
        NFTCollection.createFromConfig(
            {
                ownerAddress: provider.sender().address!,
                nextItemIndex: 0n,
                nftItemCode: nftItemCode,
                collectionContent: {
                    uri: 'https://i.pinimg.com/originals/71/28/3b/71283bb49db55cfee5bb6acd1389c465.jpg', // Replace with your metadata URI
                },
                royaltyParams: royaltyParams,
            },
            await compile('NFTCollection'),
        ),
    );

    await nftCollection.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(nftCollection.address);

    console.log('NFT Collection deployed at:', nftCollection.address);
}
