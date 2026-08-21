import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gold';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-xl font-sans text-xs uppercase tracking-wider font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-primary)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

    const variants: Record<string, string> = {
      default: 'bg-[var(--color-surface-raised)] text-[var(--color-primary-text)] hover:bg-[var(--color-surface-hover)] border border-[var(--color-border)] shadow-sm',
      gold: 'bg-[var(--color-primary)] text-black hover:bg-[var(--color-primary-hover)] shadow-md border border-[var(--color-primary)]',
      destructive: 'bg-red-500/15 text-red-500 border border-red-500/30 hover:bg-red-500/25',
      outline: 'border border-[var(--color-border)] bg-transparent hover:bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)]',
      secondary: 'bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-primary-text)] border border-[var(--color-border)]',
      ghost: 'hover:bg-[var(--color-surface-raised)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)]',
      link: 'text-[var(--color-primary)] underline-offset-4 hover:underline lowercase tracking-normal font-normal',
    };

    const sizes: Record<string, string> = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-lg px-3 text-[10px]',
      lg: 'h-12 rounded-xl px-6 text-sm',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
