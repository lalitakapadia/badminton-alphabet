import React, { useState } from 'react';
import { Users, ChevronRight, UserPlus, Check, X, Mail } from 'lucide-react';
import { User, Stage } from '../../types';
import { Button } from '../Button';
import { Input } from '../Input';

interface StudentManagementProps {
  filteredUsers: User[];
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  sortBy: 'name_asc' | 'name_desc';
  setSortBy: (sort: 'name_asc' | 'name_desc') => void;
  filterStage: number | 'all';
  setFilterStage: (stage: number | 'all') => void;
  stages: Stage[];
  onInvite?: (email: string) => void;
  isCoach?: boolean;
}

export const StudentManagement = ({
  filteredUsers,
  selectedUser,
  setSelectedUser,
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  filterStage,
  setFilterStage,
  stages,
  onInvite,
  isCoach
}: StudentManagementProps) => {
  const [inviteEmail, setInviteEmail] = useState('');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail && onInvite) {
      onInvite(inviteEmail);
      setInviteEmail('');
    }
  };

  return (
    <div className="lg:col-span-4 space-y-6">
      {isCoach && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <UserPlus size={20} className="text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900">Invite Player</h2>
          </div>
          <form onSubmit={handleInvite} className="flex gap-2">
            <div className="flex-1">
              <Input 
                placeholder="Parent's email" 
                value={inviteEmail}
                onChange={(e: any) => setInviteEmail(e.target.value)}
                type="email"
                required
                className="py-2"
              />
            </div>
            <Button type="submit" className="px-4">Invite</Button>
          </form>
          <p className="text-[10px] text-slate-400">An invitation link will be generated for you to share with the parent.</p>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Users size={20} className="text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-900">Student Management</h2>
        </div>
        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-md">
          {filteredUsers.length} Students
        </span>
      </div>

      {/* Search, Sort, Filter Controls */}
      <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative">
          <input 
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
          <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select 
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="name_asc">Name (A-Z)</option>
            <option value="name_desc">Name (Z-A)</option>
          </select>

          <select 
            value={filterStage}
            onChange={(e: any) => setFilterStage(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
            className="bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Stages</option>
            {stages.map(s => (
              <option key={s.id} value={s.id}>{s.name.split(':')[0]}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {filteredUsers.map(u => (
          <button
            key={u.id}
            onClick={() => {
              setSelectedUser(u);
            }}
            className={`w-full text-left p-4 rounded-2xl border transition-all ${
              selectedUser?.id === u.id 
                ? 'bg-emerald-50 border-emerald-200 shadow-sm' 
                : 'bg-white border-slate-100 hover:border-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900">{u.name}</p>
                <p className="text-xs text-slate-500">{u.email}</p>
              </div>
              <ChevronRight size={16} className={selectedUser?.id === u.id ? 'text-emerald-500' : 'text-slate-300'} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                {stages.find(s => s.id === u.current_stage_id)?.name.split(':')[0]}
              </span>
            </div>
          </button>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center py-8 bg-white rounded-2xl border border-dashed border-slate-200">
            <p className="text-slate-400 text-sm">No students found</p>
          </div>
        )}
      </div>
    </div>
  );
};
