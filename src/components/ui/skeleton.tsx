import * as React from 'react';
import { cn } from '../../lib/utils';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl bg-[var(--color-surface-raised)]/80 border border-[var(--color-border)]/40 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.8s_infinite] before:bg-gradient-to-r before:from-transparent before:via-[var(--color-primary)]/10 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] p-3 sm:p-4 flex flex-col justify-between h-20 sm:h-24 shadow-sm">
      <div className="flex items-center gap-2">
        <Skeleton className="w-5 h-5 rounded-lg" />
        <Skeleton className="w-20 h-3 rounded-md" />
      </div>
      <Skeleton className="w-16 h-6 rounded-md mt-2" />
    </div>
  );
}

export function ServiceCardSkeleton() {
  return (
    <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-[var(--color-card-bg)] border border-[var(--color-border)] flex items-center justify-between gap-3 shadow-sm">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
        <div className="space-y-1.5 flex-1">
          <Skeleton className="w-28 h-4 rounded-md" />
          <Skeleton className="w-48 h-3 rounded-md" />
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <Skeleton className="w-10 h-5 rounded-md" />
        <Skeleton className="w-16 h-7 rounded-lg" />
      </div>
    </div>
  );
}

export function TimeSlotSkeleton() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-2 gap-1.5 sm:gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-9 rounded-lg sm:rounded-xl" />
      ))}
    </div>
  );
}
