import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Settings, 
  Layers, 
  Trophy, 
  Plus, 
  Trash2, 
  Edit2, 
  Save, 
  X,
  ChevronRight,
  Shield,
  Check,
  AlertCircle
} from 'lucide-react';
import { User, Stage, Skill } from '../../types';
import { Button } from '../Button';
import { Input } from '../Input';
import { Card } from '../Card';

interface AdminPanelProps {
  stages: Stage[];
  skills: Skill[];
  onRefresh: () => void;
}

export const AdminPanel = ({ stages, skills, onRefresh }: AdminPanelProps) => {
  const [activeTab, setActiveTab] = useState<'users' | 'stages' | 'skills' | 'benchmarks'>('users');
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [newStage, setNewStage] = useState({ name: '', description: '' });
  const [newSkill, setNewSkill] = useState({ name: '', description: '', stage_id: stages[0]?.id || 1 });

  const handleAddStage = async () => {
    try {
      const res = await fetch('/api/admin/stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStage)
      });
      if (res.ok) {
        onRefresh();
        setNewStage({ name: '', description: '' });
      }
    } catch (err) {
      console.error('Error adding stage:', err);
    }
  };

  const handleDeleteStage = async (id: number) => {
    if (!confirm('Are you sure? This will delete the stage.')) return;
    try {
      const res = await fetch(`/api/admin/stages/${id}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error('Error deleting stage:', err);
    }
  };

  const handleDeleteSkill = async (id: number) => {
    if (!confirm('Are you sure? This will delete the skill.')) return;
    try {
      const res = await fetch(`/api/admin/skills/${id}`, { method: 'DELETE' });
      if (res.ok) onRefresh();
    } catch (err) {
      console.error('Error deleting skill:', err);
    }
  };

  const handleAddSkill = async () => {
    try {
      const res = await fetch('/api/admin/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSkill)
      });
      if (res.ok) {
        onRefresh();
        setNewSkill({ name: '', description: '', stage_id: stages[0]?.id || 1 });
      }
    } catch (err) {
      console.error('Error adding skill:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      setAllUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: number, updates: Partial<User>) => {
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (res.ok) {
        fetchUsers();
        setEditingItem(null);
      }
    } catch (err) {
      console.error('Error updating user:', err);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) fetchUsers();
    } catch (err) {
      console.error('Error deleting user:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight">Administration</h2>
          <p className="text-slate-500">Manage system users, rubric, and benchmarks</p>
        </div>
      </div>

      <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
        {[
          { id: 'users', label: 'Users', icon: <Users size={16} /> },
          { id: 'stages', label: 'Stages', icon: <Layers size={16} /> },
          { id: 'skills', label: 'Skills', icon: <Settings size={16} /> },
          { id: 'benchmarks', label: 'Benchmarks', icon: <Trophy size={16} /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <Card className="p-0 border-slate-100 shadow-sm overflow-visible">
        {activeTab === 'users' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Name</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {allUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-900">{u.name}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-500">{u.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={u.role}
                        onChange={(e) => updateUser(u.id, { role: e.target.value as any })}
                        className="bg-transparent text-sm font-bold text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="player">Player</option>
                        <option value="coach">Coach</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => deleteUser(u.id)}
                          className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'stages' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-emerald-600" />
                Add New Stage
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  placeholder="Stage Name (e.g. Stage 1: Foundation)" 
                  value={newStage.name}
                  onChange={(e: any) => setNewStage({ ...newStage, name: e.target.value })}
                />
                <Input 
                  placeholder="Description" 
                  value={newStage.description}
                  onChange={(e: any) => setNewStage({ ...newStage, description: e.target.value })}
                />
              </div>
              <Button onClick={handleAddStage} disabled={!newStage.name}>Create Stage</Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {stages.map(s => (
                <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <p className="text-xs text-slate-500">{s.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteStage(s.id)}
                      className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="p-6 space-y-6">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-emerald-600" />
                Add New Skill
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  placeholder="Skill Name" 
                  value={newSkill.name}
                  onChange={(e: any) => setNewSkill({ ...newSkill, name: e.target.value })}
                />
                <select 
                  value={newSkill.stage_id}
                  onChange={(e) => setNewSkill({ ...newSkill, stage_id: parseInt(e.target.value) })}
                  className="w-full bg-white border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {stages.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <div className="md:col-span-2">
                  <Input 
                    placeholder="Description" 
                    value={newSkill.description}
                    onChange={(e: any) => setNewSkill({ ...newSkill, description: e.target.value })}
                  />
                </div>
              </div>
              <Button onClick={handleAddSkill} disabled={!newSkill.name}>Create Skill</Button>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {skills.map(s => (
                <div key={s.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-900">{s.name}</p>
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteSkill(s.id)}
                        className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">{s.description}</p>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                      Stage {s.stage_id}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'benchmarks' && (
          <div className="p-6 text-center py-12">
            <AlertCircle className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-medium">Benchmark management coming soon.</p>
            <p className="text-xs text-slate-400 mt-1">Currently managed via system constants.</p>
          </div>
        )}
      </Card>
    </div>
  );
};
