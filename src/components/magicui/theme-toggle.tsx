import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../lib/theme';
import { cn } from '../../lib/utils';

interface ThemeToggleProps extends React.ComponentProps<'button'> {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className, showLabel = false, ...props }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 rounded-xl p-2.5 transition-all duration-300',
        'bg-[#141414] hover:bg-[#1f1f1f] text-[#a1a1a1] hover:text-white border border-[#262626] hover:border-[#E5C378]/50 shadow-sm cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5C378]',
        className
      )}
      {...props}
    >
      <div className="relative size-5 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="moon"
              initial={{ scale: 0.5, rotate: -90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.5, rotate: 90, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="text-[#E5C378]"
            >
              <Moon size={18} className="transition-transform group-hover:-rotate-12 duration-300" />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ scale: 0.5, rotate: 90, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.5, rotate: -90, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="text-[#E5C378]"
            >
              <Sun size={18} className="transition-transform group-hover:rotate-45 duration-500" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showLabel && (
        <span className="font-sans text-[10px] uppercase tracking-widest font-medium text-[#888888] group-hover:text-white transition-colors">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
}
