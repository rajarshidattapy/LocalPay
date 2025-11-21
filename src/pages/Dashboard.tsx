import { useMemo, useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { usePayments } from '../context/PaymentContext';
import { generateInvoiceSummary } from '../utils/aiUtils';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function Dashboard() {
  const { invoices, cart } = usePayments();
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [loadingSummary, setLoadingSummary] = useState<string | null>(null);

  const { totalSpent, spentThisMonth, chartData } = useMemo(() => {
    const paidInvoices = invoices.filter(inv => inv.status === 'paid');
    const total = paidInvoices.reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthTotal = paidInvoices
      .filter(inv => {
        const d = new Date(inv.timestamp);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);

    // Group by Week
    const weeklyGroups: Record<string, number> = {};

    // Helper to get week label (e.g., "Nov Week 1")
    const getWeekLabel = (timestamp: number) => {
      const date = new Date(timestamp);
      const month = date.toLocaleString('default', { month: 'short' });
      const day = date.getDate();
      const weekNum = Math.ceil(day / 7);
      return `${month} Week ${weekNum}`;
    };

    // Sort by date first
    paidInvoices.sort((a, b) => a.timestamp - b.timestamp).forEach(inv => {
      const label = getWeekLabel(inv.timestamp);
      weeklyGroups[label] = (weeklyGroups[label] || 0) + parseFloat(inv.amount);
    });

    const labels = Object.keys(weeklyGroups);
    const data = Object.values(weeklyGroups);

    if (labels.length === 0) {
      return {
        totalSpent: 0,
        spentThisMonth: 0,
        chartData: {
          labels: [''],
          datasets: [{
            label: 'Weekly Spending (TON)',
            data: [0],
            backgroundColor: 'rgba(0, 136, 254, 0.5)',
            borderColor: 'rgb(0, 136, 254)',
            borderWidth: 1
          }]
        }
      };
    }

    return {
      totalSpent: total,
      spentThisMonth: thisMonthTotal,
      chartData: {
        labels,
        datasets: [{
          label: 'Weekly Spending (TON)',
          data,
          backgroundColor: 'rgba(100, 108, 255, 0.5)',
          borderColor: '#646cff',
          borderWidth: 1,
          fill: true,
          tension: 0.3
        }]
      }
    };
  }, [invoices]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: { color: '#e0e0e0' }
      },
      title: {
        display: true,
        text: 'Weekly Spending Habits',
        color: '#e0e0e0',
        font: { size: 16 }
      }
    },
    scales: {
      y: {
        ticks: { color: '#e0e0e0' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        beginAtZero: true
      },
      x: {
        ticks: { color: '#e0e0e0' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  const handleGenerateSummary = async (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;

    setLoadingSummary(invoiceId);
    try {
      const summary = await generateInvoiceSummary(invoice);
      setSummaries(prev => ({ ...prev, [invoiceId]: summary }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingSummary(null);
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-container">
        <h2 className="page-title">Dashboard</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Spent This Month</div>
            <div className="stat-value" style={{ color: '#4ade80' }}>{spentThisMonth.toFixed(2)} TON</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total TON Spent</div>
            <div className="stat-value">{totalSpent.toFixed(2)} TON</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Items in Cart</div>
            <div className="stat-value">{cart.reduce((s, i) => s + i.quantity, 0)}</div>
          </div>
        </div>

        <div className="chart-container">
          <Bar data={chartData} options={chartOptions} />
        </div>

        <div className="transactions-section">
          <h3 className="section-title">Transaction History</h3>
          {invoices.length === 0 ? (
            <div className="empty-state">
              <p>No transactions yet</p>
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
                      <span className="detail-label">Merchant:</span>
                      <span className="detail-value">{invoice.merchant}</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Time:</span>
                      <span className="detail-value">
                        {new Date(invoice.timestamp).toLocaleString()}
                      </span>
                    </div>
                    {invoice.transactionHash && (
                      <div className="detail-row">
                        <span className="detail-label">TX Hash:</span>
                        <span className="detail-value hash">{invoice.transactionHash.slice(0, 20)}...</span>
                      </div>
                    )}
                  </div>

                  {invoice.status === 'paid' && (
                    <div style={{ marginTop: '1rem' }}>
                      {!summaries[invoice.id] ? (
                        <button
                          onClick={() => handleGenerateSummary(invoice.id)}
                          disabled={loadingSummary === invoice.id}
                          className="secondary-button"
                          style={{ width: '100%', fontSize: '0.9rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
                        >
                          {loadingSummary === invoice.id ? 'Generating...' : '✨ AI Invoice Summary'}
                        </button>
                      ) : (
                        <div style={{
                          background: 'rgba(100, 108, 255, 0.1)',
                          padding: '1rem',
                          borderRadius: '8px',
                          border: '1px solid rgba(100, 108, 255, 0.2)',
                          fontSize: '0.9rem',
                          lineHeight: '1.5'
                        }}>
                          <div style={{ fontWeight: 'bold', color: '#646cff', marginBottom: '0.5rem' }}>AI Summary:</div>
                          {summaries[invoice.id]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
