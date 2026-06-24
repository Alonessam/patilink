import React, { useState, useEffect, useRef } from 'react';
import api from '../api/apiClient';
import { Plus, MapPin, AlertCircle, CheckCircle2, Users, FileText, Settings, Trash2 } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState('animals'); // animals, locations, users, tasks, reports
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [locations, setLocations] = useState([]);
  const [animals, setAnimals] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [reports, setReports] = useState([]);
  const [newAnimal, setNewAnimal] = useState({ name: '', species: '', gender: '', description: '', locationId: '', careStatus: 'Routine', urgency: 'Routine' });
  const [newLocation, setNewLocation] = useState({ name: '', faculty: '', latitude: 38.3328, longitude: 38.4381 });
  const [newTask, setNewTask] = useState({ animalId: '', locationId: '', taskType: '', dueAt: '', note: '', frequency: 'One-Time' });
  const [editingLocationId, setEditingLocationId] = useState(null);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pickerMarkerRef = useRef(null);
  const selectLocationForEditRef = useRef(null);

  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg({ text: '', type: '' }), 3000); };

  const loadData = () => {
    api.get('/api/locations').then(r => setLocations(r.data)).catch(()=>{});
    if (activeTab === 'animals' || activeTab === 'tasks') api.get('/api/animals').then(r => setAnimals(r.data)).catch(()=>{});
    if (activeTab === 'users') api.get('/api/users').then(r => setUsersList(r.data)).catch(()=>{});
    if (activeTab === 'reports') api.get('/api/reports').then(r => setReports(r.data)).catch(()=>{});
  };

  useEffect(() => { loadData(); }, [activeTab]);

  // Set up selectLocationForEditRef so it always points to the latest state updater without recreating Leaflet callbacks
  selectLocationForEditRef.current = (loc) => {
    setEditingLocationId(loc.id);
    setNewLocation({
      name: loc.name,
      faculty: loc.faculty,
      latitude: loc.latitude,
      longitude: loc.longitude
    });
    if (pickerMarkerRef.current) {
      pickerMarkerRef.current.setLatLng([loc.latitude, loc.longitude]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([loc.latitude, loc.longitude], 16);
    }
  };

  useEffect(() => {
    if (activeTab !== 'locations' || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const validLocs = locations.filter(l => l.latitude && l.longitude);
    let mapCenter = [38.3328, 38.4381];
    let mapZoom = 15;
    let bounds = null;

    if (validLocs.length > 0) {
      bounds = L.latLngBounds(validLocs.map(l => [l.latitude, l.longitude]));
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
      zoomAnimation: true
    });
    mapInstanceRef.current = map;

    if (bounds && bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(mapCenter, mapZoom);
    }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add existing markers
    validLocs.forEach(loc => {
      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: L.divIcon({
          className: 'existing-location-marker',
          html: `
            <div class="relative flex items-center justify-center" style="width: 24px; height: 24px;">
              <div class="relative flex items-center justify-center rounded-full bg-slate-500 border-2 border-white text-white shadow-sm hover:bg-accent hover:scale-110 transition-all duration-200" style="width: 20px; height: 20px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                </svg>
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        })
      }).addTo(map);

      // Create popup content as DOM node to attach event listener
      const container = document.createElement('div');
      container.className = 'p-1';
      
      const title = document.createElement('h4');
      title.className = 'font-bold text-slate-800 text-sm';
      title.innerText = loc.name;
      container.appendChild(title);
      
      const sub = document.createElement('p');
      sub.className = 'text-xs text-slate-500';
      sub.innerText = loc.faculty;
      container.appendChild(sub);
      
      const editLink = document.createElement('button');
      editLink.className = 'text-xs text-accent hover:text-accent-dark font-bold mt-2 flex items-center gap-1 hover:underline w-full text-left';
      editLink.innerHTML = '✏️ Edit This Location';
      editLink.onclick = (e) => {
        e.preventDefault();
        if (selectLocationForEditRef.current) {
          selectLocationForEditRef.current(loc);
        }
        marker.closePopup();
      };
      container.appendChild(editLink);

      marker.bindPopup(container);
    });

    // Create picker marker
    const currentCenter = map.getCenter();
    setNewLocation(prev => ({
      ...prev,
      latitude: currentCenter.lat,
      longitude: currentCenter.lng
    }));

    const pickerMarker = L.marker(currentCenter, {
      draggable: true,
      icon: L.divIcon({
        className: 'picker-location-marker',
        html: `
          <div class="relative flex items-center justify-center animate-bounce" style="width: 48px; height: 48px; margin-top: -24px;">
            <span class="absolute inline-flex h-8 w-8 rounded-full bg-accent opacity-45 animate-ping" style="animation-duration: 1.5s;"></span>
            <div class="relative flex items-center justify-center rounded-full bg-accent border-4 border-white text-white shadow-lg" style="width: 36px; height: 36px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        `,
        iconSize: [48, 48],
        iconAnchor: [24, 24]
      })
    }).addTo(map);

    pickerMarkerRef.current = pickerMarker;

    pickerMarker.on('dragend', function (e) {
      const latlng = e.target.getLatLng();
      setNewLocation(prev => ({
        ...prev,
        latitude: latlng.lat,
        longitude: latlng.lng
      }));
    });

    map.on('click', function (e) {
      pickerMarker.setLatLng(e.latlng);
      setNewLocation(prev => ({
        ...prev,
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      }));
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      pickerMarkerRef.current = null;
    };
  }, [activeTab, locations]);

  const handleAnimalSubmit = async (e) => {
    e.preventDefault();
    try { await api.post('/api/animals', { ...newAnimal, locationId: parseInt(newAnimal.locationId) }); showMsg('Animal added successfully!'); setNewAnimal({ name: '', species: '', gender: '', description: '', locationId: '', careStatus: 'Routine', urgency: 'Routine' }); loadData(); } 
    catch (err) { showMsg(err.response?.data?.message || 'Error', 'error'); }
  };

  const cancelLocationEdit = () => {
    setEditingLocationId(null);
    setNewLocation({ name: '', faculty: '', latitude: 38.3328, longitude: 38.4381 });
    if (mapInstanceRef.current && pickerMarkerRef.current) {
      const center = mapInstanceRef.current.getCenter();
      pickerMarkerRef.current.setLatLng(center);
      setNewLocation(prev => ({
        ...prev,
        latitude: center.lat,
        longitude: center.lng
      }));
    }
  };

  const handleLocationSubmit = async (e) => {
    e.preventDefault();
    try { 
      if (editingLocationId) {
        await api.put(`/api/locations/${editingLocationId}`, {
          ...newLocation,
          latitude: parseFloat(newLocation.latitude),
          longitude: parseFloat(newLocation.longitude)
        });
        showMsg('Location updated successfully!');
      } else {
        await api.post('/api/locations', {
          ...newLocation,
          latitude: parseFloat(newLocation.latitude),
          longitude: parseFloat(newLocation.longitude)
        }); 
        showMsg('Location added successfully!'); 
      }
      setEditingLocationId(null);
      setNewLocation({ name: '', faculty: '', latitude: 38.3328, longitude: 38.4381 }); 
      loadData(); 
    } 
    catch (err) { showMsg(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    try { await api.post('/api/tasks', { ...newTask, animalId: parseInt(newTask.animalId), locationId: parseInt(newTask.locationId) }); showMsg('Task created successfully!'); setNewTask({ animalId: '', locationId: '', taskType: '', dueAt: '', note: '', frequency: 'One-Time' }); } 
    catch (err) { showMsg(err.response?.data?.message || 'Error', 'error'); }
  };

  const handleLatChange = (val) => {
    setNewLocation(prev => {
      const updated = { ...prev, latitude: val };
      const lat = parseFloat(val);
      if (pickerMarkerRef.current && !isNaN(lat)) {
        pickerMarkerRef.current.setLatLng([lat, parseFloat(prev.longitude) || 0]);
      }
      return updated;
    });
  };

  const handleLngChange = (val) => {
    setNewLocation(prev => {
      const updated = { ...prev, longitude: val };
      const lng = parseFloat(val);
      if (pickerMarkerRef.current && !isNaN(lng)) {
        pickerMarkerRef.current.setLatLng([parseFloat(prev.latitude) || 0, lng]);
      }
      return updated;
    });
  };

  const handleDeleteAnimal = async (id) => {
    if(!window.confirm('Are you sure you want to delete this animal?')) return;
    try { await api.delete(`/api/animals/${id}`); showMsg('Animal deleted'); loadData(); } catch (err) { showMsg('Error', 'error'); }
  };

  const handleRoleChange = async (id, role) => {
    try { await api.patch(`/api/users/${id}/role`, { role }); showMsg('User role updated'); loadData(); } catch(err) { showMsg('Error', 'error'); }
  };

  const tabs = [
    { id: 'animals', label: 'Animal Management', icon: Plus },
    { id: 'locations', label: 'Location Management', icon: MapPin },
    { id: 'tasks', label: 'Create Task', icon: Settings },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'reports', label: 'Notifications', icon: FileText }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold text-slate-900">Admin Panel</h1>
      {msg.text && <div className={`p-4 rounded-xl flex items-center gap-2 text-sm ${msg.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{msg.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}{msg.text}</div>}
      
      <div className="flex overflow-x-auto border-b border-slate-200 pb-2 gap-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-accent text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'animals' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Add New Animal</h2>
              <form onSubmit={handleAnimalSubmit} className="space-y-4">
                <input type="text" placeholder="Name" className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent" required value={newAnimal.name} onChange={e => setNewAnimal({...newAnimal, name: e.target.value})} />
                <input type="text" placeholder="Species (Cat, Dog etc.)" className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent" required value={newAnimal.species} onChange={e => setNewAnimal({...newAnimal, species: e.target.value})} />
                <input type="text" placeholder="Gender" className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent" required value={newAnimal.gender} onChange={e => setNewAnimal({...newAnimal, gender: e.target.value})} />
                <textarea placeholder="Description" className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent" required value={newAnimal.description} onChange={e => setNewAnimal({...newAnimal, description: e.target.value})}></textarea>
                <select className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent" required value={newAnimal.locationId} onChange={e => setNewAnimal({...newAnimal, locationId: e.target.value})}>
                  <option value="">Select Location</option>
                  {locations.map(loc => <option key={loc.id} value={loc.id}>{loc.name} ({loc.faculty})</option>)}
                </select>
                <button type="submit" className="w-full bg-accent text-white p-3 rounded-lg font-medium hover:bg-accent-dark">Add Animal</button>
              </form>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Current Animals ({animals.length})</h2>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {animals.map(a => (
                  <div key={a.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg bg-slate-50">
                    <div><p className="font-bold text-sm text-slate-900">{a.name} <span className="font-normal text-slate-500">({a.species})</span></p></div>
                    <button onClick={() => handleDeleteAnimal(a.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Form and Location List */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-4">
                  {editingLocationId ? 'Edit Location' : 'Add New Location'}
                </h2>
                <form onSubmit={handleLocationSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Location Name</label>
                    <input type="text" placeholder="Location Name (e.g. Behind the Library)" className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent text-sm" required value={newLocation.name} onChange={e => setNewLocation({...newLocation, name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Faculty/Region</label>
                    <input type="text" placeholder="Faculty/Region (e.g. Engineering)" className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent text-sm" required value={newLocation.faculty} onChange={e => setNewLocation({...newLocation, faculty: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Latitude</label>
                      <input type="number" step="any" placeholder="Latitude" className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent text-sm" required value={newLocation.latitude} onChange={e => handleLatChange(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Longitude</label>
                      <input type="number" step="any" placeholder="Longitude" className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent text-sm" required value={newLocation.longitude} onChange={e => handleLngChange(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {editingLocationId && (
                      <button 
                        type="button" 
                        onClick={cancelLocationEdit}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 p-3 rounded-lg font-semibold transition-all duration-200 active:scale-[0.98]"
                      >
                        Cancel
                      </button>
                    )}
                    <button type="submit" className="flex-[2] bg-accent text-white p-3 rounded-lg font-semibold hover:bg-accent-dark transition-all duration-200 shadow-md shadow-accent/25 hover:shadow-accent/40 active:scale-[0.98]">
                      {editingLocationId ? 'Update Location' : 'Add Location'}
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Current Locations ({locations.length})</h2>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {locations.map(l => (
                    <div 
                      key={l.id} 
                      onClick={() => selectLocationForEditRef.current && selectLocationForEditRef.current(l)}
                      className={`p-3 border rounded-lg text-sm flex justify-between items-center cursor-pointer hover:bg-slate-100 hover:border-accent transition-all duration-150 ${editingLocationId === l.id ? 'border-accent bg-accent/5 ring-1 ring-accent' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <div>
                        <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                          {l.name}
                          {editingLocationId === l.id && <span className="text-[10px] bg-accent text-white px-1.5 py-0.5 rounded font-bold animate-pulse">Editing</span>}
                        </p>
                        <p className="text-xs text-slate-500">{l.faculty} • {l.latitude?.toFixed(4)}, {l.longitude?.toFixed(4)}</p>
                      </div>
                      <span className="font-mono text-xs bg-slate-200/80 px-2 py-1 rounded text-slate-600 font-bold shrink-0">{l.qrCode}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Map Picker */}
            <div className="lg:col-span-7 flex flex-col">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-1 flex flex-col min-h-[500px]">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Select from Map</h2>
                  <p className="text-xs text-slate-500 mt-1">You can drag the blue pin on the map or click directly on any point on the map to update the location.</p>
                </div>
                <div className="relative rounded-xl border border-slate-200 overflow-hidden flex-1 min-h-[400px]">
                  <div ref={mapRef} className="absolute inset-0 z-10 w-full h-full" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 max-w-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Create Task</h2>
            <form onSubmit={handleTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Animal</label>
                <select className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent text-sm" required value={newTask.animalId} onChange={e => setNewTask({...newTask, animalId: e.target.value})}>
                  <option value="">Select Animal</option>
                  {animals.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Location (For Verification)</label>
                <select className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent text-sm" required value={newTask.locationId} onChange={e => setNewTask({...newTask, locationId: e.target.value})}>
                  <option value="">Select Location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Task Type</label>
                <input type="text" placeholder="Task Type (e.g. Feeding, Control)" className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent text-sm" required value={newTask.taskType} onChange={e => setNewTask({...newTask, taskType: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Repeat Frequency</label>
                <select className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent text-sm" required value={newTask.frequency} onChange={e => setNewTask({...newTask, frequency: e.target.value})}>
                  <option value="One-Time">One-Time (Created once)</option>
                  <option value="Daily">Daily (Creates a 7-day task plan)</option>
                  <option value="Weekly">Weekly (Creates a 4-week task plan)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Due Date and Time</label>
                <input type="datetime-local" className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent text-sm" required value={newTask.dueAt} onChange={e => setNewTask({...newTask, dueAt: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Task Note</label>
                <textarea placeholder="Task Note" className="w-full p-3 border border-slate-200 rounded-lg outline-none focus:border-accent text-sm" value={newTask.note} onChange={e => setNewTask({...newTask, note: e.target.value})}></textarea>
              </div>
              <button type="submit" className="w-full bg-accent text-white p-3 rounded-lg font-semibold hover:bg-accent-dark transition-all duration-200 shadow-md shadow-accent/25 hover:shadow-accent/40 active:scale-[0.98]">
                Create Task
              </button>
            </form>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">User Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-600">
                  <tr><th className="p-3">Full Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Action</th></tr>
                </thead>
                <tbody>
                  {usersList.map(u => (
                    <tr key={u.id} className="border-b border-slate-100">
                      <td className="p-3 font-medium text-slate-900">{u.fullName}</td>
                      <td className="p-3 text-slate-600">{u.email}</td>
                      <td className="p-3"><span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role==='Admin'?'bg-purple-100 text-purple-700':u.role==='Vet'?'bg-blue-100 text-blue-700':'bg-slate-100 text-slate-700'}`}>{u.role}</span></td>
                      <td className="p-3">
                        <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)} className="p-1 border rounded text-xs bg-slate-50">
                          <option value="Volunteer">Volunteer</option>
                          <option value="Vet">Vet</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Notifications Received</h2>
            <div className="space-y-4">
              {reports.map(r => (
                <div key={r.id} className="p-4 border border-slate-100 bg-slate-50 rounded-xl">
                  <div className="flex justify-between items-start mb-2">
                    <div><p className="font-bold text-slate-900">{r.subject}</p><p className="text-xs text-slate-500">{r.reporterName} ({r.email}) - {new Date(r.createdAt).toLocaleDateString()}</p></div>
                    <span className={`text-xs px-2 py-1 rounded-full ${r.status==='New'?'bg-red-100 text-red-700':'bg-green-100 text-green-700'}`}>{r.status}</span>
                  </div>
                  <p className="text-sm text-slate-700 mt-2">{r.message}</p>
                  {r.status === 'New' && <button onClick={() => { api.patch(`/api/reports/${r.id}/status`, {status: 'Reviewed'}).then(()=>loadData()) }} className="mt-3 text-xs bg-white border px-3 py-1.5 rounded hover:bg-slate-100">Mark as Reviewed</button>}
                </div>
              ))}
              {reports.length === 0 && <p className="text-slate-500">No notifications found.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
