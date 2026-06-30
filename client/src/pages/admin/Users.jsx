import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import DataList from '../../components/DataList';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

const PERMANENT_ADMIN = 'confidencerich97@gmail.com';

export default function AdminUsers() {
  const { success, error } = useToast();
  const [users,     setUsers]     = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [role,      setRole]      = useState('');
  const [banReason, setBanReason] = useState({});
  const [confirm,   setConfirm]   = useState(null); // id of user pending delete confirm

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

  async function deleteUser(id) {
    try {
      await api.delete(`/admin/users/${id}`);
      success('User deleted');
      setConfirm(null);
      load();
    } catch (e) {
      error(e.response?.data?.message || 'Failed to delete user');
      setConfirm(null);
    }
  }

  const columns = [
    { key: 'full_name',  label: 'Name' },
    { key: 'email',      label: 'Email', render: v => (
      <span>{v}
        {v === PERMANENT_ADMIN && (
          <span className="badge badge-active" style={{ marginLeft: 6, fontSize: 10 }}>Permanent</span>
        )}
      </span>
    )},
    { key: 'role', label: 'Role', render: v => (
      <span className={`badge ${v === 'admin' ? 'badge-active' : v === 'publisher' ? 'badge-paused' : 'badge-pending'}`}>{v}</span>
    )},
    { key: 'is_banned', label: 'Status', render: v => (
      <span className={`badge ${v ? 'badge-rejected' : 'badge-active'}`}>{v ? 'Banned' : 'Active'}</span>
    )},
    { key: 'last_login', label: 'Last Login', render: v => v ? new Date(v).toLocaleDateString() : 'Never' },
    { key: 'id', label: 'Actions', actions: true, render: (_, row) => {
      if (row.email === PERMANENT_ADMIN) {
        return <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>Protected account</span>;
      }
      if (row.role === 'admin') return null;

      return (
        <div className="user-action">
          {row.is_banned ? (
            <button className="btn btn-ghost btn-sm" onClick={() => unban(row.id)}>Unban</button>
          ) : (
            <div className="user-action-ban">
              <input className="form-input" placeholder="Ban reason"
                value={banReason[row.id] || ''}
                onChange={e => setBanReason(p => ({ ...p, [row.id]: e.target.value }))} />
              <button className="btn btn-danger btn-sm" onClick={() => ban(row.id)}>Ban</button>
            </div>
          )}
          {confirm === row.id ? (
            <div className="user-action-confirm">
              <span>Delete this user?</span>
              <div className="user-action-confirm-btns">
                <button className="btn btn-danger btn-sm" onClick={() => deleteUser(row.id)}>Yes, delete</button>
                <button className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Cancel</button>
              </div>
            </div>
          ) : (
            <button className="btn btn-ghost btn-sm btn-delete-text" onClick={() => setConfirm(row.id)}>Delete user</button>
          )}
        </div>
      );
    }},
  ];

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">{users.length} user{users.length !== 1 ? 's' : ''} total</p>
      </div>

      <div className="user-filter-row">
        <input className="form-input"
          placeholder="Search name or email..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className="form-select"
          value={role} onChange={e => setRole(e.target.value)}>
          <option value="">All roles</option>
          <option value="publisher">Publisher</option>
          <option value="advertiser">Advertiser</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <DataList columns={columns} data={users} loading={loading} emptyMessage="No users found." />
    </DashboardLayout>
  );
}
