import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';

export interface AnimatedThemeTogglerProps extends React.ComponentProps<'button'> {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

export function AnimatedThemeToggler({
  className,
  showLabel = false,
  size = 'default',
  ...props
}: AnimatedThemeTogglerProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const isDark = resolvedTheme === 'dark';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    let eventCoords = e;
    if (buttonRef.current && (!e.clientX || !e.clientY)) {
      const rect = buttonRef.current.getBoundingClientRect();
      eventCoords = {
        ...e,
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
      };
    }
    toggleTheme(eventCoords);
  };

  const sizeClasses = {
    sm: 'p-1.5 size-8 text-xs',
    default: 'p-2.5 h-10 px-3.5 text-xs',
    lg: 'p-3.5 h-12 px-4 text-sm',
  }[size];

  const iconSizes = {
    sm: 14,
    default: 18,
    lg: 20,
  }[size];

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-300 select-none cursor-pointer',
        'bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
        sizeClasses,
        className
      )}
      {...props}
    >
      <div className="relative flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ scale: 0.2, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.2, rotate: 90, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
              className="text-[var(--color-primary)] flex items-center justify-center"
            >
              <Moon size={iconSizes} className="transition-transform group-hover:-rotate-12 duration-300" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ scale: 0.2, rotate: 90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.2, rotate: -90, opacity: 0 }}
              transition={{
                type: 'spring',
                stiffness: 400,
                damping: 25,
              }}
              className="text-[var(--color-primary)] flex items-center justify-center"
            >
              <Sun size={iconSizes} className="transition-transform group-hover:rotate-45 duration-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showLabel && (
        <span className="font-sans text-[11px] uppercase tracking-widest font-semibold text-[var(--color-secondary-text)] group-hover:text-[var(--color-primary-text)] transition-colors">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
