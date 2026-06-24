import React from 'react';
import { Link } from 'react-router-dom';
import { PawPrint, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PawPrint className="h-6 w-6 text-accent" />
              <span className="font-bold text-xl text-white">PatiLink</span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              A social benefit coordination system that digitalizes the care processes of stray campus animals.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Quick Links</h3>
            <div className="space-y-2 text-sm">
              <Link to="/animals" className="block hover:text-accent transition-colors">Animals</Link>
              <Link to="/needs" className="block hover:text-accent transition-colors">Needs</Link>
              <Link to="/feeding-points" className="block hover:text-accent transition-colors">Feeding Points</Link>
              <Link to="/contact" className="block hover:text-accent transition-colors">Contact</Link>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-3">Project Info</h3>
            <p className="text-sm text-slate-400">Internet Programming Course Project</p>
            <p className="text-sm text-slate-400">Samet Furkan Buluc — 02230201058</p>
            <p className="text-sm text-slate-400 mt-2 flex items-center gap-1"><Heart className="w-3 h-3 text-red-400" /> Developed for campus stray animals.</p>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-8 pt-6 text-center text-xs text-slate-500">© 2026 PatiLink. All rights reserved.</div>
      </div>
    </footer>
  );
}
