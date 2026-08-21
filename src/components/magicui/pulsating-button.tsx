import React from 'react';
import { cn } from '../../lib/utils';

export interface PulsatingButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  pulseColor?: string;
  duration?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PulsatingButton({
  className,
  children,
  pulseColor = 'rgba(229, 195, 120, 0.4)',
  duration = '2s',
  ...props
}: PulsatingButtonProps) {
  return (
    <button
      style={
        {
          '--pulse-color': pulseColor,
          '--duration': duration,
        } as React.CSSProperties
      }
      className={cn(
        'relative flex cursor-pointer items-center justify-center rounded-xl bg-[#E5C378] px-6 py-3 text-center text-xs font-semibold uppercase tracking-widest text-black shadow-[0_0_20px_rgba(229,195,120,0.3)] transition-all hover:bg-[#eed79b] active:scale-95',
        className
      )}
      {...props}
    >
      <div className="relative z-10 flex items-center gap-2">{children}</div>
      <div
        className="absolute top-1/2 left-1/2 size-full -translate-x-1/2 -translate-y-1/2 rounded-xl animate-pulse-ring pointer-events-none"
      />
    </button>
  );
}
