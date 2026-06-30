import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataList from '../../components/DataList';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

export default function AdminPayouts() {
  const { success, error } = useToast();
  const [payouts,  setPayouts]  = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [status,   setStatus]   = useState('pending');

  function load() {
    setLoading(true);
    api.get('/admin/withdrawals', { params: { status } })
      .then(r => setPayouts(r.data.data))
      .catch(() => error('Failed to load payouts'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [status]);

  async function markProcessed(id) {
    try {
      await api.patch(`/admin/withdrawals/${id}/process`);
      success('Marked as processed');
      load();
    } catch { error('Failed to update withdrawal'); }
  }

  const columns = [
    { key:'full_name',      label:'Publisher' },
    { key:'amount',         label:'Amount',  render: v => `₦${Number(v).toLocaleString()}` },
    { key:'bank_name',      label:'Bank' },
    { key:'account_number', label:'Account' },
    { key:'account_name',   label:'Account Name' },
    { key:'status',         label:'Status', render: v => <span className={`badge badge-${v==='success'?'active':v==='failed'?'rejected':'pending'}`}>{v}</span> },
    { key:'created_at',     label:'Date',   render: v => new Date(v).toLocaleDateString() },
    { key:'id', label:'Action', actions: true, render:(_,row) => row.status === 'pending'
        ? <button className="btn btn-primary btn-sm" onClick={() => markProcessed(row.id)}>Mark Done</button>
        : null },
  ];

  return (
    <DashboardLayout>
      <div className="page-header"><h1 className="page-title">Payouts</h1></div>
      <div className="filter-pill-row">
        {['pending','processing','success','failed'].map(s => (
          <button key={s} className={`filter-pill ${status===s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>
      <DataList columns={columns} data={payouts} loading={loading} emptyMessage="No payouts found." />
    </DashboardLayout>
  );
}
