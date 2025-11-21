import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateMerchantInsights } from '../utils/aiUtils';
import { DataService, MarketMetrics } from '../services/dataService';

export function MerchantAi() {
    const navigate = useNavigate();
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [marketMetrics, setMarketMetrics] = useState<MarketMetrics | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Fetch real merchant + TON metrics
    useEffect(() => {
        const init = async () => {
            try {
                const merchant = await DataService.getMerchantData();
                const metrics = await DataService.getMarketMetrics();

                setMarketMetrics(metrics);

                const insight = await generateMerchantInsights(
                    merchant,
                    metrics
                );

                setMessages([
                    { role: 'assistant', content: `**Market Analysis:**\n\n${insight}` }
                ]);
            } catch (err) {
                setMessages([{ role: 'assistant', content: "Could not load initial analysis." }]);
            } finally {
                setLoading(false);
            }
        };

        init();
    }, []);

    // Real AI follow-up chat
    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput('');

        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        try {
            const merchant = await DataService.getMerchantData();
            const metrics = marketMetrics || (await DataService.getMarketMetrics());

            const fullContext = [
                ...messages,
                { role: 'user', content: userMsg }
            ];

            const answer = await generateMerchantInsights(
                merchant,
                metrics,
                fullContext
            );

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: answer
            }]);
        } catch {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "Sorry, I couldn't process that query."
            }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-container" style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <style>{`
                .glass-panel {
                    background: rgba(30, 30, 30, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                }
                .markdown-body p { margin-bottom: 0.5em; }
                .markdown-body ul { padding-left: 1.5em; margin-bottom: 0.5em; }
                .markdown-body li { margin-bottom: 0.25em; }
                .markdown-body strong { color: #4ade80; font-weight: 600; }
                .markdown-body table { width: 100%; border-collapse: collapse; margin: 1em 0; }
                .markdown-body th, .markdown-body td { border: 1px solid rgba(255,255,255,0.2); padding: 8px; text-align: left; }
                .markdown-body th { background: rgba(255,255,255,0.1); }
                
                /* Custom Scrollbar */
                .custom-scroll::-webkit-scrollbar { width: 6px; }
                .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.1); }
                .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 3px; }
                .custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.3); }
            `}</style>

            <div className="dashboard-container" style={{
                maxWidth: '1000px',
                margin: '0 auto',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                padding: '1rem'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button
                            onClick={() => navigate('/merchant')}
                            className="secondary-button"
                            style={{ padding: '8px 16px', borderRadius: '12px' }}
                        >
                            ← Back
                        </button>
                        <h2 className="page-title" style={{ margin: 0, fontSize: '1.5rem', background: 'linear-gradient(to right, #fff, #aaa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            AI Business Insights
                        </h2>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {marketMetrics && (
                            <>
                                <span className="status-badge paid" style={{ fontSize: '0.8rem' }}>{marketMetrics.marketTrend}</span>
                                <span className="status-badge pending" style={{ fontSize: '0.8rem' }}>Vol: {marketMetrics.poolVolatility}</span>
                            </>
                        )}
                    </div>
                </div>

                {/* Main Chat Area */}
                <div className="glass-panel" style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
                }}>

                    {/* Messages List */}
                    <div className="custom-scroll" style={{
                        flex: 1,
                        padding: '1.5rem',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem'
                    }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start'
                            }}>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: '#888',
                                    marginBottom: '4px',
                                    marginLeft: msg.role === 'assistant' ? '12px' : 0,
                                    marginRight: msg.role === 'user' ? '12px' : 0
                                }}>
                                    {msg.role === 'user' ? 'You' : 'LocalPay AI'}
                                </div>
                                <div style={{
                                    background: msg.role === 'user'
                                        ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                                        : 'rgba(255, 255, 255, 0.05)',
                                    padding: '1rem 1.5rem',
                                    borderRadius: '16px',
                                    borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                                    borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                                    boxShadow: msg.role === 'user' ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none',
                                    border: msg.role === 'assistant' ? '1px solid rgba(255,255,255,0.05)' : 'none',
                                    color: '#fff',
                                    lineHeight: '1.6'
                                }}>
                                    {msg.role === 'assistant' ? (
                                        <div className="markdown-body">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                {msg.content}
                                            </ReactMarkdown>
                                        </div>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div style={{ alignSelf: 'flex-start', marginLeft: '1rem' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '16px',
                                    borderTopLeftRadius: '4px',
                                    display: 'flex',
                                    gap: '4px',
                                    alignItems: 'center'
                                }}>
                                    <span className="loading-dot" style={{ width: '6px', height: '6px', background: '#888', borderRadius: '50%', animation: 'pulse 1s infinite' }}></span>
                                    <span className="loading-dot" style={{ width: '6px', height: '6px', background: '#888', borderRadius: '50%', animation: 'pulse 1s infinite 0.2s' }}></span>
                                    <span className="loading-dot" style={{ width: '6px', height: '6px', background: '#888', borderRadius: '50%', animation: 'pulse 1s infinite 0.4s' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <div style={{
                        padding: '1.5rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderTop: '1px solid rgba(255,255,255,0.1)',
                        display: 'flex',
                        gap: '1rem'
                    }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask about sales trends, inventory advice, or market analysis..."
                            style={{
                                flex: 1,
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '14px 18px',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'all 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#6366f1'}
                            onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading || !input.trim()}
                            className="primary-button"
                            style={{
                                padding: '0 28px',
                                borderRadius: '12px',
                                background: loading || !input.trim() ? '#333' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
