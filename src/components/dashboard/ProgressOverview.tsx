import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Trophy, LayoutDashboard, Users, ClipboardCheck } from 'lucide-react';
import { Stage, Skill, Progress, User } from '../../types';
import { Card } from '../Card';
import { SkillCard } from './SkillCard';
import { BenchmarkSheet } from './BenchmarkSheet';
import { STAGE_BENCHMARKS } from '../../constants/benchmarks';
import { Button } from '../Button';

interface ProgressOverviewProps {
  currentStage: Stage | null;
  stageSkills: Skill[];
  userProgress: Progress[];
  overallProgress: number;
  user: User | null;
  selectedUser: User | null;
  onUpdateProgress: (userId: number, skillId: number, status: string) => void;
}

export const ProgressOverview = ({
  currentStage,
  stageSkills,
  userProgress,
  overallProgress,
  user,
  selectedUser,
  onUpdateProgress
}: ProgressOverviewProps) => {
  const [showBenchmark, setShowBenchmark] = useState(false);

  if (!currentStage) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-400 space-y-4">
        <div className="p-4 bg-slate-100 rounded-full">
          <Users size={48} />
        </div>
        <p className="font-medium">Select a student to view their progress</p>
      </div>
    );
  }

  return (
    <motion.div
      key={currentStage.id}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-6"
    >
      <Card className="p-6 md:p-8 bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-none shadow-xl shadow-emerald-200 relative overflow-hidden">
        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row gap-6 md:items-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center shrink-0">
              <Award size={40} />
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-bold tracking-tight">{currentStage.name}</h3>
              <p className="text-emerald-50 opacity-90 text-lg">{currentStage.description}</p>
            </div>
            <div className="md:ml-auto flex flex-col items-end gap-3">
              <div className="text-4xl font-black opacity-20 select-none">
                {currentStage.name.split(':')[0].slice(-1)}
              </div>
              <Button 
                onClick={() => setShowBenchmark(true)}
                className="bg-white/20 hover:bg-white/30 text-white border border-white/30 text-xs py-1.5 px-3 flex items-center gap-2"
              >
                <ClipboardCheck size={14} />
                View Benchmarks
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="uppercase tracking-wider opacity-80">Overall Stage Progress</span>
              <span>{overallProgress}%</span>
            </div>
            <div className="h-4 bg-black/20 rounded-full overflow-hidden border border-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]"
              />
            </div>
          </div>
        </div>
        <Trophy size={200} className="absolute -right-10 -bottom-10 text-white/5 rotate-12 pointer-events-none" />
      </Card>

      {/* Skills Rubric */}
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-between mb-2 px-1">
          <h4 className="font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard size={18} className="text-emerald-600" />
            Skill Rubric
          </h4>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">
            {stageSkills.length} Skills Total
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stageSkills.map(skill => (
            <SkillCard 
              key={skill.id}
              skill={skill}
              progress={userProgress.find(p => p.skill_id === skill.id)}
              isAdmin={user?.role === 'admin'}
              selectedUserId={selectedUser?.id}
              onUpdateProgress={onUpdateProgress}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showBenchmark && STAGE_BENCHMARKS[currentStage.id] && (
          <BenchmarkSheet 
            benchmark={STAGE_BENCHMARKS[currentStage.id]}
            stageName={currentStage.name}
            onClose={() => setShowBenchmark(false)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
