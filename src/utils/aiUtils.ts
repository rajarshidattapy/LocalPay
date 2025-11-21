import { Invoice } from '../types';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function generateInvoiceSummary(invoice: Invoice): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        console.warn('OpenRouter API key is missing');
        return "AI summary unavailable (API key missing).";
    }

    const itemsList = invoice.items && invoice.items.length > 0
        ? invoice.items.map(i => `${i.quantity}x ${i.title} (${i.price} TON)`).join(', ')
        : 'Unknown items';

    const prompt = `
    You are an AI assistant for LocalPay, a TON-based crypto marketplace.
    Generate a friendly, human-readable invoice summary for this transaction.
    
    Transaction Details:
    - Merchant: ${invoice.merchant}
    - Amount: ${invoice.amount} TON
    - Date: ${new Date(invoice.timestamp).toLocaleString()}
    - Items: ${itemsList}
    - Transaction Hash: ${invoice.transactionHash}

    Format the response as a clean, professional summary. Do not use markdown formatting like bold or italics, just plain text.
    Example: "You purchased 2x T-Shirt from LocalPay Store for 5.00 TON on Oct 24, 2023. Transaction confirmed."
  `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemma-3-27b-it:free",
                "messages": [
                    { "role": "user", "content": prompt }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "Failed to generate summary.";
    } catch (error) {
        console.error("AI Generation Error:", error);
        return "Failed to generate AI summary. Please try again later.";
    }
}

export interface MarketMetrics {
    tokenVolume: string;
    poolVolatility: string;
    marketTrend: string;
    liquidityStatus: string;
}

import { MerchantData } from '../services/dataService';

export async function generateMerchantInsights(
    merchantData: MerchantData,
    marketMetrics: MarketMetrics
): Promise<string> {
    if (!OPENROUTER_API_KEY) {
        return "AI insights unavailable (API key missing).";
    }

    const totalRevenue = merchantData.sales_history.reduce((sum, sale) => sum + sale.amount, 0);
    const salesCount = merchantData.sales_history.length;
    const lowStockItems = merchantData.inventory.filter(i => i.stock < 20).map(i => i.name).join(', ');

    const prompt = `
    You are an Expert Crypto Merchant Advisor for LocalPay.
    You have access to the merchant's full database (JSON) containing inventory and sales history.

    **Merchant Database Context:**
    - Store Name: ${merchantData.name}
    - Total Revenue: ${totalRevenue.toFixed(2)} TON
    - Total Orders: ${salesCount}
    - Low Stock Alerts: ${lowStockItems || "None"}
    - Recent Sales: ${JSON.stringify(merchantData.sales_history.slice(-5))}

    **Current Market Conditions (Real-time):**
    - Token Volume: ${marketMetrics.tokenVolume}
    - Pool Volatility: ${marketMetrics.poolVolatility}
    - Market Trend: ${marketMetrics.marketTrend}
    - Liquidity Status: ${marketMetrics.liquidityStatus}

    **Instructions:**
    - Analyze the Merchant Database + Market Conditions.
    - Provide 3-4 specific, actionable business insights.
    - If stock is low, suggest restocking based on market trend.
    - If volatility is high, suggest liquidity moves.
    - Reference specific products from the JSON data if relevant.
    - Format as bullet points.
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                "model": "google/gemma-3-27b-it:free",
                "messages": [
                    { "role": "user", "content": prompt }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || "Failed to generate insights.";
    } catch (error) {
        console.error("AI Insight Error:", error);
        return "Failed to generate insights. Please try again later.";
    }
}
