import { Config } from '@ton/blueprint';
console.log('API KEY: ', process.env.API_KEY);
export const config: Config = {
    network: {
        endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
        type: 'testnet',
        version: 'v2',
        key: process.env.API_KEY,
    },
};
