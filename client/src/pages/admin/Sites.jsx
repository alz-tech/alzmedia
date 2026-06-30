import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataList from '../../components/DataList';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

export default function AdminSites() {
  const { success, error } = useToast();
  const [sites,   setSites]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [reasons, setReasons] = useState({});

  function load() {
    setLoading(true);
    api.get('/admin/sites/pending')
      .then(r => setSites(r.data.data))
      .catch(() => error('Failed to load pending sites'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, []);

  async function review(id, status) {
    const reason = reasons[id];
    if (status === 'rejected' && !reason?.trim()) return error('Enter rejection reason');
    try {
      await api.patch(`/admin/sites/${id}/review`, { status, rejection_reason: reason });
      success(`Site ${status}`);
      load();
    } catch { error('Failed to update site'); }
  }

  const columns = [
    { key:'name',          label:'Site Name' },
    { key:'full_name',     label:'Publisher' },
    { key:'platform_type', label:'Platform' },
    { key:'url',           label:'URL', render: v => v ? <a href={v} target="_blank" rel="noreferrer" style={{color:'var(--purple-lt)'}}>{v}</a> : '—' },
    { key:'id', label:'Review', actions: true, render:(_,row) => (
      <div className="review-action">
        <input className="form-input" placeholder="Rejection reason (if rejecting)"
          value={reasons[row.id] || ''}
          onChange={e => setReasons(p => ({ ...p, [row.id]: e.target.value }))} />
        <div className="review-action-btns">
          <button className="btn btn-primary btn-sm" onClick={() => review(row.id,'approved')}>Approve</button>
          <button className="btn btn-danger btn-sm"  onClick={() => review(row.id,'rejected')}>Reject</button>
        </div>
      </div>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="page-header"><h1 className="page-title">Pending Sites</h1></div>
      <DataList columns={columns} data={sites} loading={loading} emptyMessage="No pending sites." />
    </DashboardLayout>
  );
}
