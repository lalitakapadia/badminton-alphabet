import React from 'react';
import { CheckCircle2, Circle, Clock, Award } from 'lucide-react';
import { Skill, Progress } from '../../types';
import { Card } from '../Card';

interface SkillCardProps {
  skill: Skill;
  progress?: Progress;
  isAdmin: boolean;
  selectedUserId?: number;
  onUpdateProgress?: (userId: number, skillId: number, status: string) => void;
}

export const SkillCard = ({ skill, progress, isAdmin, selectedUserId, onUpdateProgress }: any) => {
  const status = progress?.status || 'not_started';
  
  const levels = [
    { id: 'level_1', label: 'Introduced', desc: skill.level_1, color: 'blue' },
    { id: 'level_2', label: 'Developing', desc: skill.level_2, color: 'indigo' },
    { id: 'level_3', label: 'Stable', desc: skill.level_3, color: 'amber' },
    { id: 'level_4', label: 'Applied', desc: skill.level_4, color: 'orange' },
    { id: 'level_5', label: 'Competitive', desc: skill.level_5, color: 'emerald' }
  ];

  const currentLevel = levels.find(l => l.id === status);

  return (
    <Card className="p-5 flex flex-col justify-between group hover:border-emerald-200 transition-all">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <h5 className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors text-lg">{skill.name}</h5>
          <div className={`shrink-0 p-1.5 rounded-full ${
            status === 'not_started' ? 'text-slate-300 bg-slate-50' : 
            status === 'level_5' ? 'text-emerald-600 bg-emerald-50' : 
            'text-indigo-600 bg-indigo-50'
          }`}>
            {status === 'level_5' ? <CheckCircle2 size={24} /> : 
             status === 'not_started' ? <Circle size={24} /> : 
             <Clock size={24} />}
          </div>
        </div>
        
        {/* Level Descriptions */}
        <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Award size={14} className="text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">Skill Rubric</span>
          </div>
          {levels.map(l => (
            <div 
              key={l.id} 
              className={`text-xs flex gap-3 p-2 rounded-lg transition-all ${
                status === l.id 
                  ? 'bg-slate-50 ring-1 ring-slate-200 font-black text-black' 
                  : 'text-slate-700 font-bold'
              }`}
            >
              <span className={`shrink-0 w-3.5 h-3.5 rounded-full mt-0.5 border-2 border-white shadow-sm ${
                l.id === 'level_1' ? 'bg-blue-600' :
                l.id === 'level_2' ? 'bg-indigo-600' :
                l.id === 'level_3' ? 'bg-amber-600' :
                l.id === 'level_4' ? 'bg-orange-600' :
                'bg-emerald-600'
              }`} />
              <div className="flex flex-col">
                <span className={`text-[9px] uppercase tracking-wider ${status === l.id ? 'text-slate-900' : 'text-slate-500'}`}>{l.label}</span>
                <span className={status === l.id ? 'text-[13px] leading-tight' : 'text-[12px] leading-tight opacity-90'}>{l.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAdmin && selectedUserId && onUpdateProgress && (
        <div className="mt-6 space-y-2">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => onUpdateProgress(selectedUserId, skill.id, 'not_started')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${
                status === 'not_started' ? 'bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              Reset
            </button>
            {levels.map(l => {
              const colorClasses: Record<string, string> = {
                blue: status === l.id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-100',
                indigo: status === l.id ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
                amber: status === l.id ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-600 hover:bg-amber-100',
                orange: status === l.id ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-100',
                emerald: status === l.id ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100',
              };
              return (
                <button 
                  key={l.id}
                  onClick={() => onUpdateProgress(selectedUserId, skill.id, l.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm ${colorClasses[l.color]}`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {!isAdmin && (
        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Current Mastery</span>
          <span className={`text-xs font-bold px-3 py-1 rounded-full ${
            status === 'level_5' ? 'text-emerald-700 bg-emerald-100' : 
            status === 'level_4' ? 'text-orange-700 bg-orange-100' : 
            status === 'level_3' ? 'text-amber-700 bg-amber-100' : 
            status === 'level_2' ? 'text-indigo-700 bg-indigo-100' : 
            status === 'level_1' ? 'text-blue-700 bg-blue-100' : 
            'text-slate-500 bg-slate-100'
          }`}>
            {currentLevel ? currentLevel.label : 'Not Started'}
          </span>
        </div>
      )}
    </Card>
  );
};
