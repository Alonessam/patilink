import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Animals from './pages/Animals';
import AnimalDetail from './pages/AnimalDetail';
import AdminPanel from './pages/AdminPanel';
import VolunteerPanel from './pages/VolunteerPanel';
import Needs from './pages/Needs';
import HealthLogs from './pages/HealthLogs';
import Login from './pages/Login';
import Register from './pages/Register';
import Contact from './pages/Contact';
import FeedingPoints from './pages/FeedingPoints';
import Donations from './pages/Donations';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/animals" element={<Animals />} />
            <Route path="/animals/:id" element={<AnimalDetail />} />
            <Route path="/needs" element={<Needs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/feeding-points" element={<FeedingPoints />} />
            <Route path="/donations" element={<Donations />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminPanel /></ProtectedRoute>} />
            <Route path="/volunteer" element={<ProtectedRoute allowedRoles={['Volunteer', 'Vet', 'Admin']}><VolunteerPanel /></ProtectedRoute>} />
            <Route path="/health" element={<ProtectedRoute allowedRoles={['Vet']}><HealthLogs /></ProtectedRoute>} />
            <Route path="*" element={<div className="p-16 text-center"><p className="text-6xl mb-4">🐾</p><p className="text-2xl font-bold text-slate-900">404 — Page Not Found</p></div>} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
