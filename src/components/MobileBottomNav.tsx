import React from 'react';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { User } from '../types';

interface MobileBottomNavProps {
  user: User | null;
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  setIsMenuOpen: (open: boolean) => void;
  handleLogout: () => void;
}

export const MobileBottomNav = ({
  user,
  selectedUser,
  setSelectedUser,
  setIsMenuOpen,
  handleLogout
}: MobileBottomNavProps) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 h-16 flex items-center justify-around px-6 z-30">
      <button 
        onClick={() => setSelectedUser(null)}
        className={`flex flex-col items-center gap-1 ${!selectedUser ? 'text-emerald-600' : 'text-slate-400'}`}
      >
        <LayoutDashboard size={20} />
        <span className="text-[10px] font-bold uppercase">Overview</span>
      </button>
      {user?.role === 'admin' && (
        <button 
          onClick={() => setIsMenuOpen(true)}
          className={`flex flex-col items-center gap-1 text-slate-400`}
        >
          <Users size={20} />
          <span className="text-[10px] font-bold uppercase">Students</span>
        </button>
      )}
      <button 
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 text-slate-400"
      >
        <LogOut size={20} />
        <span className="text-[10px] font-bold uppercase">Exit</span>
      </button>
    </div>
  );
};
