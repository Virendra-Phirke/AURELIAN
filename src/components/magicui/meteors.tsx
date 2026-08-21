import React, { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';

export interface MeteorsProps {
  number?: number;
  className?: string;
}

export function Meteors({ number = 20, className }: MeteorsProps) {
  const [meteorStyles, setMeteorStyles] = useState<Array<React.CSSProperties>>([]);

  useEffect(() => {
    const styles = Array.from({ length: number }).map(() => ({
      top: -5,
      left: Math.floor(Math.random() * 100) + '%',
      animationDelay: Math.random() * 1 + 0.2 + 's',
      animationDuration: Math.floor(Math.random() * 8 + 3) + 's',
    }));
    setMeteorStyles(styles);
  }, [number]);

  return (
    <div className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {meteorStyles.map((style, idx) => (
        <span
          key={idx}
          style={style}
          className={cn(
            'animate-meteor absolute size-0.5 rounded-full bg-[#E5C378] shadow-[0_0_0_1px_#ffffff10]',
            'before:absolute before:top-1/2 before:h-[1px] before:w-[50px] before:-translate-y-1/2 before:bg-gradient-to-r before:from-[#E5C378] before:to-transparent before:content-[""]'
          )}
        />
      ))}
    </div>
  );
}
