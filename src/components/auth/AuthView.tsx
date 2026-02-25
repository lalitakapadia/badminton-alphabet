import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, ChevronRight, Mail, Building2, ClipboardList, UserPlus } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Card } from '../Card';

interface AuthViewProps {
  view: 'login' | 'register';
  setView: (view: 'login' | 'register' | 'landing') => void;
  onSubmit: (e: React.FormEvent) => void;
  onOAuth: (provider: 'google' | 'facebook') => void;
  onMagicLink: (email: string) => void;
  loading: boolean;
  error: string;
  invitationToken?: string;
  invitationData?: any;
  syncing?: boolean;
}

export const AuthView = ({ 
  view, 
  setView, 
  onSubmit, 
  onOAuth, 
  onMagicLink, 
  loading, 
  error,
  invitationToken,
  invitationData,
  syncing
}: AuthViewProps) => {
  const [email, setEmail] = useState('');
  const [regType, setRegType] = useState<'coach' | 'player'>(invitationToken ? 'player' : 'coach');

  useEffect(() => {
    if (invitationData?.email) {
      setEmail(invitationData.email);
    }
  }, [invitationData]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-600 rounded-2xl text-white mb-4 shadow-lg shadow-emerald-200">
            <Trophy size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Badminton Alphabet</h1>
          <p className="text-slate-500">Track your journey to mastery</p>
        </div>

        <Card className="p-8">
          {view === 'register' && !invitationToken && (
            <div className="flex p-1 bg-slate-100 rounded-xl mb-8">
              <button
                onClick={() => setRegType('coach')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${regType === 'coach' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Coach
              </button>
              <button
                onClick={() => setRegType('player')}
                className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${regType === 'player' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Player
              </button>
            </div>
          )}

          {invitationToken && invitationData && (
            <div className="mb-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-start gap-3">
              <UserPlus className="text-emerald-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold text-emerald-900">You've been invited!</p>
                <p className="text-xs text-emerald-700">By {invitationData.coach?.name}</p>
              </div>
            </div>
          )}

          {view === 'register' && regType === 'player' && !invitationToken && (
            <div className="mb-8 p-4 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-3">
              <ClipboardList className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-sm font-bold text-amber-900">Invitation Required</p>
                <p className="text-xs text-amber-700">Players can only join via an invitation from their coach. Please check your email for an invite link.</p>
              </div>
            </div>
          )}

          {syncing && (
            <div className="mb-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-center gap-3 animate-pulse">
              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm font-bold text-emerald-900">Syncing your account...</p>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-6">
            <input type="hidden" name="role" value={regType} />
            {invitationToken && <input type="hidden" name="invitation_token" value={invitationToken} />}

            {view === 'register' && (regType === 'coach' || invitationToken) && (
              <>
                <Input label="Full Name" name="name" placeholder="John Doe" required />
              </>
            )}

            <Input 
              label="Email Address" 
              name="email" 
              type="email" 
              placeholder="john@example.com" 
              required 
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              disabled={!!invitationToken}
            />
            
            {(view === 'login' || regType === 'coach' || invitationToken) && (
              <Input label="Password" name="password" type="password" placeholder="••••••••" required />
            )}
            
            {error && <p className="text-rose-500 text-sm text-center font-medium">{error}</p>}

            <div className="space-y-3">
              {(view === 'login' || regType === 'coach' || invitationToken) && (
                <Button type="submit" className="w-full py-3" disabled={loading}>
                  {loading ? 'Processing...' : view === 'login' ? 'Sign In' : 'Create Account'}
                </Button>
              )}
              
              {view === 'login' && (
                <button
                  type="button"
                  onClick={() => onMagicLink(email)}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                >
                  <Mail size={18} />
                  Send Magic Link
                </button>
              )}
            </div>
          </form>

          {view === 'login' && (
            <>
              <div className="mt-8 relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-bold tracking-widest">Or continue with</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <button
                  onClick={() => onOAuth('google')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all font-bold text-sm text-slate-700"
                >
                  Google
                </button>
                <button
                  onClick={() => onOAuth('facebook')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 hover:bg-slate-50 transition-all font-bold text-sm text-slate-700"
                >
                  Facebook
                </button>
              </div>
            </>
          )}

          <div className="mt-8 text-center space-y-4">
            <button 
              onClick={() => setView(view === 'login' ? 'register' : 'login')}
              className="text-sm text-emerald-600 font-semibold hover:underline block w-full"
            >
              {view === 'login' ? "Don't have an account? Register" : "Already have an account? Sign In"}
            </button>
            <button 
              onClick={() => setView('landing')}
              className="text-sm text-slate-400 font-medium hover:text-slate-600 flex items-center justify-center gap-1 mx-auto"
            >
              <ChevronRight size={14} className="rotate-180" />
              Back to Home
            </button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
