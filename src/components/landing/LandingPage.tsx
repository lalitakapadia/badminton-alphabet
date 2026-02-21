import React from 'react';
import { motion } from 'motion/react';
import { Trophy, ChevronDown, Award, CheckCircle2, Settings } from 'lucide-react';
import { Button } from '../Button';
import { Card } from '../Card';

interface LandingPageProps {
  onStart: () => void;
  onSignIn: () => void;
}

export const LandingPage = ({ onStart, onSignIn }: LandingPageProps) => {
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
            <Button onClick={onStart} className="px-8 py-4 text-lg bg-emerald-600 hover:bg-emerald-500">
              Start Your Journey
            </Button>
            <Button onClick={onSignIn} variant="secondary" className="px-8 py-4 text-lg bg-white/10 border-white/20 text-white hover:bg-white/20">
              Sign In to Dashboard
            </Button>
          </motion.div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
          <ChevronDown size={32} />
        </div>
      </header>

      {/* The Program Insights */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight">
                WHY THE <br /> ALPHABET?
              </h2>
              <div className="h-2 w-20 bg-emerald-500 rounded-full" />
            </div>
            <p className="text-lg text-slate-600 leading-relaxed">
              Most training programs focus on random drills. The Badminton Alphabet provides a <strong>structured curriculum</strong> where every letter represents a critical technical or physical pillar.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { title: 'Foundation', desc: 'Core athletic base and essential movement.', icon: <Award className="text-emerald-600" /> },
                { title: 'Fundamentals', desc: 'Rally flow and basic hitting mechanics.', icon: <CheckCircle2 className="text-emerald-600" /> },
                { title: 'Mechanics', desc: 'Kinetic efficiency and offensive structure.', icon: <Settings className="text-emerald-600" /> },
                { title: 'Tactics & Mastery', desc: 'High-performance variation and speed.', icon: <Trophy className="text-emerald-600" /> }
              ].map((item, i) => (
                <div key={i} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center">
                    {item.icon}
                  </div>
                  <h4 className="font-bold text-slate-900">{item.title}</h4>
                  <p className="text-sm text-slate-500">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-square bg-emerald-100 rounded-[40px] rotate-3 absolute inset-0 -z-10" />
            <Card className="p-8 space-y-6 shadow-2xl">
              <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl">A</div>
                <div>
                  <h3 className="font-black text-xl text-slate-900 uppercase tracking-tight">Athletic Base</h3>
                  <p className="text-sm text-slate-500">The first letter of mastery</p>
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Measurement Rubric</p>
                <div className="space-y-3">
                  {[
                    { l: 'Introduced', d: 'Static ready position only.', c: 'bg-blue-500' },
                    { l: 'Developing', d: 'Split visible but often late.', c: 'bg-indigo-500' },
                    { l: 'Stable', d: 'Timed split in controlled drills.', c: 'bg-amber-500' },
                    { l: 'Applied', d: 'Timed split during active rallies.', c: 'bg-orange-500' },
                    { l: 'Competitive', d: 'Anticipatory split under pressure.', c: 'bg-emerald-500' }
                  ].map((level, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className={`w-3 h-3 rounded-full ${level.c}`} />
                      <div className="flex-1">
                        <p className="text-xs font-black text-slate-900 uppercase">{level.l}</p>
                        <p className="text-xs text-slate-500">{level.d}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Measurement Section */}
      <section className="bg-slate-50 py-24">
        <div className="max-w-7xl mx-auto px-6 text-center space-y-16">
          <div className="max-w-3xl mx-auto space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900">THE RUBRIC SYSTEM</h2>
            <p className="text-lg text-slate-600">
              We don't just say "good job." We measure specific technical outcomes across five distinct levels of competency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[
              { l: 'Introduced', d: 'The skill is explained and attempted for the first time.', c: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
              { l: 'Developing', d: 'The student understands the mechanics but lacks consistency.', c: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
              { l: 'Stable', d: 'Technique is reliable in controlled environments.', c: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
              { l: 'Applied', d: 'The skill is used intentionally during match play.', c: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' },
              { l: 'Competitive', d: 'Mastery is maintained under high-intensity pressure.', c: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' }
            ].map((level, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -10 }}
                className={`p-8 rounded-[32px] border ${level.border} ${level.bg} text-left space-y-4 shadow-sm`}
              >
                <div className="text-4xl font-black opacity-20">0{i+1}</div>
                <h4 className={`text-xl font-black uppercase tracking-tight ${level.c}`}>{level.l}</h4>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{level.d}</p>
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
            <h2 className="text-4xl md:text-6xl font-black tracking-tight relative z-10">READY TO CLIMB <br /> THE LADDER?</h2>
            <p className="text-xl text-emerald-50 max-w-2xl mx-auto relative z-10 opacity-90">
              Join us to transform your game through the Badminton Alphabet methodology.
            </p>
            <div className="pt-4 relative z-10">
              <Button onClick={onStart} className="px-12 py-5 text-xl bg-white text-emerald-700 hover:bg-emerald-50 shadow-xl">
                Create Your Profile
              </Button>
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
