'use client';

import { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = '', ...props }: InputProps) {
  const inputClasses = `w-full px-4 py-2 border-2 border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-fridge-primary focus:border-fridge-primary transition-all bg-input text-primary placeholder:text-muted ${className}`;
  
  if (label) {
    return (
      <div>
        <label className="block text-sm font-semibold text-primary mb-1.5">
          {label}
        </label>
        <input className={inputClasses} {...props} />
      </div>
    );
  }
  
  return <input className={inputClasses} {...props} />;
}

