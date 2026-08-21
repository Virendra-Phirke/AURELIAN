import React, { useCallback, useRef } from 'react';
import { flushSync } from 'react-dom';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';

export interface AnimatedThemeTogglerProps
  extends React.ComponentPropsWithoutRef<'button'> {
  className?: string;
  theme?: 'dark' | 'light';
  onThemeChange?: (theme: string) => void;
  duration?: number;
  showLabel?: boolean;
}

export function AnimatedThemeToggler({
  className,
  theme: controlledTheme,
  onThemeChange,
  duration = 450,
  showLabel = false,
  ...props
}: AnimatedThemeTogglerProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const themeContext = useTheme();

  const currentTheme = controlledTheme || themeContext.resolvedTheme;
  const isDark = currentTheme === 'dark';

  const toggleTheme = useCallback(
    async (event?: React.MouseEvent<HTMLButtonElement>) => {
      const isAppearanceTransition =
        typeof document !== 'undefined' &&
        'startViewTransition' in document &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';

      if (!isAppearanceTransition || !buttonRef.current) {
        if (onThemeChange) {
          onThemeChange(nextTheme);
        } else {
          themeContext.setTheme(nextTheme);
        }
        return;
      }

      const rect = buttonRef.current.getBoundingClientRect();
      const x = event?.clientX && event.clientX > 0 ? event.clientX : rect.left + rect.width / 2;
      const y = event?.clientY && event.clientY > 0 ? event.clientY : rect.top + rect.height / 2;

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const isCurrentDark = currentTheme === 'dark';

      const transition = (document as any).startViewTransition(async () => {
        flushSync(() => {
          if (onThemeChange) {
            onThemeChange(nextTheme);
          } else {
            themeContext.setTheme(nextTheme);
          }
        });
      });

      await transition.ready;

      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];

      document.documentElement.animate(
        {
          clipPath: isCurrentDark ? [...clipPath].reverse() : clipPath,
        },
        {
          duration,
          easing: 'ease-in-out',
          pseudoElement: isCurrentDark
            ? '::view-transition-old(root)'
            : '::view-transition-new(root)',
        }
      );
    },
    [currentTheme, onThemeChange, themeContext, duration]
  );

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={(e) => toggleTheme(e)}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 rounded-xl p-2.5 transition-all duration-300 select-none cursor-pointer',
        'bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-hover)] text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] border border-[var(--color-border)] hover:border-[var(--color-primary)]/50 shadow-sm',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
        className
      )}
      {...props}
    >
      <div className="relative size-5 flex items-center justify-center">
        {isDark ? (
          <Moon size={18} className="text-[var(--color-primary)] transition-transform duration-300 group-hover:-rotate-12" />
        ) : (
          <Sun size={18} className="text-[var(--color-primary)] transition-transform duration-500 group-hover:rotate-45" />
        )}
      </div>

      {showLabel && (
        <span className="font-sans text-[11px] uppercase tracking-widest font-semibold text-[var(--color-secondary-text)] group-hover:text-[var(--color-primary-text)] transition-colors">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
