import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'gold' | 'success' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseStyles =
    'inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-[9px] uppercase tracking-widest font-medium transition-colors';

  const variants: Record<string, string> = {
    default: 'bg-[#1a1a1a] text-[#a3a3a3] border border-[#2a2a2a]',
    gold: 'bg-[#E5C378]/10 text-[#E5C378] border border-[#E5C378]/30 shadow-[0_0_8px_rgba(229,195,120,0.15)]',
    success: 'bg-emerald-950/40 text-emerald-400 border border-emerald-500/30',
    destructive: 'bg-red-950/40 text-red-400 border border-red-500/30',
    warning: 'bg-amber-950/40 text-amber-400 border border-amber-500/30',
    secondary: 'bg-[#141414] text-[#737373] border border-[#222222]',
    outline: 'text-white border border-[#333333]',
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}
