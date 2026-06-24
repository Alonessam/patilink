import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { Package, CheckCircle2, Plus, X, AlertCircle, QrCode } from 'lucide-react';

export default function Needs() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [needs, setNeeds] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ animalId: '', needType: '', description: '', amount: '', urgency: 'Routine' });
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => { Promise.all([api.get('/api/needs'), api.get('/api/animals')]).then(([n, a]) => { setNeeds(n.data); setAnimals(a.data); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const getAnimalName = (id) => animals.find(a => a.id === id)?.name || '?';
  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { const r = await api.post('/api/needs', { ...form, animalId: parseInt(form.animalId) }); setNeeds([r.data, ...needs]); setShowForm(false); setForm({ animalId: '', needType: '', description: '', amount: '', urgency: 'Routine' }); showMsg('Need record created!'); } catch (err) { showMsg(err.response?.data?.message || 'Error', 'error'); }
  };
  const handleStatusUpdate = async (id, s) => {
    try { const r = await api.patch(`/api/needs/${id}/status`, { status: s }); setNeeds(needs.map(n => n.id === id ? r.data : n)); showMsg('Status updated!'); } catch (err) { showMsg('An error occurred', 'error'); }
  };

  const urgencyColor = (u) => u === 'Critical' ? 'bg-red-100 text-red-700 border-red-200' : u === 'High' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-slate-100 text-slate-600 border-slate-200';
  const statusColor = (s) => s === 'Fulfilled' ? 'bg-green-100 text-green-700' : s === 'Procuring' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700';

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  const active = needs.filter(n => n.status !== 'Fulfilled'), fulfilled = needs.filter(n => n.status === 'Fulfilled');

  const canCreateNeed = user?.role === 'Admin' || user?.role === 'Vet';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold text-slate-900">Needs Management</h1><p className="text-slate-600 mt-1">Track needs like food, shelter, medicine, etc.</p></div>
        {canCreateNeed && (
          <button onClick={() => setShowForm(!showForm)} className="px-5 py-2.5 bg-accent hover:bg-accent-dark text-white font-medium rounded-xl flex items-center gap-2">{showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{showForm ? 'Close' : 'New Need'}</button>
        )}
      </div>
      {msg.text && <div className={`p-4 rounded-xl flex items-center gap-2 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}{msg.text}</div>}
      {showForm && canCreateNeed && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <select className="p-3 border border-slate-200 rounded-xl" required value={form.animalId} onChange={e => setForm({...form, animalId: e.target.value})}><option value="">Select Animal</option>{animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species})</option>)}</select>
            <select className="p-3 border border-slate-200 rounded-xl" required value={form.needType} onChange={e => setForm({...form, needType: e.target.value})}><option value="">Need Type</option><option value="Food">Food</option><option value="Water">Water</option><option value="Shelter">Shelter</option><option value="Medicine">Medicine</option><option value="Blanket">Blanket</option><option value="Other">Other</option></select>
            <input type="text" placeholder="Amount (e.g. 5 kg)" className="p-3 border border-slate-200 rounded-xl" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            <select className="p-3 border border-slate-200 rounded-xl" value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})}><option value="Routine">Routine</option><option value="High">High</option><option value="Critical">Critical</option></select>
            <textarea placeholder="Description" className="p-3 border border-slate-200 rounded-xl md:col-span-2" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
            <button type="submit" className="md:col-span-2 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl">Create Need</button>
          </form>
        </div>
      )}
      <div><h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-accent" />Pending ({active.length})</h2>
        {active.length === 0 ? <p className="text-slate-500 text-sm bg-white p-6 rounded-xl border border-slate-100">No pending needs.</p> : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{active.map(n => {
            const isPending = n.status === 'Pending';
            const isNotFulfilled = n.status !== 'Fulfilled';
            return (
              <div key={n.id} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 space-y-3">
                <div className="flex justify-between items-start"><div><h3 className="font-bold text-slate-900">{n.needType}</h3><p className="text-sm text-slate-500">{getAnimalName(n.animalId)}</p></div><span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${urgencyColor(n.urgency)}`}>{n.urgency}</span></div>
                {n.description && <p className="text-sm text-slate-600">{n.description}</p>}
                {n.amount && <p className="text-sm text-slate-500">Amount: <span className="font-medium">{n.amount}</span></p>}
                <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColor(n.status)}`}>{n.status}</span>
                    <div className="flex gap-2">
                      {isPending && <button onClick={() => handleStatusUpdate(n.id, 'Procuring')} className="text-xs px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 font-medium">Procure</button>}
                      {isNotFulfilled && <button onClick={() => handleStatusUpdate(n.id, 'Fulfilled')} className="text-xs px-3 py-1.5 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 font-medium">Fulfilled ✓</button>}
                    </div>
                  </div>
                  {isNotFulfilled && (
                    <button 
                      onClick={() => {
                        const animal = animals.find(a => a.id === n.animalId);
                        navigate('/volunteer', { 
                          state: { 
                            autoScan: true, 
                            targetNeedId: n.id,
                            targetAnimalName: animal?.name || 'Animal',
                            targetLocationName: animal?.locationName || 'Feeding Point'
                          } 
                        });
                      }}
                      className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors mt-1 cursor-pointer"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Verify on Location with QR
                    </button>
                  )}
                </div>
              </div>
            );
          })}</div>
        )}
      </div>
      {fulfilled.length > 0 && (
        <div><h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" />Fulfilled ({fulfilled.length})</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{fulfilled.map(n => (
            <div key={n.id} className="bg-green-50/50 rounded-2xl p-5 border border-green-100 space-y-2">
              <div className="flex justify-between items-center"><h3 className="font-bold text-slate-900">{n.needType}</h3><span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">Fulfilled ✓</span></div>
              <p className="text-sm text-slate-500">{getAnimalName(n.animalId)} • {n.amount}</p>
            </div>
          ))}</div>
        </div>
      )}
    </div>
  );
}
