import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { 
  Stethoscope, Plus, X, Calendar, AlertTriangle, QrCode, 
  Heart, Clipboard, Activity, Syringe, Shield, Award, 
  MapPin, CheckCircle, Clock, ChevronRight, UserRound
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function HealthLogs() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [healthLogs, setHealthLogs] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ animalId: '', actionType: '', description: '', nextCheckDate: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/health-logs'), 
      api.get('/api/animals'), 
      api.get('/api/users/vets'),
      api.get('/api/locations')
    ])
      .then(([h, a, u, l]) => { 
        setHealthLogs(h.data); 
        setAnimals(a.data); 
        setUsers(u.data); 
        setLocations(l.data);
        setLoading(false); 
      })
      .catch(() => { 
        api.get('/api/health-logs').then(r => setHealthLogs(r.data)).catch(() => {}); 
        api.get('/api/animals').then(r => setAnimals(r.data)).catch(() => {}); 
        api.get('/api/locations').then(r => setLocations(r.data)).catch(() => {});
        api.get('/api/users/vets').then(r => setUsers(r.data)).catch(() => {});
        setLoading(false); 
      });
  }, []);

  useEffect(() => {
    if (loading || locations.length === 0 || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const map = L.map(mapRef.current, {
      center: [38.3328, 38.4381],
      zoom: 15,
      zoomControl: true,
    });

    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    locations.forEach(loc => {
      if (!loc.latitude || !loc.longitude) return;

      const locAnimals = animals.filter(a => a.locationId === loc.id);
      const hasMedicalNeed = locAnimals.some(a => a.careStatus === 'In Treatment' || a.urgency === 'Critical');
      
      const colorClass = hasMedicalNeed ? 'bg-red-500 border-red-200' : 'bg-emerald-500 border-emerald-200';
      const pulseColorClass = hasMedicalNeed ? 'bg-red-400' : 'bg-emerald-400';

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div class="relative flex items-center justify-center" style="width: 40px; height: 40px;">
            <span class="absolute inline-flex h-full w-full rounded-full ${pulseColorClass} opacity-60 animate-ping" style="animation-duration: 2s;"></span>
            <div class="relative flex items-center justify-center rounded-full ${colorClass} border-4 text-white shadow-md hover:scale-110 transition-transform duration-200" style="width: 32px; height: 32px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -10]
      });

      const animalsHtml = locAnimals.length > 0 
        ? locAnimals.map(a => `
            <a href="/animals/${a.id}" style="display: flex; align-items: center; gap: 8px; padding: 6px; border-radius: 8px; text-decoration: none; color: #1e293b; border: 1px solid transparent; transition: all 0.2s;" onmouseover="this.style.backgroundColor='#f8fafc'; this.style.borderColor='#f1f5f9';" onmouseout="this.style.backgroundColor='transparent'; this.style.borderColor='transparent';">
              <img src="${a.photoUrl}" alt="${a.name}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover; border: 1px solid #e2e8f0;" />
              <div style="flex: 1; min-width: 0;">
                <p style="margin: 0; font-size: 12px; font-weight: 700; color: #0f172a; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${a.name}</p>
                <p style="margin: 0; font-size: 10px; color: ${a.careStatus === 'In Treatment' ? '#ef4444' : '#64748b'}; font-weight: ${a.careStatus === 'In Treatment' ? '600' : 'normal'};">${a.species} • ${a.careStatus}</p>
              </div>
            </a>
          `).join('')
        : `<p style="margin: 0; font-size: 12px; color: #94a3b8; font-style: italic;">No registered residents found.</p>`;

      const popupContent = `
        <div style="width: 220px; font-family: system-ui, sans-serif; padding: 4px;">
          <div style="border-bottom: 1px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 8px;">
            <h4 style="margin: 0; font-size: 14px; font-weight: 700; color: #0f172a;">${loc.name}</h4>
            <span style="font-size: 10px; font-weight: 600; color: #64748b; margin-top: 2px; display: inline-block;">${loc.faculty}</span>
          </div>
          <div style="margin-bottom: 8px;">
            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">🩺 Health Status</p>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; display: inline-block; background-color: ${hasMedicalNeed ? '#ef4444' : '#10b981'};"></span>
              <span style="font-size: 12px; font-weight: 500; color: #334155;">${hasMedicalNeed ? 'Medical Supervision' : 'Stable / Routine'}</span>
            </div>
          </div>
          <div>
            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">🐾 Location Residents</p>
            <div style="display: flex; flex-direction: column; gap: 4px; max-height: 140px; overflow-y: auto;">
              ${animalsHtml}
            </div>
          </div>
        </div>
      `;

      L.marker([loc.latitude, loc.longitude], { icon: customIcon })
        .addTo(map)
        .bindPopup(popupContent);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [loading, locations, animals]);

  const getVetName = (id) => users.find(u => u.id === id)?.fullName || '?';
  const criticalAnimals = animals.filter(a => a.urgency === 'Critical' || a.careStatus === 'Hungry' || a.careStatus === 'In Treatment');
 
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/api/health-logs', { 
        animalId: parseInt(form.animalId), 
        veterinarianUserId: user?.id, 
        actionType: form.actionType, 
        description: form.description, 
        nextCheckDate: form.nextCheckDate ? new Date(form.nextCheckDate).toISOString() : null 
      });
      const animal = animals.find(a => a.id === parseInt(form.animalId));
      setHealthLogs([{ ...res.data, animalName: animal?.name || '?', animalSpecies: animal?.species || '' }, ...healthLogs]);
      setShowForm(false); 
      setForm({ animalId: '', actionType: '', description: '', nextCheckDate: '' });
      setMsg({ text: 'Health record and follow-up task successfully created!', type: 'success' }); 
      setTimeout(() => setMsg({ text: '', type: '' }), 4000);
    } catch (err) { 
      setMsg({ text: err.response?.data?.message || 'An error occurred while adding the record.', type: 'error' }); 
    }
  };

  const getActionMeta = (type) => {
    const t = type || '';
    if (t.includes('Treatment') || t.includes('Wound')) {
      return {
        badgeColor: 'bg-red-50 text-red-700 border border-red-100',
        icon: Activity,
        borderColor: 'border-l-red-500'
      };
    }
    if (t.includes('Vaccine') || t.includes('Vaccination')) {
      return {
        badgeColor: 'bg-blue-50 text-blue-700 border border-blue-100',
        icon: Syringe,
        borderColor: 'border-l-blue-500'
      };
    }
    if (t.includes('Check') || t.includes('Control')) {
      return {
        badgeColor: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
        icon: Clipboard,
        borderColor: 'border-l-emerald-500'
      };
    }
    if (t.includes('Sterilization') || t.includes('Neutering') || t.includes('Parasite')) {
      return {
        badgeColor: 'bg-purple-50 text-purple-700 border border-purple-100',
        icon: Shield,
        borderColor: 'border-l-purple-500'
      };
    }
    return {
      badgeColor: 'bg-slate-50 text-slate-700 border border-slate-100',
      icon: Stethoscope,
      borderColor: 'border-l-teal-500'
    };
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading health records...</div>;
  
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      
      {/* Header Dashboard Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-800 p-6 md:p-8 text-white shadow-xl shadow-teal-900/10">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-teal-600 rounded-full opacity-20 blur-xl"></div>
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-emerald-600 rounded-full opacity-10 blur-xl"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-teal-950/30 px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase border border-teal-500/20">
              <Award className="w-4 h-4 text-emerald-300" /> Veterinarian Panel
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Health Records & Medical Tracking
            </h1>
            <p className="text-teal-100 max-w-xl text-sm md:text-base font-light">
              Manage vaccines, treatments, sterilizations, and general health checks of campus stray animals. Every record you log will automatically create a follow-up task assigned to you.
            </p>
          </div>
          
          <button 
            onClick={() => setShowForm(!showForm)} 
            className="self-start md:self-center px-6 py-3 bg-white hover:bg-teal-50 text-teal-900 font-bold rounded-2xl transition-all duration-200 flex items-center gap-2 shadow-lg shadow-teal-950/20 active:scale-[0.98] cursor-pointer"
          >
            {showForm ? <X className="w-5 h-5 text-teal-800" /> : <Plus className="w-5 h-5 text-teal-800" />}
            {showForm ? 'Close' : 'Add New Log'}
          </button>
        </div>
      </div>

      {msg.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-2.5 text-sm font-semibold border ${msg.type === 'error' ? 'bg-red-50 text-red-800 border-red-100' : 'bg-green-50 text-green-800 border-green-100'} animate-fade-in`}>
          {msg.type === 'error' ? <AlertTriangle className="w-5 h-5 shrink-0" /> : <CheckCircle className="w-5 h-5 shrink-0" />}
          {msg.text}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 animate-slide-down">
          <div className="flex items-center gap-3 mb-6 pb-3 border-b border-slate-100">
            <div className="p-2.5 bg-teal-50 text-teal-700 rounded-2xl">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">New Medical Log Entry</h2>
              <p className="text-xs text-slate-500">A follow-up task will be automatically created and assigned to you upon submission.</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">🐾 Select Animal</label>
              <select 
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:border-accent focus:bg-white text-sm transition-all duration-200" 
                required 
                value={form.animalId} 
                onChange={e => setForm({...form, animalId: e.target.value})}
              >
                <option value="">Choose the animal</option>
                {animals.map(a => <option key={a.id} value={a.id}>{a.name} ({a.species} - {a.careStatus})</option>)}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">📋 Action Type</label>
              <select 
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:border-accent focus:bg-white text-sm transition-all duration-200" 
                required 
                value={form.actionType} 
                onChange={e => setForm({...form, actionType: e.target.value})}
              >
                <option value="">Performed / Planned action</option>
                <option value="General Check">General Check</option>
                <option value="Vaccination">Vaccination</option>
                <option value="Treatment">Treatment</option>
                <option value="Sterilization">Sterilization</option>
                <option value="Parasite Treatment">Parasite Treatment</option>
                <option value="Wound Care">Wound Care</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">📅 Next Check Date <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input 
                type="date" 
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:border-accent focus:bg-white text-sm transition-all duration-200" 
                value={form.nextCheckDate} 
                onChange={e => setForm({...form, nextCheckDate: e.target.value})} 
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-600 flex items-center gap-1">✍️ Description / Notes</label>
              <textarea 
                placeholder="Treatment details, prescribed medications, dosages or critical issues to monitor..." 
                className="w-full p-3.5 border border-slate-200 rounded-2xl bg-slate-50/50 outline-none focus:border-accent focus:bg-white text-sm transition-all duration-200" 
                rows="4" 
                value={form.description} 
                onChange={e => setForm({...form, description: e.target.value})} 
              />
            </div>

            <div className="md:col-span-2 pt-2">
              <button 
                type="submit" 
                className="w-full py-4 bg-gradient-to-r from-accent to-accent-dark hover:from-accent-dark hover:to-teal-900 text-white font-bold rounded-2xl transition-all duration-200 shadow-lg shadow-teal-900/10 hover:shadow-teal-900/20 active:scale-[0.99] cursor-pointer text-center flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" /> Save Health Log and Create Task
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Map Section */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-red-50 text-red-600 rounded-xl animate-pulse">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Campus Live Health Tracking Map
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Red markers indicate locations of animals under active medical treatment or in critical condition.</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Medical Supervision
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Stable / Routine
            </div>
          </div>
        </div>
        <div 
          ref={mapRef} 
          className="w-full h-[400px] rounded-2xl border border-slate-100 z-10 shadow-inner"
        />
      </div>

      {/* Critical Conditions */}
      {criticalAnimals.length > 0 && (
        <div className="bg-gradient-to-br from-red-50 to-red-100/50 border border-red-200 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-red-100 text-red-700 rounded-2xl">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-950">Active Medical Cases & Emergencies ({criticalAnimals.length})</h2>
              <p className="text-xs text-red-700">Scan QR codes on-site to verify you are at the location and update treatments for these animals.</p>
            </div>
          </div>
          
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {criticalAnimals.map(a => {
              const isUrgent = a.urgency === 'Critical' || a.careStatus === 'Hungry';
              return (
                <div key={a.id} className="bg-white p-4 rounded-2xl border border-red-100 shadow-sm hover:shadow-md transition-all duration-200 flex justify-between items-center gap-4 group">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <img src={a.photoUrl} alt={a.name} className="w-12 h-12 rounded-full object-cover border-2 border-red-100 group-hover:scale-105 transition-transform duration-200" />
                      {isUrgent && (
                        <>
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full animate-ping"></span>
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-white rounded-full"></span>
                        </>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-sm text-slate-900 truncate">{a.name}</p>
                      <p className="text-xs text-slate-500 font-medium truncate">{a.species}</p>
                      <span className="inline-flex mt-1.5 items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">{a.careStatus}</span>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => navigate('/volunteer', { 
                      state: { 
                        autoScan: true,
                        targetAnimalName: a.name,
                        targetLocationName: a.locationName || 'Feeding Point'
                      } 
                    })}
                    className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow active:scale-95 shrink-0"
                  >
                    <QrCode className="w-4 h-4" /> Treat (QR)
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Historical Logs List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-2">
          <Clock className="w-5 h-5 text-slate-400" />
          <h2 className="text-xl font-bold text-slate-800">Health Tracking Log</h2>
        </div>
        
        <div className="grid gap-4">
          {healthLogs.map((h, i) => {
            const meta = getActionMeta(h.actionType);
            const ActionIcon = meta.icon;
            return (
              <div 
                key={h.id || i} 
                className={`bg-white rounded-2xl p-5 shadow-sm border border-slate-100 border-l-4 ${meta.borderColor} hover:shadow-md transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4`}
              >
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg ${meta.badgeColor}`}>
                      <ActionIcon className="w-3.5 h-3.5" />
                      {h.actionType}
                    </span>
                    <span className="text-sm font-extrabold text-slate-800">{h.animalName}</span>
                    <span className="text-xs text-slate-400">({h.animalSpecies})</span>
                  </div>
                  
                  {h.description && (
                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                      {h.description}
                    </p>
                  )}
                  
                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 font-medium pt-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(h.actionDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserRound className="w-3.5 h-3.5 text-slate-400" />
                      {getVetName(h.veterinarianUserId)}
                    </span>
                    {h.nextCheckDate && (
                      <span className="flex items-center gap-1.5 text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded-md">
                        <Clock className="w-3 h-3 text-orange-500" />
                        Next Check: {new Date(h.nextCheckDate).toLocaleDateString('en-US', { day: 'numeric', month: 'long' })}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-end">
                  <button 
                    onClick={() => navigate(`/animals/${h.animalId}`)}
                    className="p-2 text-slate-400 hover:text-accent hover:bg-slate-50 rounded-xl transition-all duration-200 group flex items-center gap-1 text-xs font-bold cursor-pointer"
                  >
                    Details
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
          
          {healthLogs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
              <span className="text-4xl">🩺</span>
              <p className="text-slate-500 text-sm font-medium mt-3">No recorded health operations found yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
