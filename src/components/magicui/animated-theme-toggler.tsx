import React, { useRef } from 'react';
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
  duration = 500,
  showLabel = false,
  ...props
}: AnimatedThemeTogglerProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const themeContext = useTheme();

  const currentTheme = controlledTheme || themeContext.resolvedTheme;
  const isDark = currentTheme === 'dark';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    let clientX = e.clientX;
    let clientY = e.clientY;

    if ((!clientX || !clientY) && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      clientX = rect.left + rect.width / 2;
      clientY = rect.top + rect.height / 2;
    }

    if (onThemeChange) {
      const next = currentTheme === 'dark' ? 'light' : 'dark';
      const isAppearanceTransition =
        typeof document !== 'undefined' &&
        'startViewTransition' in document &&
        !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (isAppearanceTransition) {
        const x = clientX || window.innerWidth / 2;
        const y = clientY || window.innerHeight / 2;
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        const transition = (document as any).startViewTransition(() => {
          flushSync(() => {
            onThemeChange(next);
          });
        });

        transition.ready.then(() => {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`,
              ],
            },
            {
              duration,
              easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
              pseudoElement: '::view-transition-new(root)',
            }
          );
        });
      } else {
        onThemeChange(next);
      }
    } else {
      themeContext.toggleTheme({ clientX, clientY });
    }
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
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
