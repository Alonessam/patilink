import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user?.role))
    return <div className="max-w-xl mx-auto mt-16 p-8 bg-red-50 border border-red-200 rounded-2xl text-center animate-fade-in"><p className="text-red-700 font-semibold text-lg">You do not have permission to access this page.</p><p className="text-red-500 text-sm mt-2">This area is restricted to authorized users.</p></div>;
  return children;
}
