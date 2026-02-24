import React from 'react';
import { motion } from 'motion/react';
import { X, ClipboardCheck, Target } from 'lucide-react';
import { StageBenchmark } from '../../types';
import { Card } from '../Card';

interface BenchmarkSheetProps {
  benchmark: StageBenchmark;
  onClose: () => void;
  stageName: string;
}

export const BenchmarkSheet = ({ benchmark, onClose, stageName }: BenchmarkSheetProps) => {
  const CardAny = Card as any;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <CardAny 
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-none"
        onClick={(e: any) => e.stopPropagation()}
      >
        <div className="p-6 bg-emerald-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg">
              <ClipboardCheck size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold leading-tight">{stageName}</h3>
              <p className="text-emerald-50 text-sm opacity-90 flex items-center gap-1">
                <Target size={14} />
                Identity: {benchmark.identity}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          <div className="grid grid-cols-1 gap-3">
            {benchmark.items.map((item, index) => (
              <div 
                key={index} 
                className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col gap-1"
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                  {item.category}
                </span>
                <p className="text-slate-700 text-sm font-medium leading-relaxed">
                  {item.details}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center shrink-0">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all shadow-sm"
          >
            Got it
          </button>
        </div>
      </CardAny>
    </motion.div>
  );
};
