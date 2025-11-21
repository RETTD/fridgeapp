'use client';

import { SelectHTMLAttributes, ReactNode } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}

export function Select({ label, className = '', children, ...props }: SelectProps) {
  const selectClasses = `w-full px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary ${className}`;
  
  if (label) {
    return (
      <div>
        <label className="block text-sm font-semibold text-primary mb-1.5">
          {label}
        </label>
        <select className={selectClasses} {...props}>
          {children}
        </select>
      </div>
    );
  }
  
  return <select className={selectClasses} {...props}>{children}</select>;
}

