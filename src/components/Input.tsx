import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name?: string;
}

export const Input = ({ label, ...props }: any) => (
  <div className="space-y-1.5 w-full">
    {label && <label className="text-sm font-medium text-slate-700 ml-1">{label}</label>}
    <input
      {...props}
      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
    />
  </div>
);
