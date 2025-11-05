import React from 'react';
import { useInvoices } from '../InvoiceContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const Dashboard: React.FC = () => {
  const { invoices } = useInvoices();

  const paid = invoices.filter((i: any) => i.status === 'paid').slice().reverse();

  const labels = paid.map((p: any) => new Date(p.createdAt).toLocaleString());
  const data = {
    labels,
    datasets: [
      {
        label: 'TON received',
        data: paid.map((p: any) => p.amount),
        borderColor: '#4ade80',
        backgroundColor: 'rgba(74,222,128,0.2)',
      },
    ],
  };

  return (
    <div className="page dashboard">
      <div className="card">
        <h2>Merchant Dashboard</h2>
        <p>Total payments: {invoices.length}</p>
        <div className="chart">
          <Line data={data} />
        </div>
      </div>

      <div className="card history">
        <h3>Transactions</h3>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Merchant</th>
              <th>Amount (TON)</th>
              <th>Status</th>
              <th>Tx</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id}>
                <td>{new Date(inv.createdAt).toLocaleString()}</td>
                <td>{inv.merchantName}</td>
                <td>{inv.amount}</td>
                <td className={`status ${inv.status}`}>{inv.status}</td>
                <td>{inv.txHash ? <code>{inv.txHash}</code> : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
