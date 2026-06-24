import React, { useState, useEffect } from 'react';
import api from '../api/apiClient';
import { Send, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Contact() {
  const [form, setForm] = useState({ reporterName: '', email: '', subject: '', message: '', locationId: '' });
  const [locations, setLocations] = useState([]);
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get('/api/locations').then(r => setLocations(r.data)).catch(() => {}); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault(); setMsg({ text: '', type: '' }); setLoading(true);
    try {
      await api.post('/api/reports', { ...form, locationId: form.locationId ? parseInt(form.locationId) : null });
      setMsg({ text: 'Your report has been successfully sent! It will be reviewed as soon as possible.', type: 'success' });
      setForm({ reporterName: '', email: '', subject: '', message: '', locationId: '' });
    } catch (err) { setMsg({ text: err.response?.data?.message || 'Submission failed.', type: 'error' }); }
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Contact and Campus Notification</h1>
        <p className="text-slate-600 mt-1">Send a report for a new animal, an emergency or a suggestion you noticed on campus.</p>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-xl flex items-center gap-2 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-green-50 text-green-700 border border-green-100'}`}>
          {msg.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}{msg.text}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Full Name *</label>
            <input type="text" placeholder="Your Full Name" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" required value={form.reporterName} onChange={e => setForm({...form, reporterName: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email *</label>
            <input type="email" placeholder="example@email.com" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Subject</label>
            <input type="text" placeholder="Report subject" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Location (optional)</label>
            <select className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" value={form.locationId} onChange={e => setForm({...form, locationId: e.target.value})}>
              <option value="">Select location</option>
              {locations.map(l => <option key={l.id} value={l.id}>{l.name} ({l.faculty})</option>)}
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-sm font-medium text-slate-700">Message *</label>
            <textarea placeholder="Write a detailed explanation..." rows="5" className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" required value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
          </div>
          <button type="submit" disabled={loading} className="md:col-span-2 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
            <Send className="w-5 h-5" />{loading ? 'Sending...' : 'Send Report'}
          </button>
        </form>
      </div>
    </div>
  );
}
