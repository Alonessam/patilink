import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PawPrint, LogIn, LogOut, User, Menu, X, Home, Heart, MapPin, ClipboardList, Stethoscope, Shield, Phone, Gift } from 'lucide-react';

export default function Navbar() {
  const { user, isLoggedIn, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  const handleLogout = () => { logout(); setOpen(false); };

  const guestLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/animals', label: 'Animals', icon: PawPrint },
    { to: '/needs', label: 'Needs', icon: Heart },
    { to: '/contact', label: 'Contact', icon: Phone },
  ];

  const roleLinks = {
    'Volunteer': [
      { to: '/', label: 'Home', icon: Home },
      { to: '/animals', label: 'Animals', icon: PawPrint },
      { to: '/feeding-points', label: 'Feeding Points', icon: MapPin },
      { to: '/volunteer', label: 'My Tasks', icon: ClipboardList },
      { to: '/needs', label: 'Needs', icon: Heart },
      { to: '/donations', label: 'Donations', icon: Gift },
    ],
    'Vet': [
      { to: '/', label: 'Home', icon: Home },
      { to: '/animals', label: 'Animals', icon: PawPrint },
      { to: '/feeding-points', label: 'Feeding Points', icon: MapPin },
      { to: '/volunteer', label: 'My Tasks', icon: ClipboardList },
      { to: '/health', label: 'Health Records', icon: Stethoscope },
      { to: '/needs', label: 'Needs', icon: Heart },
    ],
    'Admin': [
      { to: '/', label: 'Home', icon: Home },
      { to: '/animals', label: 'Animals', icon: PawPrint },
      { to: '/admin', label: 'Admin Panel', icon: Shield },
      { to: '/volunteer', label: 'Volunteer Panel', icon: ClipboardList },
      { to: '/feeding-points', label: 'Feeding Points', icon: MapPin },
      { to: '/needs', label: 'Needs', icon: Heart },
      { to: '/donations', label: 'Donations', icon: Gift },
    ],
  };

  const links = isLoggedIn ? (roleLinks[user?.role] || guestLinks) : guestLinks;
  const isActive = (path) => loc.pathname === path ? 'text-accent font-semibold' : 'text-slate-600 hover:text-accent';

  return (
    <nav className="bg-white shadow-sm border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
            <PawPrint className="h-8 w-8 text-accent" />
            <span className="font-bold text-xl text-accent-dark">PatiLink</span>
          </Link>

          {/* Desktop */}
          <div className="hidden md:flex items-center space-x-6">
            {links.map(l => <Link key={l.to} to={l.to} className={`font-medium text-sm transition-colors ${isActive(l.to)}`}>{l.label}</Link>)}
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-1 text-slate-700 font-medium text-sm"><User className="h-4 w-4 text-accent" />{user.fullName} <span className="text-xs text-slate-400">({user.role})</span></div>
                <button onClick={handleLogout} className="flex items-center gap-1 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition-colors text-sm"><LogOut className="h-4 w-4" />Logout</button>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-accent"><LogIn className="h-4 w-4" />Login</Link>
                <Link to="/register" className="bg-accent text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-dark transition-colors">Register</Link>
              </div>
            )}
            {/* Mobile toggle */}
            <button onClick={() => setOpen(!open)} className="md:hidden p-2 rounded-lg hover:bg-slate-100">
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white animate-slide-down">
          <div className="px-4 py-3 space-y-1">
            {links.map(l => { const Icon = l.icon; return <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${loc.pathname === l.to ? 'bg-accent-soft text-accent-dark' : 'text-slate-600 hover:bg-slate-50'}`}><Icon className="h-4 w-4" />{l.label}</Link>; })}
            <div className="border-t border-slate-100 pt-2 mt-2">
              {isLoggedIn ? (
                <>
                  <div className="px-3 py-2 text-sm text-slate-500"><User className="inline h-4 w-4 mr-1" />{user.fullName} ({user.role})</div>
                  <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" />Logout</button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"><LogIn className="h-4 w-4" />Login</Link>
                  <Link to="/register" onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-accent hover:bg-accent-soft">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
