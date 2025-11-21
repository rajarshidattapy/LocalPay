import { Invoice } from '../types';
import supabase from '../utils/supabase';

// Merchant ID (later make dynamic)
const MERCHANT_ID = 'm_001';

// Toncenter Base API
const TONCENTER_BASE = "https://toncenter.com/api/v3";

// Types
export interface MerchantData {
    merchantId: string;
    name: string;
    inventory: {
        productId: string;
        name: string;
        price: number;
        stock: number;
        category: string;
        image: string;
    }[];
    sales_history: {
        invoiceId: string;
        timestamp: string;
        amount: number;
        items: {
            name: string;
            quantity: number;
            price: number;
        }[];
    }[];
    last_updated: string;
}

export interface MarketMetrics {
    tokenVolume: string;       // "$2.45M"
    poolVolatility: string;    // "Low", "Medium", "High"
    marketTrend: string;       // "Bullish (+12%)"
    liquidityStatus: string;   // "Stable", "Overflowing", "Draining"
}

export const DataService = {

    /**
     * Fetch merchant products + sales from Supabase
     */
    getMerchantData: async (): Promise<MerchantData> => {
        try {
            const [products, sales] = await Promise.all([
                supabase.from('products').select('*').eq('merchant_id', MERCHANT_ID),
                supabase.from('sales').select('*').eq('merchant_id', MERCHANT_ID)
            ]);

            return {
                merchantId: MERCHANT_ID,
                name: 'LocalPay Official Store',
                inventory: products.data?.map(p => ({
                    productId: p.id,
                    name: p.name,
                    price: Number(p.price),
                    stock: p.stock,
                    category: p.category,
                    image: p.image
                })) || [],
                sales_history: sales.data?.map(s => ({
                    invoiceId: s.invoice_id,
                    timestamp: s.timestamp,
                    amount: Number(s.amount),
                    items: s.items || []
                })) || [],
                last_updated: new Date().toISOString()
            };

        } catch (error) {
            console.error('Error fetching merchant data:', error);

            return {
                merchantId: MERCHANT_ID,
                name: 'Error',
                inventory: [],
                sales_history: [],
                last_updated: new Date().toISOString()
            };
        }
    },


    /**
     * Fetch real market metrics from Toncenter API
     */
    getMarketMetrics: async (): Promise<MarketMetrics> => {
        try {
            // Trending jettons for price & volume
            const trendingRes = await fetch(`${TONCENTER_BASE}/jettons/trending`);
            const trending = await trendingRes.json();

            // Blockchain stats for liquidity data
            const chainRes = await fetch(`${TONCENTER_BASE}/blockchain/stats`);
            const chainStats = await chainRes.json();

            const top = trending?.jettons?.[0];

            const priceChange = top?.price_change_24h ?? 0;
            const volume = top?.trading_volume_24h ?? 0;
            const liquidity = chainStats?.masterchain?.liquidity ?? 0;

            return {
                tokenVolume: `$${(volume / 1_000_000).toFixed(2)}M`,
                poolVolatility:
                    Math.abs(priceChange) > 10
                        ? "High"
                        : Math.abs(priceChange) > 5
                            ? "Medium"
                            : "Low",
                marketTrend:
                    priceChange > 5
                        ? `Bullish (+${priceChange.toFixed(2)}%)`
                        : priceChange < -5
                            ? `Bearish (${priceChange.toFixed(2)}%)`
                            : "Neutral",
                liquidityStatus:
                    liquidity > 1_000_000_000
                        ? "Overflowing"
                        : liquidity > 500_000_000
                            ? "Stable"
                            : "Draining"
            };

        } catch (err) {
            console.error("Toncenter API error:", err);

            return {
                tokenVolume: "N/A",
                poolVolatility: "Unknown",
                marketTrend: "Unknown",
                liquidityStatus: "Unknown"
            };
        }
    },


    /**
     * Record sale + update stock
     */
    recordSale: async (invoice: Invoice) => {
        try {
            const { error } = await supabase.from('sales').insert({
                merchant_id: MERCHANT_ID,
                invoice_id: invoice.id,
                amount: parseFloat(invoice.amount),
                items: invoice.items?.map(i => ({
                    name: i.title,
                    quantity: i.quantity,
                    price: i.price
                })) || [],
                timestamp: new Date(invoice.timestamp).toISOString()
            });

            if (error) throw error;

            // Update stock per item
            for (const item of invoice.items || []) {
                const { data: product } = await supabase
                    .from('products')
                    .select('id, stock')
                    .eq('name', item.title)
                    .eq('merchant_id', MERCHANT_ID)
                    .single();

                if (product) {
                    await supabase
                        .from('products')
                        .update({
                            stock: Math.max(0, product.stock - item.quantity)
                        })
                        .eq('id', product.id);
                }
            }
        } catch (error) {
            console.error('Error recording sale:', error);
        }
    },


    /**
     * Add product to Supabase
     */
    addProduct: async (product: Omit<MerchantData['inventory'][0], 'productId'>) => {
        const { data, error } = await supabase.from('products').insert({
            merchant_id: MERCHANT_ID,
            name: product.name,
            price: product.price,
            stock: product.stock,
            category: product.category,
            image: product.image
        }).select().single();

        if (error) throw error;
        return data;
    },


    /**
     * Update product fields
     */
    updateProduct: async (productId: string, updates: Partial<Omit<MerchantData['inventory'][0], 'productId'>>) => {
        const { data, error } = await supabase.from('products').update({
            name: updates.name,
            price: updates.price,
            stock: updates.stock,
            category: updates.category,
            image: updates.image
        }).eq('id', productId).select().single();

        if (error) throw error;
        return data;
    },


    /**
     * Delete product
     */
    deleteProduct: async (productId: string) => {
        const { error } = await supabase.from('products').delete().eq('id', productId);
        if (error) throw error;
    }
};
