import React from 'react';
import { motion } from 'motion/react';
import { Trophy, ChevronRight } from 'lucide-react';
import { Button } from '../Button';
import { Input } from '../Input';
import { Card } from '../Card';

interface AuthViewProps {
  view: 'login' | 'register';
  setView: (view: 'login' | 'register' | 'landing') => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string;
}

export const AuthView = ({ view, setView, onSubmit, loading, error }: AuthViewProps) => {
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
          <form onSubmit={onSubmit} className="space-y-6">
            {view === 'register' && (
              <Input label="Full Name" name="name" placeholder="John Doe" required />
            )}
            <Input label="Email Address" name="email" type="email" placeholder="john@example.com" required />
            <Input label="Password" name="password" type="password" placeholder="••••••••" required />
            
            {error && <p className="text-rose-500 text-sm text-center font-medium">{error}</p>}

            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? 'Processing...' : view === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-4">
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
