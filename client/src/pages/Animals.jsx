import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/apiClient';
import { MapPin, AlertCircle, Heart, Search, Filter } from 'lucide-react';

export default function Animals() {
  const [animals, setAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [faculty, setFaculty] = useState('All');
  const [urgency, setUrgency] = useState('All');
  const [status, setStatus] = useState('All');
  const [faculties, setFaculties] = useState([]);

  const fetchAnimals = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (faculty !== 'All') params.set('faculty', faculty);
    if (urgency !== 'All') params.set('urgency', urgency);
    if (status !== 'All') params.set('status', status);
    api.get(`/api/animals?${params}`).then(r => { setAnimals(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchAnimals(); }, [faculty, urgency, status]);
  useEffect(() => { api.get('/api/locations').then(r => { const f = [...new Set(r.data.map(l => l.faculty))]; setFaculties(f); }); }, []);
  useEffect(() => { const t = setTimeout(fetchAnimals, 300); return () => clearTimeout(t); }, [search]);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <div className="flex justify-between items-center mb-6"><div><h1 className="text-3xl font-bold text-slate-900">Campus Animals</h1><p className="text-slate-600 mt-1">Stray animals waiting for care or under medical treatment.</p></div></div>
      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="relative col-span-2 md:col-span-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><input type="text" placeholder="Search..." className="w-full pl-9 p-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-accent outline-none" value={search} onChange={e => setSearch(e.target.value)} /></div>
          <select className="p-2.5 border border-slate-200 rounded-lg text-sm" value={faculty} onChange={e => setFaculty(e.target.value)}><option value="All">All Faculties</option>{faculties.map(f => <option key={f} value={f}>{f}</option>)}</select>
          <select className="p-2.5 border border-slate-200 rounded-lg text-sm" value={urgency} onChange={e => setUrgency(e.target.value)}><option value="All">All Urgencies</option><option value="Critical">Critical</option><option value="High">High</option><option value="Routine">Routine</option></select>
          <select className="p-2.5 border border-slate-200 rounded-lg text-sm" value={status} onChange={e => setStatus(e.target.value)}><option value="All">All Statuses</option><option value="Hungry">Hungry</option><option value="Fed">Fed</option><option value="In Treatment">In Treatment</option><option value="Routine">Routine</option></select>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {animals.map(a => {
          const isCritical = a.urgency === 'Critical';
          const isHungry = a.careStatus === 'Hungry';
          const isInTreatment = a.careStatus === 'In Treatment';
          
          return (
            <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-md transition-shadow group">
              <div className="aspect-[4/3] w-full overflow-hidden relative">
                <img src={a.photoUrl} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                {isCritical && <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm flex items-center gap-1"><AlertCircle className="w-3 h-3" />Critical</div>}
              </div>
              <div className="p-5">
                <div className="flex justify-between items-start mb-2"><h3 className="text-lg font-bold text-slate-900">{a.name}</h3><span className="text-xs font-medium bg-slate-100 text-slate-600 px-2 py-1 rounded-md">{a.species}</span></div>
                <p className="text-sm text-slate-500 line-clamp-2 mb-3">{a.description}</p>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-3"><MapPin className="w-4 h-4 text-accent" />{a.locationName}</div>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${isHungry ? 'bg-red-100 text-red-700' : isInTreatment ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>{a.careStatus}</span>
                </div>
                <Link to={`/animals/${a.id}`} className="w-full py-2.5 bg-slate-50 hover:bg-accent-soft text-accent-dark font-medium rounded-lg transition-colors flex items-center justify-center gap-2"><Heart className="w-4 h-4" />View Details</Link>
              </div>
            </div>
          );
        })}
      </div>
      {animals.length === 0 && <p className="text-center text-slate-500 mt-8">No animals found matching the search criteria.</p>}
    </div>
  );
}
