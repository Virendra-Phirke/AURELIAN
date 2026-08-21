import * as React from 'react';
import { cn } from '../../lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'gold' | 'success' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const baseStyles =
    'inline-flex items-center rounded-full px-2.5 py-0.5 font-sans text-[9px] uppercase tracking-widest font-semibold transition-colors';

  const variants: Record<string, string> = {
    default: 'bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] border border-[var(--color-border)]',
    gold: 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/30 shadow-[0_0_8px_rgba(229,195,120,0.15)]',
    success: 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30',
    destructive: 'bg-red-500/10 text-red-500 border border-red-500/30',
    warning: 'bg-amber-500/10 text-amber-500 border border-amber-500/30',
    secondary: 'bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] border border-[var(--color-border)]',
    outline: 'text-[var(--color-primary-text)] border border-[var(--color-border)]',
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props} />
  );
}
