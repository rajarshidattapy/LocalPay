import { Invoice } from '../types';
import { MerchantData } from '../services/dataService';
import { MarketMetrics } from '../services/dataService';

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

/* -----------------------------------------------------
   1. INVOICE SUMMARY GENERATOR (existing)
------------------------------------------------------ */

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

    Format the response as clean plain text. Do NOT use markdown.
    `;

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemma-3-27b-it:free",
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Failed to generate summary.";

    } catch (error) {
        console.error("AI Generation Error:", error);
        return "Failed to generate AI summary. Please try again later.";
    }
}

/* -----------------------------------------------------
   2. MERCHANT INSIGHTS GENERATOR (new + upgraded)
------------------------------------------------------ */

export async function generateMerchantInsights(
    merchant: MerchantData,
    marketMetrics: MarketMetrics,
    conversationHistory: { role: "user" | "assistant"; content: string }[] = []
): Promise<string> {

    if (!OPENROUTER_API_KEY) {
        return "AI insights unavailable (API key missing).";
    }

    // Summary data
    const totalRevenue = merchant.sales_history.reduce((sum, sale) => sum + sale.amount, 0);
    const salesCount = merchant.sales_history.length;
    const lowStockItems = merchant.inventory
        .filter(i => i.stock < 20)
        .map(i => `${i.name} (stock ${i.stock})`)
        .join(', ') || "None";

    const system = `
You are LocalPay AI — an expert business intelligence analyst for TON-powered merchants.
Your role: analyse inventory, sales history, and TON on-chain market metrics, and produce sharp, actionable insights.
Tone: direct, tactical, no fluff.
`;

    const context = `
### MERCHANT SNAPSHOT
Store Name: ${merchant.name}
Total Revenue: ${totalRevenue.toFixed(2)} TON
Total Orders: ${salesCount}
Low Stock Items: ${lowStockItems}

### INVENTORY (${merchant.inventory.length} items)
${merchant.inventory.map(p => `- ${p.name} | Price ${p.price} | Stock ${p.stock} | Category ${p.category}`).join("\n")}

### RECENT SALES (latest 5)
${merchant.sales_history.slice(-5).map(s => `- ${s.invoiceId}: ${s.amount} TON on ${s.timestamp}`).join("\n")}

### TON ON-CHAIN MARKET
- Volume: ${marketMetrics.tokenVolume}
- Volatility: ${marketMetrics.poolVolatility}
- Trend: ${marketMetrics.marketTrend}
- Liquidity: ${marketMetrics.liquidityStatus}

### TASK
Analyze all data and provide **4 specific merchant insights**, using:
- Inventory patterns
- Recent sales behaviour
- Market trend (bullish/bearish)
- Volatility impact on selling/discounting
- Liquidity impact on timing promotions
- Low-stock warnings
- Category analysis
Output as bullet points. Keep insights practical.
`;

    const messages = [
        { role: "system", content: system },
        { role: "system", content: context },
        ...conversationHistory
    ];

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "google/gemma-3-27b-it:free",
                messages,
                max_tokens: 600
            })
        });

        if (!response.ok) throw new Error(`API request failed: ${response.statusText}`);

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "Failed to generate insights.";

    } catch (err) {
        console.error("AI Insight Error:", err);
        return "Failed to generate insights. Please try again later.";
    }
}
