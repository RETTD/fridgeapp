'use client';

import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`bg-card border-2 border-card rounded-xl shadow-lg ${className}`}>
      {children}
    </div>
  );
}

