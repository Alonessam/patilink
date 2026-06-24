import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Info, ArrowLeft, Heart, Clock, Stethoscope, Package, Calendar, QrCode } from 'lucide-react';

export default function AnimalDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { api.get(`/api/animals/${id}`).then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false)); }, [id]);

  const handleAssignTask = async (taskId) => {
    if (!user) { navigate('/login'); return; }
    try { await api.patch(`/api/tasks/${taskId}/assign`, { userId: user.id }); const r = await api.get(`/api/animals/${id}`); setData(r.data); } catch (e) { console.error(e); }
  };

  const handleUnassignTask = async (taskId) => {
    try { await api.patch(`/api/tasks/${taskId}/unassign`); const r = await api.get(`/api/animals/${id}`); setData(r.data); } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;
  if (!data?.animal) return <div className="p-8 text-center text-red-500">Animal record not found.</div>;
  const { animal, tasks, needs, healthLogs } = data;

  const isHungry = animal.careStatus === 'Hungry';
  const isSick = animal.careStatus === 'In Treatment';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      <button onClick={() => navigate('/animals')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"><ArrowLeft className="w-5 h-5" />Back</button>
      <div className="grid md:grid-cols-3 gap-8">
        {/* Left: Photo & Info */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            <img src={animal.photoUrl} alt={animal.name} className="w-full aspect-square object-cover rounded-xl mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-1">{animal.name}</h1>
            <p className="text-slate-600 mb-4">{animal.species} • {animal.gender}</p>
            <div className="flex items-center gap-2 text-sm text-slate-600 mb-2"><MapPin className="w-4 h-4 text-accent" />{animal.locationName}</div>
            <div className="flex items-center justify-between text-sm text-slate-600 mt-2">
              <span className="flex items-center gap-2"><Info className="w-4 h-4 text-accent" />Status: {animal.careStatus} ({animal.urgency})</span>
              {isHungry && (
                <button 
                  onClick={() => navigate('/volunteer', { 
                    state: { 
                      autoScan: true,
                      targetAnimalName: animal.name,
                      targetLocationName: animal.locationName || 'Feeding Point'
                    } 
                  })}
                  className="px-2.5 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" /> Feed
                </button>
              )}
              {isSick && (
                <button 
                  onClick={() => navigate('/volunteer', { 
                    state: { 
                      autoScan: true,
                      targetAnimalName: animal.name,
                      targetLocationName: animal.locationName || 'Feeding Point'
                    } 
                  })}
                  className="px-2.5 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" /> Give Med
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Right: Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-3">About</h2>
            <p className="text-slate-600 leading-relaxed">{animal.description}</p>
          </div>
          {/* Tasks */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Clock className="w-5 h-5 text-accent" />Tasks</h2>
            {tasks?.filter(t => t.status !== 'Completed').length > 0 ? (
              <div className="space-y-3">{tasks.filter(t => t.status !== 'Completed').map(t => {
                const isOpen = t.status === 'Open';
                const isAssigned = t.status === 'Assigned';
                return (
                  <div key={t.id} className="p-4 border border-slate-100 rounded-xl flex justify-between items-center bg-slate-50">
                    <div><p className="font-bold text-slate-900">{t.taskType}</p><p className="text-sm text-slate-500">Due: {new Date(t.dueAt).toLocaleDateString('en-US')} • {t.status}</p></div>
                    {isOpen ? (
                      <button onClick={() => handleAssignTask(t.id)} className="px-4 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark">Assign Me</button>
                    ) : isAssigned && t.assignedUserId === user?.id ? (
                      <button onClick={() => handleUnassignTask(t.id)} className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100">Drop</button>
                    ) : null}
                  </div>
                );
              })}</div>
            ) : <p className="text-slate-500 text-sm">No pending tasks.</p>}
          </div>
          {/* Health History */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Stethoscope className="w-5 h-5 text-accent" />Health History</h2>
            {healthLogs?.length > 0 ? (
              <div className="space-y-3">{healthLogs.map(h => {
                const isTreatment = h.actionType?.includes('Treatment');
                const isVaccine = h.actionType?.includes('Vaccine');
                
                return (
                  <div key={h.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isTreatment ? 'bg-red-100 text-red-700' : isVaccine ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{h.actionType}</span>
                      <span className="text-xs text-slate-400">{new Date(h.actionDate).toLocaleDateString('en-US')}</span>
                    </div>
                    <p className="text-sm text-slate-600">{h.description}</p>
                    {h.nextCheckDate && <p className="text-xs text-orange-600 mt-1 flex items-center gap-1"><Calendar className="w-3 h-3" />Next check: {new Date(h.nextCheckDate).toLocaleDateString('en-US')}</p>}
                  </div>
                );
              })}</div>
            ) : <p className="text-slate-500 text-sm">No health records found.</p>}
          </div>
          {/* Needs */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-accent" />Needs</h2>
            {needs?.filter(n => n.status !== 'Fulfilled').length > 0 ? (
              <div className="space-y-3">{needs.filter(n => n.status !== 'Fulfilled').map(n => {
                const isFoodOrWater = n.needType?.toLowerCase().trim() === 'food' || n.needType?.toLowerCase().trim() === 'water';
                const isMed = n.needType?.toLowerCase().trim() === 'medicine' || n.needType?.toLowerCase().trim() === 'med' || n.needType?.toLowerCase().trim() === 'treatment';
                const isCritical = n.urgency === 'Critical';
                
                return (
                  <div key={n.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex justify-between items-center">
                    <div><p className="font-bold text-slate-900">{n.needType}</p><p className="text-sm text-slate-500">{n.description} {n.amount && `• ${n.amount}`}</p></div>
                    <div className="flex items-center gap-3">
                      {isFoodOrWater && (
                        <button 
                          onClick={() => navigate('/volunteer', { 
                            state: { 
                              autoScan: true, 
                              targetNeedId: n.id,
                              targetAnimalName: animal.name,
                              targetLocationName: animal.locationName || 'Feeding Point'
                            } 
                          })}
                          className="px-3 py-1.5 bg-accent hover:bg-accent-dark text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Feed (QR)
                        </button>
                      )}
                      {isMed && (
                        <button 
                          onClick={() => navigate('/volunteer', { 
                            state: { 
                              autoScan: true, 
                              targetNeedId: n.id,
                              targetAnimalName: animal.name,
                              targetLocationName: animal.locationName || 'Feeding Point'
                            } 
                          })}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shadow-sm"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Give Med (QR)
                        </button>
                      )}
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${isCritical ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{n.urgency}</span>
                    </div>
                  </div>
                );
              })}</div>
            ) : <p className="text-slate-500 text-sm">No pending needs.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
