import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import Table from '../../components/Table';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

export default function AdminUsers() {
  const { success, error } = useToast();
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [role,    setRole]    = useState('');
  const [banReason, setBanReason] = useState({});

  function load() {
    setLoading(true);
    api.get('/admin/users', { params: { search, role } })
      .then(r => setUsers(r.data.data))
      .catch(() => error('Failed to load users'))
      .finally(() => setLoading(false));
  }
  useEffect(() => { load(); }, [search, role]);

  async function ban(id) {
    const reason = banReason[id];
    if (!reason?.trim()) return error('Enter a ban reason first');
    try {
      await api.post(`/admin/users/${id}/ban`, { reason });
      success('User banned');
      setBanReason(p => ({ ...p, [id]: '' }));
      load();
    } catch { error('Failed to ban user'); }
  }

  async function unban(id) {
    try {
      await api.post(`/admin/users/${id}/unban`);
      success('User unbanned');
      load();
    } catch { error('Failed to unban user'); }
  }

  const columns = [
    { key:'full_name',  label:'Name' },
    { key:'email',      label:'Email' },
    { key:'role',       label:'Role',   render: v => <span className={`badge ${v==='admin'?'badge-active':v==='publisher'?'badge-paused':'badge-pending'}`}>{v}</span> },
    { key:'is_banned',  label:'Status', render: v => <span className={`badge ${v?'badge-rejected':'badge-active'}`}>{v?'Banned':'Active'}</span> },
    { key:'last_login', label:'Last Login', render: v => v ? new Date(v).toLocaleDateString() : 'Never' },
    { key:'id', label:'Action', width:280, render:(_,row) => row.role === 'admin' ? null : (
      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
        {row.is_banned
          ? <button className="btn btn-ghost btn-sm" onClick={() => unban(row.id)}>Unban</button>
          : <>
              <input className="form-input" style={{ width:140, padding:'5px 10px', fontSize:12 }}
                placeholder="Ban reason" value={banReason[row.id] || ''}
                onChange={e => setBanReason(p => ({ ...p, [row.id]: e.target.value }))} />
              <button className="btn btn-danger btn-sm" onClick={() => ban(row.id)}>Ban</button>
            </>}
      </div>
    )},
  ];

  return (
    <DashboardLayout>
      <div className="page-header"><h1 className="page-title">Users</h1></div>
      <div style={{ display:'flex', gap:12, marginBottom:20 }}>
        <input className="form-input" style={{ maxWidth:280 }} placeholder="Search name or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select" style={{ maxWidth:160 }} value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="publisher">Publisher</option>
          <option value="advertiser">Advertiser</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      <Table columns={columns} data={users} loading={loading} emptyMessage="No users found." />
    </DashboardLayout>
  );
}
