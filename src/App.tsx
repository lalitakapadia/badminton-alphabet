import React, { useState, useEffect } from 'react';
import { 
  ChevronDown,
  ClipboardList
} from 'lucide-react';
import { User, Stage, Skill, Progress } from './types';
import { supabase } from './lib/supabase';
import { Button } from './components/Button';
import { LandingPage } from './components/landing/LandingPage';
import { AuthView } from './components/auth/AuthView';
import { Navigation } from './components/Navigation';
import { StudentManagement } from './components/dashboard/StudentManagement';
import { ProgressOverview } from './components/dashboard/ProgressOverview';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminPanel } from './components/dashboard/AdminPanel';

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'login' | 'register' | 'dashboard' | 'admin'>('landing');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Invitation state
  const [invitationToken, setInvitationToken] = useState<string | undefined>();
  const [invitationData, setInvitationData] = useState<any>(null);

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
    // Check for invitation token in URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (token) {
      setInvitationToken(token);
      fetchInvitationData(token);
      setView('register');
    }

    const savedUser = localStorage.getItem('badminton_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setView('dashboard');
    }

    // Listen for OAuth success messages from the popup
    const handleMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        checkSupabaseSession();
      }
    };
    window.addEventListener('message', handleMessage);

    // Supabase Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await syncUserWithBackend(session.user, session.access_token);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('badminton_user');
        setView('landing');
      }
    });

    // Initial session check
    checkSupabaseSession();

    return () => {
      window.removeEventListener('message', handleMessage);
      subscription.unsubscribe();
    };
  }, []);

  const checkSupabaseSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await syncUserWithBackend(session.user, session.access_token);
    }
  };

  const fetchInvitationData = async (token: string) => {
    try {
      const res = await fetch(`/api/invitations/${token}`);
      if (res.ok) {
        const data = await res.json();
        setInvitationData(data);
      }
    } catch (err) {
      console.error('Error fetching invitation:', err);
    }
  };

  const syncUserWithBackend = async (supabaseUser: any, accessToken?: string, extraData: any = {}) => {
    try {
      const res = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supabase_uid: supabaseUser.id,
          email: supabaseUser.email,
          name: supabaseUser.user_metadata?.full_name || supabaseUser.email?.split('@')[0],
          access_token: accessToken,
          ...extraData
        })
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
        localStorage.setItem('badminton_user', JSON.stringify(userData));
        setView('dashboard');
        // Clear invitation from URL
        if (window.location.search.includes('token=')) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } else {
        const errData = await res.json();
        setError(errData.error || 'Sync failed');
      }
    } catch (err) {
      console.error('Error syncing user:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, selectedUser]);

  const fetchData = async () => {
    try {
      const [stagesRes, usersRes] = await Promise.all([
        fetch('/api/stages'),
        (user?.role === 'admin' || user?.role === 'coach') ? fetch('/api/users') : Promise.resolve(null)
      ]);

      const stagesData = await stagesRes.json();
      setStages(stagesData.stages);
      setSkills(stagesData.skills);

      if (usersRes) {
        const usersData = await usersRes.json();
        setAllUsers(usersData);
      }

      // Fetch progress for the appropriate user
      const targetUserId = (user?.role === 'admin' || user?.role === 'coach') 
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
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (data.user) {
        await syncUserWithBackend(data.user, data.session?.access_token);
      }
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
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const name = formData.get('name') as string;
    const role = formData.get('role') as string;
    const invitation_token = formData.get('invitation_token') as string;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: name,
            role
          }
        }
      });

      if (error) throw error;
      if (data.user) {
        if (data.session) {
          await syncUserWithBackend(data.user, data.session.access_token, {
            role,
            invitation_token
          });
        } else {
          setError('Check your email for the confirmation link!');
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    try {
      const res = await fetch(`/api/auth/url?provider=${provider}`);
      if (!res.ok) throw new Error('Failed to get auth URL');
      const { url } = await res.json();

      window.open(url, 'oauth_popup', 'width=600,height=700');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleMagicLink = async (email: string) => {
    if (!email) {
      setError('Please enter your email first');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });
      if (error) throw error;
      setError('Magic link sent! Check your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
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

  const invitePlayer = async (email: string) => {
    if (!user) return;
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, coachId: user.id })
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Invitation link generated: ${window.location.origin}/?token=${data.token}`);
      }
    } catch (err) {
      console.error('Error inviting player:', err);
    }
  };

  // --- Views ---

  if (view === 'landing') {
    return (
      <LandingPage 
        user={user} 
        onStart={() => user ? setView('dashboard') : setView('register')} 
        onSignIn={() => user ? setView('dashboard') : setView('login')} 
      />
    );
  }

  if (view === 'login' || view === 'register') {
    return (
      <AuthView 
        view={view} 
        setView={setView} 
        onSubmit={view === 'login' ? handleLogin : handleRegister} 
        onOAuth={handleOAuth}
        onMagicLink={handleMagicLink}
        loading={loading} 
        error={error} 
        invitationToken={invitationToken}
        invitationData={invitationData}
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
    .filter(u => u.role === 'player')
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

  if (view === 'admin' && user?.role === 'admin') {
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
          <AdminPanel stages={stages} skills={skills} onRefresh={fetchData} />
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
          
          {(user?.role === 'admin' || user?.role === 'coach') && (
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
              onInvite={invitePlayer}
              isCoach={user?.role === 'coach'}
            />
          )}

          <div className={`${(user?.role === 'admin' || user?.role === 'coach') ? 'lg:col-span-8' : 'lg:col-span-12'} space-y-8`}>
            
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {(user?.role === 'admin' || user?.role === 'coach') ? (selectedUser ? `${selectedUser.name}'s Progress` : 'Select a student') : 'My Progress'}
                </h2>
                <p className="text-slate-500">Badminton Alphabet Tracking System</p>
              </div>
              
              {(user?.role === 'admin' || user?.role === 'coach') && selectedUser && (
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
