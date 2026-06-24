import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PawPrint, LogIn, Lock, Mail, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      const data = await login(form.email, form.password);
      setSuccess(`Welcome, ${data.user.fullName}!`);
      setTimeout(() => navigate('/'), 800);
    } catch (err) { setError(err.response?.data?.message || 'Login failed.'); }
    setLoading(false);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-6 animate-fade-in">
        <div className="text-center">
          <PawPrint className="h-10 w-10 text-accent mx-auto mb-2" />
          <h1 className="text-2xl font-bold text-slate-900">Welcome Back</h1>
          <p className="text-sm text-slate-500 mt-1">Log in to your PatiLink account</p>
        </div>
        {error && <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2 text-sm"><AlertCircle className="w-5 h-5 shrink-0" />{error}</div>}
        {success && <div className="bg-green-50 text-green-700 p-4 rounded-xl flex items-center gap-2 text-sm"><CheckCircle2 className="w-5 h-5 shrink-0" />{success}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Email</label>
            <div className="relative"><Mail className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /><input type="email" placeholder="example@patilink.edu.tr" className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none" required value={form.email} onChange={e => setForm({...form, email: e.target.value.trim()})} /></div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <div className="relative"><Lock className="absolute left-3 top-3.5 h-5 w-5 text-slate-400" /><input type="password" placeholder="••••••••" className="w-full pl-10 p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} /></div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-3 bg-accent hover:bg-accent-dark text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"><LogIn className="w-5 h-5" />{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <div className="text-center text-sm text-slate-500">Don't have an account? <Link to="/register" className="text-accent font-medium hover:underline">Register</Link></div>
        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 text-center">Demo: admin@patilink.edu.tr / vet@patilink.edu.tr / gonullu@patilink.edu.tr (Password: 123)</div>
      </div>
    </div>
  );
}
