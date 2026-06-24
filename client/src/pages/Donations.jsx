import React, { useEffect, useState } from 'react';
import api from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Gift, Plus, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Donations() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [needs, setNeeds] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ needId: '', donorName: user?.fullName || '', amount: '', description: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    Promise.all([api.get('/api/donations'), api.get('/api/needs'), api.get('/api/animals')])
      .then(([d, n, a]) => { setDonations(d.data); setNeeds(n.data); setAnimals(a.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const getAnimalName = (aid) => animals.find(a => a.id === aid)?.name || '?';
  const activeNeeds = needs.filter(n => n.status !== 'Fulfilled');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/donations', { ...form, needId: parseInt(form.needId), userId: user?.id || null });
      setDonations([res.data, ...donations]);
      setShowForm(false); setForm({ needId: '', donorName: user?.fullName || '', amount: '', description: '' });
      setMsg({ text: 'Your donation commitment has been saved!', type: 'success' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    } catch (err) { setMsg({ text: err.response?.data?.message || 'An error occurred.', type: 'error' }); }
  };

  const handleCancelDonation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this donation commitment?')) return;
    try {
      await api.delete(`/api/donations/${id}`);
      setDonations(donations.filter(d => d.id !== id));
      setMsg({ text: 'Donation commitment cancelled.', type: 'success' });
      setTimeout(() => setMsg({ text: '', type: '' }), 3000);
    } catch (err) { setMsg({ text: 'An error occurred during cancellation.', type: 'error' }); }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-slate-900">Donation Tracking</h1><p className="text-slate-600 mt-1">Track donation commitments made to fulfill active animal needs.</p></div>
        <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-medium rounded-xl transition-colors flex items-center gap-2">
          {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{showForm ? 'Close' : 'Donate'}
        </button>
      </div>
      {msg.text && <div className={`p-4 rounded-xl flex items-center gap-2 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}{msg.text}</div>}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-4">New Donation Commitment</h2>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <select className="p-3 border border-slate-200 rounded-xl" required value={form.needId} onChange={e => setForm({...form, needId: e.target.value})}>
              <option value="">Select Need</option>
              {activeNeeds.map(n => <option key={n.id} value={n.id}>{n.needType} — {getAnimalName(n.animalId)} ({n.amount})</option>)}
            </select>
            <input type="text" placeholder="Donor Name" className="p-3 border border-slate-200 rounded-xl" required value={form.donorName} onChange={e => setForm({...form, donorName: e.target.value})} />
            <input type="text" placeholder="Amount (e.g. 2 kg dry food)" className="p-3 border border-slate-200 rounded-xl" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            <input type="text" placeholder="Description" className="p-3 border border-slate-200 rounded-xl" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <button type="submit" className="md:col-span-2 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl">Create Donation Commitment</button>
          </form>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {donations.map(d => {
          const isDelivered = d.status === 'Delivered';
          const isCommitted = d.status === 'Committed';
          const isUserAuthorized = user && (d.userId === user.id || user.role === 'Admin');
          
          return (
            <div key={d.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
              <div className="flex justify-between items-start">
                <div><h3 className="font-bold text-slate-900">{d.donorName}</h3><p className="text-sm text-slate-500">{d.needType || 'Need'}</p></div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isDelivered ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.status}</span>
              </div>
              {d.amount && <p className="text-sm text-slate-600">Amount: <span className="font-medium">{d.amount}</span></p>}
              {d.description && <p className="text-sm text-slate-500">{d.description}</p>}
              <div className="flex justify-between items-end pt-2">
                <p className="text-xs text-slate-400">{new Date(d.createdAt).toLocaleDateString('en-US')}</p>
                {isUserAuthorized && isCommitted && (
                  <button onClick={() => handleCancelDonation(d.id)} className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
                )}
              </div>
            </div>
          );
        })}
        {donations.length === 0 && <p className="text-slate-500 text-sm col-span-full bg-white p-6 rounded-xl border border-slate-100">No donation records found yet.</p>}
      </div>
    </div>
  );
}
