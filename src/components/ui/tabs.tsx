import * as React from 'react';
import { cn } from '../../lib/utils';

interface TabsContextValue {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = React.createContext<TabsContextValue | null>(null);

export function Tabs({
  value,
  onValueChange,
  defaultValue,
  className,
  children,
  ...props
}: {
  value?: string;
  onValueChange?: (val: string) => void;
  defaultValue?: string;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '');
  const currentValue = value !== undefined ? value : internalValue;

  const handleValueChange = React.useCallback(
    (newVal: string) => {
      if (value === undefined) {
        setInternalValue(newVal);
      }
      onValueChange?.(newVal);
    },
    [value, onValueChange]
  );

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={cn('flex flex-col', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-xl bg-[var(--color-surface-raised)] p-1 text-[var(--color-secondary-text)] border border-[var(--color-border)] shadow-inner',
        className
      )}
      {...props}
    />
  );
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      onClick={() => context?.onValueChange(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 font-sans text-xs font-semibold uppercase tracking-wider transition-all focus-visible:outline-none cursor-pointer',
        isActive
          ? 'bg-[var(--color-primary)] text-black shadow-sm font-bold'
          : 'text-[var(--color-secondary-text)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-surface-hover)]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  const context = React.useContext(TabsContext);
  const isActive = context?.value === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      className={cn('mt-3 focus-visible:outline-none', className)}
      {...props}
    >
      {children}
    </div>
  );
}
