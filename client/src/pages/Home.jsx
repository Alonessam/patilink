import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/apiClient';
import { AlertTriangle, CheckCircle2, Clock, PawPrint, QrCode, Users } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [criticalAnimals, setCriticalAnimals] = useState([]);

  useEffect(() => {
    api.get('/api/summary').then(r => setSummary(r.data)).catch(() => {});
    api.get('/api/animals?urgency=Critical').then(r => setCriticalAnimals(r.data)).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {criticalAnimals.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4"><div className="bg-red-500 p-2 rounded-full"><AlertTriangle className="w-5 h-5 text-white" /></div><h2 className="text-xl font-bold text-red-800">⚠️ Urgent Care ({criticalAnimals.length})</h2></div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {criticalAnimals.map(a => (
              <Link key={a.id} to={`/animals/${a.id}`} className="bg-white p-4 rounded-xl border border-red-100 hover:shadow-md transition-all flex items-center gap-4">
                <img src={a.photoUrl} alt={a.name} className="w-14 h-14 rounded-full object-cover border-2 border-red-300" />
                <div><p className="font-bold text-slate-900">{a.name}</p><p className="text-sm text-red-600 font-medium">{a.careStatus} — {a.urgency}</p><p className="text-xs text-slate-500">{a.locationName}</p></div>
              </Link>
            ))}
          </div>
        </div>
      )}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 md:p-12 text-center md:text-left flex flex-col md:flex-row items-center gap-8">
        <div className="flex-1 space-y-6">
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Our Campus Friends are Entrusted to Us!</h1>
          <p className="text-lg text-slate-600">With PatiLink, we track the nutrition, shelter, and health needs of stray animals in real-time, providing coordinated support through our volunteer network.</p>
          <div className="flex flex-wrap gap-3">
            <button onClick={() => navigate('/animals')} className="px-6 py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"><PawPrint className="w-5 h-5" />View Animals</button>
            <button onClick={() => navigate('/volunteer')} className="px-6 py-3 bg-slate-900 hover:bg-slate-700 text-white font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2"><QrCode className="w-5 h-5" />Volunteer Panel</button>
          </div>
        </div>
        <div className="flex-1 w-full flex justify-center">
          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            <div className="bg-warn p-6 rounded-2xl flex flex-col items-center text-center"><span className="text-4xl font-bold text-orange-600 mb-2">{summary?.criticalAnimalCount ?? '...'}</span><span className="text-orange-800 font-medium text-sm">Critical Status</span></div>
            <div className="bg-accent-soft p-6 rounded-2xl flex flex-col items-center text-center"><span className="text-4xl font-bold text-accent-dark mb-2">{summary?.animalCount ?? '...'}</span><span className="text-accent-dark font-medium text-sm">Registered Animals</span></div>
            <div className="bg-blue-50 p-6 rounded-2xl flex flex-col items-center text-center"><span className="text-4xl font-bold text-blue-600 mb-2">{summary?.openTaskCount ?? '...'}</span><span className="text-blue-800 font-medium text-sm">Open Tasks</span></div>
            <div className="bg-purple-50 p-6 rounded-2xl flex flex-col items-center text-center"><span className="text-4xl font-bold text-purple-600 mb-2">{summary?.waitingNeedCount ?? '...'}</span><span className="text-purple-800 font-medium text-sm">Pending Needs</span></div>
          </div>
        </div>
      </div>
      {summary?.recentLogs?.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Care Activities</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {summary.recentLogs.map((l, i) => (
              <div key={i} className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex items-start gap-4">
                {l.qrVerified ? <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" /> : <Clock className="h-6 w-6 text-slate-400 shrink-0" />}
                <div><p className="font-medium text-slate-900">{l.task} ({l.volunteer})</p><p className="text-sm text-slate-500 mt-1">{l.note}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
