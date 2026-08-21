import * as React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-[#222222] bg-[#111111] px-3.5 py-2 text-sm text-white placeholder:text-[#525252] transition-colors focus-visible:outline-none focus-visible:border-[#E5C378] focus-visible:ring-1 focus-visible:ring-[#E5C378] disabled:cursor-not-allowed disabled:opacity-50 font-sans',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
