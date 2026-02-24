import React from 'react';
import { motion } from 'motion/react';
import { Trophy, ChevronDown, Award, CheckCircle2, Settings, Users, UserPlus, ShieldCheck } from 'lucide-react';
import { User } from '../../types';
import { Button } from '../Button';
import { Card } from '../Card';
import { STAGE_BENCHMARKS } from '../../constants/benchmarks';

interface LandingPageProps {
  user: User | null;
  onStart: () => void;
  onSignIn: () => void;
}

export const LandingPage = ({ user, onStart, onSignIn }: LandingPageProps) => {
  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Hero Section */}
      <header className="relative h-[90vh] flex items-center justify-center overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 z-0 opacity-30">
          <img 
            src="https://picsum.photos/seed/badminton/1920/1080?blur=2" 
            alt="Badminton background" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-6 text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full text-emerald-400 text-sm font-bold uppercase tracking-widest"
          >
            <Trophy size={16} />
            The Gold Standard of Training
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9]"
          >
            MASTER THE <br />
            <span className="text-emerald-500">BADMINTON ALPHABET</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto font-medium"
          >
            A comprehensive 26-point technical framework designed to take players from foundation to elite mastery.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            {user ? (
              <Button onClick={() => onSignIn()} className="px-8 py-4 text-lg bg-emerald-600 hover:bg-emerald-500">
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Button onClick={onStart} className="px-8 py-4 text-lg bg-emerald-600 hover:bg-emerald-500">
                  Register as Coach
                </Button>
                <Button onClick={onSignIn} variant="secondary" className="px-8 py-4 text-lg bg-white/10 border-white/20 text-white hover:bg-white/20">
                  Sign In to Dashboard
                </Button>
              </>
            )}
          </motion.div>
          <p className="text-slate-400 text-sm font-medium">Players: Join via invitation from your coach</p>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <ChevronDown size={32} />
        </div>
      </header>

      {/* Roles Section */}
      <section className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">Our Ecosystem</h2>
            <p className="text-slate-500 max-w-2xl mx-auto">A structured environment for coaches, parents, and players to collaborate on mastery.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { 
                title: 'Coaches', 
                desc: 'Register with an affiliated club and program. Manage your roster, invite players, and track technical growth.',
                icon: <Users className="text-emerald-600" />,
                action: 'Register & Create Program'
              },
              { 
                title: 'Parents & Players', 
                desc: 'Join via exclusive invitation. Track progress through the 26-letter rubric and celebrate every milestone.',
                icon: <UserPlus className="text-emerald-600" />,
                action: 'Invitation Only'
              },
              { 
                title: 'Administrators', 
                desc: 'Oversee program quality, approve coach registrations, and maintain the integrity of the Alphabet system.',
                icon: <ShieldCheck className="text-emerald-600" />,
                action: 'System Oversight'
              }
            ].map((role, i) => (
              <div key={i}>
                <Card className="p-8 space-y-4 border-none shadow-sm hover:shadow-md transition-all h-full">
                  <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                    {role.icon}
                  </div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">{role.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{role.desc}</p>
                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                      {role.action}
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benchmarks Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tight">Stage Benchmarks</h2>
            <p className="text-lg text-slate-500 max-w-3xl mx-auto">Detailed performance indicators for each stage of the journey.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Object.values(STAGE_BENCHMARKS).map((benchmark) => (
              <div key={benchmark.stage_id}>
                <Card className="overflow-hidden border-slate-100 shadow-sm hover:shadow-md transition-all h-full">
                  <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                    <div>
                      <p className="text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">Stage {benchmark.stage_id}</p>
                      <h3 className="text-2xl font-black uppercase tracking-tight">{benchmark.identity}</h3>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-2xl font-black">
                      {benchmark.stage_id}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 gap-4">
                      {benchmark.items.slice(0, 6).map((item, i) => (
                        <div key={i} className="flex gap-4 items-start border-b border-slate-50 pb-3 last:border-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 shrink-0" />
                          <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.category}</p>
                            <p className="text-sm text-slate-700 font-medium">{item.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Rubric System */}
      <section className="bg-slate-900 py-24 text-white">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tight">THE RUBRIC SYSTEM</h2>
            <p className="text-lg text-slate-400">
              We don't just say "good job." We measure specific technical outcomes across five distinct levels of competency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { l: 'Introduced', d: 'The skill is explained and attempted for the first time.', c: 'text-blue-400', bg: 'bg-white/5', border: 'border-white/10' },
              { l: 'Developing', d: 'The student understands the mechanics but lacks consistency.', c: 'text-indigo-400', bg: 'bg-white/5', border: 'border-white/10' },
              { l: 'Stable', d: 'Technique is reliable in controlled environments.', c: 'text-amber-400', bg: 'bg-white/5', border: 'border-white/10' },
              { l: 'Applied', d: 'The skill is used intentionally during match play.', c: 'text-orange-400', bg: 'bg-white/5', border: 'border-white/10' },
              { l: 'Competitive', d: 'Mastery is maintained under high-intensity pressure.', c: 'text-emerald-400', bg: 'bg-white/5', border: 'border-white/10' }
            ].map((level, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className={`p-8 rounded-[32px] border ${level.border} ${level.bg} text-left space-y-4 shadow-sm`}
              >
                <div className="text-4xl font-black opacity-10">0{i+1}</div>
                <h4 className={`text-xl font-black uppercase tracking-tight ${level.c}`}>{level.l}</h4>
                <p className="text-sm text-slate-400 font-medium leading-relaxed">{level.d}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-emerald-600 rounded-[48px] p-12 md:p-20 text-center text-white space-y-8 relative overflow-hidden shadow-2xl shadow-emerald-200">
            <Trophy size={300} className="absolute -right-20 -bottom-20 text-white/10 rotate-12" />
            <h2 className="text-4xl md:text-6xl font-black tracking-tight relative z-10 uppercase">READY TO JOIN <br /> THE PROGRAM?</h2>
            <p className="text-xl text-emerald-50 max-w-2xl mx-auto relative z-10 opacity-90">
              Coaches: Register your club today. <br /> Players: Contact your coach for an invitation.
            </p>
            <div className="pt-4 relative z-10">
              {user ? (
                <Button onClick={() => onSignIn()} className="px-12 py-5 text-xl bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl">
                  Go to Dashboard
                </Button>
              ) : (
                <Button onClick={onStart} className="px-12 py-5 text-xl bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl">
                  Coach Registration
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-100 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
            <Trophy size={16} />
          </div>
          <span className="font-black text-slate-900 uppercase tracking-tighter">Badminton Alphabet</span>
        </div>
        <p className="text-sm text-slate-400">© 2026 Badminton Alphabet Program. All rights reserved.</p>
      </footer>
    </div>
  );
};
