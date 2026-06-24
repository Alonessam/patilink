import React, { useEffect, useState, useRef } from 'react';
import api from '../api/apiClient';
import { MapPin, Clock, AlertTriangle, Package, Heart, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function FeedingPoints() {
  const [data, setData] = useState({ locations: [], animals: [], needs: [] });
  const [loading, setLoading] = useState(true);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get('/api/locations'),
      api.get('/api/animals'),
      api.get('/api/needs')
    ]).then(([locRes, animRes, needsRes]) => {
      setData({ locations: locRes.data, animals: animRes.data, needs: needsRes.data });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (loading || data.locations.length === 0 || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    // Initialize map centered at Inonu University
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

    data.locations.forEach(loc => {
      if (!loc.latitude || !loc.longitude) return;

      const locAnimals = data.animals.filter(a => a.locationId === loc.id);
      const isCritical = loc.careStatus === 'Hungry' || loc.careStatus === 'Critical';
      const colorClass = isCritical ? 'bg-red-500 border-red-200' : 'bg-emerald-500 border-emerald-200';
      const pulseColorClass = isCritical ? 'bg-red-400' : 'bg-emerald-400';

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
                <p style="margin: 0; font-size: 10px; color: #64748b;">${a.species} • ${a.careStatus}</p>
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
            <p style="margin: 0 0 4px 0; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em;">📡 GPS SIGNAL (CHIP)</p>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="width: 8px; height: 8px; border-radius: 50%; display: inline-block; background-color: ${isCritical ? '#ef4444' : '#10b981'}; animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></span>
              <span style="font-size: 12px; font-weight: 500; color: #334155;">${isCritical ? 'Critical Level' : 'Online / Fixed'}</span>
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
  }, [loading, data.locations, data.animals]);

  const statusStyle = (s) => 
    s === 'Hungry' || s === 'Critical' 
      ? 'bg-red-100 text-red-700 border-red-200' 
      : s === 'Cared For' 
        ? 'bg-green-100 text-green-700 border-green-200' 
        : 'bg-slate-100 text-slate-600 border-slate-200';
  
  const timeSince = (d) => { 
    if (!d) return 'No care yet'; 
    const h = Math.floor((Date.now() - new Date(d)) / 3600000); 
    return h < 1 ? 'Just now' : h < 24 ? `${h} hours ago` : `${Math.floor(h/24)} days ago`; 
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Feeding Points</h1>
        <p className="text-slate-600 mt-1">Feeding points on campus, the animals living there, and real-time status of food/water.</p>
      </div>

      {/* Map Section */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="flex items-center justify-between mb-4 px-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Campus Live Tracking Map (GPS Signals)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Track simulated collar chip signals and status of stray animals live on the campus map.</p>
          </div>
        </div>
        <div 
          ref={mapRef} 
          className="w-full h-[450px] rounded-2xl border border-slate-100 z-10"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
        {data.locations.map(loc => {
          const locAnimals = data.animals.filter(a => a.locationId === loc.id);
          const locNeeds = data.needs.filter(n => locAnimals.some(a => a.id === n.animalId) && n.status !== 'Fulfilled');
          const isCritical = loc.careStatus === 'Hungry' || loc.careStatus === 'Critical';
          const isCared = loc.careStatus === 'Cared For';
          
          return (
            <div key={loc.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-all duration-300 relative overflow-hidden">
              {/* Status Ribbon */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${isCritical ? 'bg-red-500' : isCared ? 'bg-green-500' : 'bg-slate-300'}`}></div>

              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-accent-soft p-3 rounded-2xl"><MapPin className="w-6 h-6 text-accent-dark" /></div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-900">{loc.name}</h3>
                    <p className="text-sm text-slate-500">{loc.faculty}</p>
                  </div>
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusStyle(loc.careStatus)}`}>{loc.careStatus}</span>
              </div>

              {loc.description && <p className="text-sm text-slate-600 mb-4 line-clamp-2">{loc.description}</p>}

              <div className="flex-1 space-y-4">
                {/* Residents (Animals) */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Heart className="w-3 h-3" /> Location Residents ({locAnimals.length})</h4>
                  {locAnimals.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {locAnimals.map(a => {
                        const animalCritical = a.careStatus === 'Hungry' || a.urgency === 'Critical';
                        return (
                          <Link to={`/animals/${a.id}`} key={a.id} title={`${a.name} - ${a.careStatus}`} className="group relative">
                            <img src={a.photoUrl} alt={a.name} className={`w-10 h-10 object-cover rounded-full border-2 transition-transform group-hover:scale-110 ${animalCritical ? 'border-red-400' : 'border-green-400'}`} />
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No registered animals here.</p>
                  )}
                </div>

                {/* Active Needs */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Package className="w-3 h-3" /> Pending Needs</h4>
                  {locNeeds.length > 0 ? (
                    <div className="space-y-2">
                      {locNeeds.slice(0, 3).map(n => {
                        const relatedAnim = locAnimals.find(a => a.id === n.animalId);
                        return (
                          <div key={n.id} className="text-xs p-2 bg-orange-50 text-orange-800 rounded-lg border border-orange-100 flex justify-between items-center">
                            <span><b>{n.needType}</b> ({n.amount})</span>
                            <span className="text-orange-600">for {relatedAnim?.name}</span>
                          </div>
                        );
                      })}
                      {locNeeds.length > 3 && <div className="text-xs text-accent-dark font-medium">+ {locNeeds.length - 3} more needs...</div>}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No urgent needs right now.</p>
                  )}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">{timeSince(loc.lastCareAt)}</span>
                </div>
                <span className="text-xs text-slate-400 font-mono bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">{loc.qrCode}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
