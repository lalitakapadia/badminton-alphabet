import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, User as UserIcon, LogOut, Menu, X, Award, Shield } from 'lucide-react';
import { Button } from './Button';
import { User } from '../types';

interface NavigationProps {
  user: User | null;
  view: string;
  setView: (view: any) => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (open: boolean) => void;
  handleLogout: () => void;
}

export const Navigation = ({
  user,
  view,
  setView,
  isMenuOpen,
  setIsMenuOpen,
  handleLogout
}: NavigationProps) => {
  return (
    <>
      <nav className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => setView('landing')}
              className="flex items-center gap-2 group"
            >
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white group-hover:bg-emerald-500 transition-colors">
                <Trophy size={18} />
              </div>
              <span className="font-bold text-slate-900 hidden sm:block group-hover:text-emerald-600 transition-colors">Badminton Alphabet</span>
            </button>
            <button 
              onClick={() => setView('landing')}
              className="hidden md:flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-emerald-600 transition-colors uppercase tracking-widest"
            >
              Program Info
            </button>
            {user?.role === 'admin' && (
              <button 
                onClick={() => setView('admin')}
                className={`hidden md:flex items-center gap-1.5 text-sm font-bold transition-colors uppercase tracking-widest ${view === 'admin' ? 'text-emerald-600' : 'text-slate-500 hover:text-emerald-600'}`}
              >
                Admin Panel
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-sm font-medium text-slate-600 mr-4">
              <UserIcon size={16} />
              {user?.name}
              <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px] uppercase tracking-wider">
                {user?.role}
              </span>
            </div>
            <Button variant="ghost" onClick={handleLogout} className="hidden md:flex items-center gap-2">
              <LogOut size={18} />
              Logout
            </Button>
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-slate-600"
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-100 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <button 
                onClick={() => {
                  setView('landing');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 p-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
              >
                <Award size={20} />
                Program Info
              </button>
              {user?.role === 'admin' && (
                <button 
                  onClick={() => {
                    setView('admin');
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-slate-600 font-medium hover:bg-slate-50 rounded-xl transition-colors"
                >
                  <Shield size={20} />
                  Admin Panel
                </button>
              )}
              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center">
                  <UserIcon size={20} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{user?.name}</p>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">{user?.role}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-3 text-rose-600 font-medium hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
