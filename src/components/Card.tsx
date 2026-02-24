import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const Card = ({ children, className = '', ...props }: CardProps) => (
  <div 
    {...props}
    className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${className}`}
  >
    {children}
  </div>
);
