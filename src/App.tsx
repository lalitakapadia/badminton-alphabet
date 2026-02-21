import React, { useState, useEffect } from 'react';
import { 
  ChevronDown,
} from 'lucide-react';
import { User, Stage, Skill, Progress } from './types';
import { Button } from './components/Button';
import { LandingPage } from './components/landing/LandingPage';
import { AuthView } from './components/auth/AuthView';
import { Navigation } from './components/Navigation';
import { StudentManagement } from './components/dashboard/StudentManagement';
import { ProgressOverview } from './components/dashboard/ProgressOverview';
import { MobileBottomNav } from './components/MobileBottomNav';

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard'>('landing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Data state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [userProgress, setUserProgress] = useState<Progress[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Search, Sort, Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc'>('name_asc');
  const [filterStage, setFilterStage] = useState<number | 'all'>('all');

  useEffect(() => {
    const savedUser = localStorage.getItem('badminton_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setView('dashboard');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedUser]);

  const fetchData = async () => {
    try {
      const [stagesRes, usersRes] = await Promise.all([
        fetch('/api/stages'),
        user?.role === 'admin' ? fetch('/api/users') : Promise.resolve(null)
      ]);

      const stagesData = await stagesRes.json();
      setStages(stagesData.stages);
      setSkills(stagesData.skills);

      if (usersRes) {
        const usersData = await usersRes.json();
        setAllUsers(usersData);
      }

      // Fetch progress for the appropriate user
      // If admin has a selected user, fetch their progress. Otherwise fetch current user's progress.
      const targetUserId = (user?.role === 'admin') 
        ? (selectedUser ? selectedUser.id : null) 
        : user?.id;
      
      if (targetUserId) {
        const progressRes = await fetch(`/api/progress/${targetUserId}`);
        const progressData = await progressRes.json();
        setUserProgress(progressData);
      } else if (user?.role === 'admin' && !selectedUser) {
        setUserProgress([]);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Invalid credentials');
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem('badminton_user', JSON.stringify(userData));
      setView('dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Registration failed');
      const userData = await res.json();
      setUser(userData);
      localStorage.setItem('badminton_user', JSON.stringify(userData));
      setView('dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('badminton_user');
    setView('landing');
    setIsMenuOpen(false);
  };

  const updateProgress = async (userId: number, skillId: number, status: string) => {
    try {
      await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, skillId, status })
      });
      fetchData();
    } catch (err) {
      console.error("Failed to update progress", err);
    }
  };

  const updateStage = async (userId: number, stageId: number) => {
    try {
      await fetch(`/api/users/${userId}/stage`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stageId })
      });
      fetchData();
      if (selectedUser?.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, current_stage_id: stageId } : null);
      }
    } catch (err) {
      console.error("Failed to update stage", err);
    }
  };

  // --- Views ---

  if (view === 'landing') {
    return <LandingPage onStart={() => setView('register')} onSignIn={() => setView('login')} />;
  }

  if (view === 'login' || view === 'register') {
    return (
      <AuthView 
        view={view} 
        setView={setView} 
        onSubmit={view === 'login' ? handleLogin : handleRegister} 
        loading={loading} 
        error={error} 
      />
    );
  }

  const currentStage = stages.find(s => s.id === (selectedUser?.current_stage_id || user?.current_stage_id));
  const stageSkills = skills.filter(s => s.stage_id === currentStage?.id);

  // Progress Calculation
  const calculateProgress = (skillsInStage: Skill[]) => {
    if (skillsInStage.length === 0) return 0;
    
    const relevantProgress = userProgress.filter(p => skillsInStage.some(s => s.id === p.skill_id));
    
    const totalPossiblePoints = skillsInStage.length * 5;
    let currentPoints = 0;
    
    relevantProgress.forEach(p => {
      if (p.status === 'level_1') currentPoints += 1;
      else if (p.status === 'level_2') currentPoints += 2;
      else if (p.status === 'level_3') currentPoints += 3;
      else if (p.status === 'level_4') currentPoints += 4;
      else if (p.status === 'level_5') currentPoints += 5;
    });

    return Math.round((currentPoints / totalPossiblePoints) * 100);
  };

  const overallProgress = calculateProgress(stageSkills);

  // Filtered and Sorted Users
  const filteredUsers = allUsers
    .filter(u => u.role !== 'admin')
    .filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStage === 'all' || u.current_stage_id === filterStage;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
      return 0;
    });

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 md:pb-0">
      <Navigation 
        user={user} 
        view={view} 
        setView={setView} 
        isMenuOpen={isMenuOpen} 
        setIsMenuOpen={setIsMenuOpen} 
        handleLogout={handleLogout} 
      />

      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {user?.role === 'admin' && (
            <StudentManagement 
              filteredUsers={filteredUsers}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              sortBy={sortBy}
              setSortBy={setSortBy}
              filterStage={filterStage}
              setFilterStage={setFilterStage}
              stages={stages}
            />
          )}

          <div className={`${user?.role === 'admin' ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-8`}>
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {user?.role === 'admin' ? (selectedUser ? `${selectedUser.name}'s Progress` : 'Select a student') : 'My Progress'}
                </h2>
                <p className="text-slate-500">Badminton Alphabet Tracking System</p>
              </div>
              
              {user?.role === 'admin' && selectedUser && (
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <select 
                      value={selectedUser.current_stage_id}
                      onChange={(e) => updateStage(selectedUser.id, parseInt(e.target.value))}
                      className="appearance-none bg-white border border-slate-200 px-4 py-2 pr-10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                    >
                      {stages.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                  </div>
                </div>
              )}
            </div>

            <ProgressOverview 
              currentStage={currentStage || null}
              stageSkills={stageSkills}
              userProgress={userProgress}
              overallProgress={overallProgress}
              user={user}
              selectedUser={selectedUser}
              onUpdateProgress={updateProgress}
            />
          </div>
        </div>
      </main>

      <MobileBottomNav 
        user={user}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        setIsMenuOpen={setIsMenuOpen}
        handleLogout={handleLogout}
      />
    </div>
  );
}
