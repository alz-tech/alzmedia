import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import { useToast } from '../../hooks/useToast';
import api from '../../services/api';

export default function CreateCampaign() {
  const navigate           = useNavigate();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name:'', budget:'', daily_limit:'', bid_type:'cpm',
    bid_amount:'', target_device:'all', start_date:'', end_date:'',
  });

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.budget || !form.bid_amount) return error('Name, budget and bid amount are required');
    if (parseFloat(form.budget) < 500) return error('Minimum budget is ₦500');
    setLoading(true);
    try {
      const res = await api.post('/advertiser/campaigns', {
        ...form,
        budget:      parseFloat(form.budget),
        bid_amount:  parseFloat(form.bid_amount),
        daily_limit: form.daily_limit ? parseFloat(form.daily_limit) : undefined,
      });
      success('Campaign created and submitted for review');
      navigate(`/advertiser/campaigns/${res.data.data.id}/creatives`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="page-header">
        <h1 className="page-title">New Campaign</h1>
        <p className="page-subtitle">Set up your ad campaign details</p>
      </div>

      <div className="card" style={{ maxWidth:680 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Campaign Name *</label>
            <input className="form-input" placeholder="My Naija Campaign" value={form.name} onChange={set('name')} required />
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Total Budget (₦) *</label>
              <input className="form-input" type="number" placeholder="5000" min={500}
                value={form.budget} onChange={set('budget')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Daily Limit (₦)</label>
              <input className="form-input" type="number" placeholder="Optional"
                value={form.daily_limit} onChange={set('daily_limit')} />
            </div>
            <div className="form-group">
              <label className="form-label">Bid Type *</label>
              <select className="form-select" value={form.bid_type} onChange={set('bid_type')}>
                <option value="cpm">CPM — Pay per 1,000 impressions</option>
                <option value="cpc">CPC — Pay per click</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bid Amount (₦) *</label>
              <input className="form-input" type="number" placeholder={form.bid_type === 'cpm' ? 'per 1000 views' : 'per click'}
                value={form.bid_amount} onChange={set('bid_amount')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Target Device</label>
              <select className="form-select" value={form.target_device} onChange={set('target_device')}>
                <option value="all">All devices</option>
                <option value="web">Web only</option>
                <option value="mobile">Mobile only</option>
                <option value="app">App only</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input className="form-input" type="date" value={form.start_date} onChange={set('start_date')} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input className="form-input" type="date" value={form.end_date} onChange={set('end_date')} />
            </div>
          </div>

          <div className="form-btn-row">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : 'Create Campaign'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Cancel</button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
