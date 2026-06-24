import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/apiClient';
import { useAuth } from '../contexts/AuthContext';
import { QrCode, CheckCircle2, AlertTriangle, Clock, ChevronRight, AlertCircle, Camera, X } from 'lucide-react';
import { Scanner } from '@yudiel/react-qr-scanner';

export default function VolunteerPanel() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrInput, setQrInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [completeNote, setCompleteNote] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [filterMode, setFilterMode] = useState('myTasks'); // 'myTasks' or 'allTasks'
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    if (location.state?.autoScan) {
      setShowCamera(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  const fetchTasks = () => {
    setLoading(true);
    const url = filterMode === 'myTasks' && user ? `/api/tasks?userId=${user.id}` : '/api/tasks';
    api.get(url).then(r => { setTasks(r.data); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, [filterMode]);

  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const handleQrScan = async (codeOverride) => {
    const codeToScan = codeOverride || qrInput.trim();
    if (!codeToScan) return;
    setScanning(true); setScanResult(null);
    try {
      const res = await api.post('/api/qr/scan', { qrCode: codeToScan, userId: user?.id || 0, note: '', photoUrl: '' });
      setScanResult(res.data);
      if(showCamera) setShowCamera(false); // Close camera
    } catch (err) { setScanResult({ error: err.response?.data?.message || 'QR code not recognized.' }); }
    setScanning(false);
  };

  const handleCompleteTask = async (taskId) => {
    try {
      await api.post(`/api/tasks/${taskId}/complete`, { userId: user?.id || 0, qrCode: qrInput.trim(), note: completeNote || 'Task completed.', photoUrl: '' });
      showMsg('Task successfully completed and verified via QR!');
      setCompletingTaskId(null); setCompleteNote('');
      fetchTasks(); setScanResult(null); setQrInput('');
    } catch (err) { showMsg('Error: ' + (err.response?.data?.message || err.message), 'error'); }
  };

  const handleCompleteNeed = async (needId, scannedCode) => {
    try {
      await api.patch(`/api/needs/${needId}/status`, { status: 'Fulfilled' });
      showMsg('Need successfully fulfilled and verified via QR!');
      if (scannedCode) {
        const res = await api.post('/api/qr/scan', { qrCode: scannedCode, userId: user?.id || 0, note: '', photoUrl: '' });
        setScanResult(res.data);
      }
      fetchTasks();
    } catch (err) { showMsg('Error: ' + (err.response?.data?.message || err.message), 'error'); }
  };

  const handleUnassignTask = async (taskId) => {
    try {
      await api.patch(`/api/tasks/${taskId}/unassign`);
      showMsg('You have unassigned the task.');
      fetchTasks();
    } catch (err) { showMsg('An error occurred.', 'error'); }
  };

  const handleDirectCompleteTask = async (taskId) => {
    try {
      await api.post(`/api/tasks/${taskId}/complete`, { 
        userId: user?.id || 0, 
        qrCode: '', 
        note: 'Task directly completed by veterinarian.', 
        photoUrl: '' 
      });
      showMsg('Task completed successfully!');
      fetchTasks();
    } catch (err) { 
      showMsg('Error: ' + (err.response?.data?.message || err.message), 'error'); 
    }
  };

  const openTasks = tasks.filter(t => t.status !== 'Completed');
  const completedTasks = tasks.filter(t => t.status === 'Completed');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-900">Volunteer Panel</h1>

      {location.state?.targetAnimalName && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
              <AlertTriangle className="w-5 h-5 shrink-0" />
            </div>
            <div>
              <p className="font-bold text-sm text-amber-950">Target Location Verification Pending</p>
              <p className="text-xs text-amber-800 font-medium">
                Please scan the correct QR code for <b>{location.state.targetAnimalName}</b> ({location.state.targetLocationName}).
              </p>
            </div>
          </div>
          <button 
            onClick={() => { navigate(location.pathname, { replace: true, state: {} }); }} 
            className="text-xs text-amber-700 hover:text-amber-900 font-bold bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            Clear
          </button>
        </div>
      )}

      {msg.text && <div className={`p-4 rounded-xl flex items-center gap-2 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}{msg.text}</div>}

      {/* QR Code Verification */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><QrCode className="w-6 h-6 text-accent" /> Task Verification with QR Code</h2>
        <p className="text-slate-600 text-sm mb-4">Complete your task by scanning the QR code at the feeding point with your camera. <span className="block mt-1 text-accent font-medium">Demo codes you can scan: QR-ENG-001, QR-LIB-002, QR-SPO-003</span></p>
        
        <button onClick={() => setShowCamera(!showCamera)} className={`w-full py-3 font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 mb-4 ${showCamera ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
          {showCamera ? <><X className="w-5 h-5" /> Close Camera</> : <><Camera className="w-5 h-5" /> Open Camera & Scan QR</>}
        </button>

        {showCamera && (
          <div className="rounded-xl overflow-hidden mb-4 border-2 border-accent max-w-sm mx-auto">
            <Scanner onScan={(result) => { if(result && result.length > 0) { setQrInput(result[0].rawValue); handleQrScan(result[0].rawValue); } }} />
          </div>
        )}

        {scanResult && !scanResult.error && (
          <div className="mt-6 bg-accent-soft rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2 text-accent-dark font-bold text-lg"><CheckCircle2 className="w-5 h-5" />{scanResult.location.name} — QR Verified!</div>
            
            {location.state?.targetLocationName && scanResult.location.name !== location.state.targetLocationName && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-2.5 text-sm font-semibold">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Incorrect Location! Scanned location {scanResult.location.name} does not match targeted {location.state.targetAnimalName} ({location.state.targetLocationName})!</span>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 border-b pb-1">Animals</h4>
                {scanResult.animals.length > 0 ? scanResult.animals.map(a => (
                  <div key={a.id} className="flex items-center gap-2 py-1 text-sm text-slate-700"><span className={`w-2 h-2 rounded-full ${a.urgency === 'Critical' ? 'bg-red-500' : 'bg-green-500'}`}></span>{a.name} ({a.species}) — <span className="font-medium">{a.careStatus}</span></div>
                )) : <p className="text-sm text-slate-500">No registered animals.</p>}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 border-b pb-1">Open Tasks</h4>
                {scanResult.openTasks.length > 0 ? scanResult.openTasks.map(t => (
                  <div key={t.id} className="bg-white p-3 rounded-lg border border-slate-200 mb-2">
                    <div className="flex justify-between items-center"><span className="font-medium text-slate-900">{t.taskType}</span><span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{t.status}</span></div>
                    {completingTaskId === t.id ? (
                      <div className="mt-2 space-y-2">
                        <textarea placeholder="Add a note (optional)" className="w-full p-2 border rounded-lg text-sm" value={completeNote} onChange={e => setCompleteNote(e.target.value)} />
                        <button onClick={() => handleCompleteTask(t.id)} className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg text-sm">✅ Confirm & Complete</button>
                      </div>
                    ) : (
                      <button onClick={() => setCompletingTaskId(t.id)} className="mt-2 w-full py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent-dark flex items-center justify-center gap-1">Complete <ChevronRight className="w-4 h-4" /></button>
                    )}
                  </div>
                )) : <p className="text-sm text-slate-500">No open tasks.</p>}
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 mb-2 border-b pb-1">Pending Needs</h4>
                {scanResult.openNeeds && scanResult.openNeeds.length > 0 ? scanResult.openNeeds.map(n => {
                  const animalName = scanResult.animals.find(a => a.id === n.animalId)?.name || 'Animal';
                  const isTarget = location.state?.targetNeedId === n.id;
                  const isMedicine = n.needType?.toLowerCase().includes('medicine') || n.needType?.toLowerCase().includes('med') || n.needType?.toLowerCase().includes('treatment');
                  return (
                    <div 
                      key={n.id} 
                      className={`bg-white p-3 rounded-lg border mb-2 flex flex-col justify-between transition-all duration-200 ${isTarget ? 'border-amber-400 ring-2 ring-amber-100 shadow-md scale-[1.02]' : 'border-slate-200'}`}
                    >
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <span className="font-bold text-slate-900 text-sm">{n.needType}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${n.urgency === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{n.urgency}</span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 font-medium">{animalName} for • {n.description} {n.amount && `(${n.amount})`}</p>
                      </div>
                      <button 
                        onClick={() => handleCompleteNeed(n.id, scanResult.location.qrCode)} 
                        className={`mt-2.5 w-full py-1.5 text-white rounded-lg text-xs font-bold transition-colors shadow-sm flex items-center justify-center gap-1 ${isMedicine ? 'bg-blue-600 hover:bg-blue-700' : 'bg-accent hover:bg-accent-dark'}`}
                      >
                        {isMedicine ? '💊 Give Medicine' : '✓ Meet Need'}
                      </button>
                    </div>
                  );
                }) : <p className="text-sm text-slate-500">No pending needs.</p>}
              </div>
            </div>
          </div>
        )}
        {scanResult && scanResult.error && <div className="mt-4 bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> {scanResult.error}</div>}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2"><Clock className="w-5 h-5 text-orange-500" /> Open Tasks ({openTasks.length})</h2>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button onClick={() => setFilterMode('myTasks')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterMode === 'myTasks' ? 'bg-white shadow-sm text-accent-dark' : 'text-slate-600 hover:text-slate-900'}`}>My Tasks</button>
            <button onClick={() => setFilterMode('allTasks')} className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${filterMode === 'allTasks' ? 'bg-white shadow-sm text-accent-dark' : 'text-slate-600 hover:text-slate-900'}`}>All Tasks</button>
          </div>
        </div>
        
        {loading ? <p className="text-slate-500">Loading...</p> : openTasks.length === 0 ? (
          <p className="text-slate-500 text-sm">No open tasks found! 🎉</p>
        ) : (
          <div className="space-y-3">
            {openTasks.map(task => (
              <div key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 gap-3">
                <div>
                  <p className="font-bold text-slate-900">{task.taskType}</p>
                  <p className="text-sm text-slate-500">{task.locationName} • {task.animalName}</p>
                  <p className="text-xs text-slate-400 mt-1">Due: {new Date(task.dueAt).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${task.status === 'Open' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{task.status}</span>
                  {task.assignedUserId !== user?.id && task.status === 'Open' && (
                     <span className="text-xs text-slate-500 italic">Unassigned</span>
                  )}
                  {task.assignedUserId === user?.id && task.status === 'Assigned' && (
                     <div className="flex gap-2">
                       {user?.role === 'Vet' && (
                         <button 
                           onClick={() => handleDirectCompleteTask(task.id)} 
                           className="text-xs text-emerald-600 hover:text-emerald-800 font-medium bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                         >
                           Complete
                         </button>
                       )}
                       <button onClick={() => handleUnassignTask(task.id)} className="text-xs text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">Unassign Task</button>
                     </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-500" /> Completed Tasks ({completedTasks.length})</h2>
          <div className="space-y-3">
            {completedTasks.slice(0, 5).map(task => (
              <div key={task.id} className="flex items-center justify-between p-4 border border-green-100 rounded-xl bg-green-50/50">
                <div><p className="font-bold text-slate-900">{task.taskType}</p><p className="text-sm text-slate-500">{task.locationName}</p></div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">Completed ✓</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
