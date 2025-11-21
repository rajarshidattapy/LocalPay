import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { usePayments } from '../context/PaymentContext';
import { DataService, MerchantData } from '../services/dataService';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

export function MerchantDashboard() {
    const { invoices } = usePayments();
    const navigate = useNavigate();
    const [newOrderAlert, setNewOrderAlert] = useState<string | null>(null);
    const [prevInvoiceCount, setPrevInvoiceCount] = useState(invoices.length);

    // Load data on mount
    useEffect(() => {
        // In a real app, we'd fetch invoices from Supabase here too
        // For now, invoices come from PaymentContext (which is local state)
        // But we should probably sync them.
        // Let's just ensure we have the latest merchant data for other stats if needed
    }, []);

    // Live Sale Alert Logic
    useEffect(() => {
        if (invoices.length > prevInvoiceCount) {
            const latest = invoices[0]; // Assuming newest first or we find diff
            setNewOrderAlert(`New Order Received! ${latest.amount} TON`);
            // Auto-hide after 5s
            const timer = setTimeout(() => setNewOrderAlert(null), 5000);
            setPrevInvoiceCount(invoices.length);
            return () => clearTimeout(timer);
        }
        setPrevInvoiceCount(invoices.length);
    }, [invoices.length]);

    // Mock data for merchant since we don't have a full backend yet
    const totalRevenue = invoices
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    const chartData = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
            {
                label: 'Revenue (TON)',
                data: [12, 1, 2, totalRevenue],
                borderColor: 'rgb(75, 192, 192)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.4
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { labels: { color: '#e0e0e0' } },
            title: { display: true, text: 'Weekly Revenue', color: '#e0e0e0' }
        },
        scales: {
            y: { ticks: { color: '#e0e0e0' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
            x: { ticks: { color: '#e0e0e0' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } }
        }
    };

    return (
        <div className="page-container">
            {newOrderAlert && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: '#4ade80',
                    color: '#000',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    zIndex: 1000,
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    🎉 {newOrderAlert}
                </div>
            )}

            <div className="dashboard-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 className="page-title" style={{ margin: 0 }}>Merchant Dashboard</h2>
                    <Link to="/merchant/ai" className="add-button" style={{ background: 'linear-gradient(45deg, #9c27b0, #673ab7)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        ✨ AI Insights
                    </Link>
                </div>

                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-label">Total Revenue</div>
                        <div className="stat-value">{totalRevenue.toFixed(2)} TON</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Orders</div>
                        <div className="stat-value">{invoices.length}</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-label">Avg. Order Value</div>
                        <div className="stat-value">
                            {invoices.length > 0 ? (totalRevenue / invoices.length).toFixed(2) : '0.00'} TON
                        </div>
                    </div>
                </div>

                <div className="chart-container">
                    <Line data={chartData} options={chartOptions} />
                </div>

                <div className="transactions-section">
                    <h3 className="section-title">Recent Sales</h3>
                    {invoices.length === 0 ? (
                        <div className="empty-state">
                            <p>No sales yet</p>
                        </div>
                    ) : (
                        <div className="transactions-list">
                            {invoices.map(invoice => (
                                <div key={invoice.id} className="transaction-card">
                                    <div className="transaction-header">
                                        <span className={`status-badge ${invoice.status}`}>
                                            {invoice.status === 'paid' ? '✓ Paid' : '⏳ Pending'}
                                        </span>
                                        <span className="transaction-amount">{invoice.amount} TON</span>
                                    </div>
                                    <div className="transaction-details">
                                        <div className="detail-row">
                                            <span className="detail-label">Order ID:</span>
                                            <span className="detail-value">{invoice.id}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Date:</span>
                                            <span className="detail-value">
                                                {new Date(invoice.timestamp).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
