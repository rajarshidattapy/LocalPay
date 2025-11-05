import { useMemo } from 'react';
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

export function Dashboard() {
  const { invoices } = usePayments();

  const totalReceived = useMemo(() => {
    return invoices
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
  }, [invoices]);

  const chartData = useMemo(() => {
    const paidInvoices = invoices
      .filter(inv => inv.status === 'paid')
      .sort((a, b) => a.timestamp - b.timestamp);

    let cumulative = 0;
    const labels = paidInvoices.map(inv => {
      const date = new Date(inv.timestamp);
      return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
    });

    const data = paidInvoices.map(inv => {
      cumulative += parseFloat(inv.amount);
      return cumulative;
    });

    if (labels.length === 0) {
      return {
        labels: ['No data'],
        datasets: [
          {
            label: 'TON Received',
            data: [0],
            borderColor: 'rgb(0, 136, 254)',
            backgroundColor: 'rgba(0, 136, 254, 0.1)',
            fill: true,
            tension: 0.4
          }
        ]
      };
    }

    return {
      labels,
      datasets: [
        {
          label: 'TON Received',
          data,
          borderColor: 'rgb(0, 136, 254)',
          backgroundColor: 'rgba(0, 136, 254, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    };
  }, [invoices]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#e0e0e0'
        }
      },
      title: {
        display: true,
        text: 'Cumulative TON Received',
        color: '#e0e0e0'
      }
    },
    scales: {
      y: {
        ticks: { color: '#e0e0e0' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#e0e0e0' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    }
  };

  return (
    <div className="page-container">
      <div className="dashboard-container">
        <h2 className="page-title">Merchant Dashboard</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Payments</div>
            <div className="stat-value">{invoices.filter(inv => inv.status === 'paid').length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Total Received</div>
            <div className="stat-value">{totalReceived.toFixed(2)} TON</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{invoices.filter(inv => inv.status === 'pending').length}</div>
          </div>
        </div>

        <div className="chart-container">
          <Line data={chartData} options={chartOptions} />
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
                      <span className="detail-label">Invoice ID:</span>
                      <span className="detail-value">{invoice.id}</span>
                    </div>
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
