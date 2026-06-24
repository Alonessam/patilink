import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PawPrint, UserPlus, Lock, Mail, User, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); setLoading(false); return; }
    if (form.password.length < 3) { setError('Password must be at least 3 characters long.'); setLoading(false); return; }
    try {
      await register({ fullName: form.fullName, email: form.email, password: form.password, phone: form.phone });
      setSuccess('Registration successful! Redirecting to login page...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) { setError(err.response?.data?.message || 'Registration failed.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6 animate-fade-in">
        <div className="text-center">
          <PawPrint className="h-10 w-10 text-accent mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-slate-900">Join Us</h1>
          <p className="text-sm text-slate-500 mt-1">Support our stray friends by registering on PatiLink</p>
        </div>
        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2 text-sm"><AlertCircle className="w-5 h-5 shrink-0" />{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-2 text-sm"><CheckCircle2 className="w-5 h-5 shrink-0" />{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative"><User className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /><input type="text" placeholder="Full Name" className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" required value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} /></div>
          <div className="relative"><Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /><input type="email" placeholder="Email" className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" required value={form.email} onChange={e => setForm({...form, email: e.target.value.trim()})} /></div>
          <div className="relative"><Phone className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /><input type="tel" placeholder="Phone (optional)" className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
          <div className="relative"><Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /><input type="password" placeholder="Password" className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
          <div className="relative"><Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /><input type="password" placeholder="Confirm Password" className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent outline-none" required value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} /></div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><UserPlus className="w-5 h-5" />{loading ? 'Registering...' : 'Register'}</button>
        </form>
        <div className="text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="text-accent font-medium hover:underline">Login</Link></div>
      </div>
    </div>
  );
}
