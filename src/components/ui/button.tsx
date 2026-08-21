import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'gold';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center whitespace-nowrap rounded-lg font-sans text-xs uppercase tracking-wider font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5C378] disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none';

    const variants: Record<string, string> = {
      default: 'bg-[#141414] text-white hover:bg-[#202020] border border-[#262626]',
      gold: 'bg-[#E5C378] text-black hover:bg-[#eed79b] shadow-[0_0_15px_rgba(229,195,120,0.25)] border border-[#E5C378]',
      destructive: 'bg-red-950/40 text-red-400 border border-red-500/30 hover:bg-red-900/60 hover:text-red-300',
      outline: 'border border-[#262626] bg-transparent hover:bg-[#141414] text-[#d4d4d4] hover:text-white',
      secondary: 'bg-[#1c1c1c] text-[#a3a3a3] hover:bg-[#262626] hover:text-white border border-[#2a2a2a]',
      ghost: 'hover:bg-[#1c1c1c] text-[#a3a3a3] hover:text-white',
      link: 'text-[#E5C378] underline-offset-4 hover:underline lowercase tracking-normal font-normal',
    };

    const sizes: Record<string, string> = {
      default: 'h-10 px-4 py-2',
      sm: 'h-8 rounded-md px-3 text-[10px]',
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
