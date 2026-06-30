import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

export default function Withdraw() {
  const { success, error } = useToast();
  const [banks,       setBanks]       = useState([]);
  const [stats,       setStats]       = useState(null);
  const [resolving,   setResolving]   = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [accountName, setAccountName] = useState('');
  const [amount,      setAmount]      = useState('');
  const [bank, setBank] = useState({ bank_code:'', account_number:'' });

  useEffect(() => {
    Promise.all([
      api.get('/publisher/banks'),
      api.get('/publisher/stats'),
    ]).then(([b, s]) => {
      setBanks(b.data.data);
      setStats(s.data.data);
    }).catch(() => error('Failed to load data'));
  }, []);

  async function resolveAccount() {
    if (!bank.bank_code || bank.account_number.length < 10) return;
    setResolving(true);
    setAccountName('');
    try {
      const res = await api.post('/publisher/resolve-account', bank);
      setAccountName(res.data.data.account_name);
    } catch {
      error('Could not resolve account. Check your account number and bank.');
    } finally {
      setResolving(false);
    }
  }

  async function saveBank() {
    if (!accountName) return error('Resolve your account number first');
    const bankObj = banks.find(b => b.code === bank.bank_code);
    try {
      await api.put('/publisher/bank', {
        bank_name:      bankObj?.name || '',
        account_number: bank.account_number,
        account_name:   accountName,
        bank_code:      bank.bank_code,
      });
      success('Bank details saved');
    } catch { error('Failed to save bank details'); }
  }

  async function withdraw(e) {
    e.preventDefault();
    if (!amount || parseFloat(amount) < 1000) return error('Minimum withdrawal is ₦1,000');
    setSubmitting(true);
    try {
      await api.post('/publisher/withdraw', { amount: parseFloat(amount) });
      success('Withdrawal initiated. You will receive your funds shortly.');
      setAmount('');
    } catch (err) {
      error(err.response?.data?.message || 'Withdrawal failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Withdraw</h1>
        <p className="page-subtitle">Withdraw your earnings to your Nigerian bank account</p>
      </div>

      <div className="card-grid-2">
        {/* Bank Details */}
        <div className="card">
          <div className="card-title">Bank Details</div>
          <div className="form-group">
            <label className="form-label">Bank</label>
            <select className="form-select" value={bank.bank_code}
              onChange={e => setBank(p => ({ ...p, bank_code: e.target.value }))}>
              <option value="">Select bank</option>
              {banks.map(b => <option key={b.code} value={b.code}>{b.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Account Number</label>
            <input className="form-input" placeholder="0123456789" maxLength={10}
              value={bank.account_number}
              onChange={e => {
                setBank(p => ({ ...p, account_number: e.target.value }));
                setAccountName('');
              }}
              onBlur={resolveAccount} />
          </div>
          {resolving && <p style={{ fontSize:13, color:'var(--text-muted)', marginBottom:16 }}>Resolving account...</p>}
          {accountName && (
            <div className="info-box info-box--success">
              {accountName}
            </div>
          )}
          <button className="btn btn-primary" onClick={saveBank} disabled={!accountName}>
            Save Bank Details
          </button>
        </div>

        {/* Withdraw */}
        <div className="card">
          <div className="card-title">Request Withdrawal</div>
          <div className="balance-box">
            <div className="balance-box-label">Available Balance</div>
            <div className="balance-box-value">
              ₦{Number(stats?.wallet_balance || 0).toLocaleString()}
            </div>
          </div>
          <form onSubmit={withdraw}>
            <div className="form-group">
              <label className="form-label">Amount (₦)</label>
              <input className="form-input" type="number" placeholder="Min. ₦1,000"
                value={amount} onChange={e => setAmount(e.target.value)} min={1000} />
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Withdraw to Bank'}
            </button>
          </form>
          <p style={{ fontSize:12, color:'var(--text-muted)', marginTop:12 }}>
            Minimum withdrawal: ₦1,000 · Processed via Paystack
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
