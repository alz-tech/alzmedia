import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataList from '../../components/DataList';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

export default function FundWallet() {
  const { success, error } = useToast();
  const [amount, setAmount]   = useState('');
  const [loading, setLoading] = useState(false);
  const [txns,    setTxns]    = useState([]);
  const [balance, setBalance] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get('/advertiser/stats'),
      api.get('/advertiser/transactions'),
    ]).then(([s, t]) => {
      setBalance(s.data.data?.wallet_balance);
      setTxns(t.data.data);
    }).catch(() => error('Failed to load wallet data'));
  }, []);

  async function handleFund(e) {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 500) return error('Minimum amount is ₦500');
    setLoading(true);
    try {
      const res = await api.post('/advertiser/fund', { amount: parseFloat(amount) });
      success('Redirecting to payment...');
      window.location.href = res.data.data.payment_url;
    } catch (err) {
      error(err.response?.data?.message || 'Failed to initialize payment');
    } finally {
      setLoading(false);
    }
  }

  const txColumns = [
    { key:'created_at', label:'Date',   render: v => new Date(v).toLocaleDateString() },
    { key:'type',       label:'Type',   render: v => v.replace(/_/g,' ') },
    { key:'amount',     label:'Amount', render: v => `₦${Number(v).toLocaleString()}` },
    { key:'status',     label:'Status', render: v => <span className={`badge badge-${v}`}>{v}</span> },
  ];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Wallet</h1>
        <p className="page-subtitle">Fund your wallet to run campaigns</p>
      </div>

      <div className="wallet-layout">
        <div className="card">
          <div className="balance-box">
            <div className="balance-box-label">Wallet Balance</div>
            <div className="balance-box-value">
              ₦{Number(balance || 0).toLocaleString()}
            </div>
          </div>
          <form onSubmit={handleFund}>
            <div className="form-group">
              <label className="form-label">Amount to fund (₦)</label>
              <input className="form-input" type="number" placeholder="Min. ₦500"
                value={amount} onChange={e => setAmount(e.target.value)} min={500} />
            </div>
            <div className="quick-amount-row">
              {[1000,5000,10000].map(v => (
                <button key={v} type="button" className="btn btn-ghost btn-sm" onClick={() => setAmount(String(v))}>
                  ₦{v.toLocaleString()}
                </button>
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Pay with Paystack'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="card-title">Transaction History</div>
          <DataList columns={txColumns} data={txns} loading={balance === null} emptyMessage="No transactions yet." />
        </div>
      </div>
    </DashboardLayout>
  );
}
