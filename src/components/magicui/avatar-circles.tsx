import React from 'react';
import { cn } from '../../lib/utils';

interface AvatarCirclesProps extends React.ComponentProps<'div'> {
  className?: string;
  numPeople?: number;
  avatarUrls: Array<{ imageUrl?: string; profileUrl?: string; name?: string }>;
}

export function AvatarCircles({
  numPeople,
  className,
  avatarUrls,
}: AvatarCirclesProps) {
  return (
    <div className={cn('z-10 flex -space-x-3 rtl:space-x-reverse', className)}>
      {avatarUrls.map((url, index) => (
        <div
          key={index}
          className="relative inline-block size-8 rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-surface-raised)] shadow-sm overflow-hidden"
          title={url.name || 'VIP Client'}
        >
          {url.imageUrl ? (
            <img
              className="size-full object-cover"
              src={url.imageUrl}
              alt={url.name || 'Avatar'}
            />
          ) : (
            <div className="size-full flex items-center justify-center font-sans text-[10px] uppercase font-bold text-[var(--color-primary)]">
              {(url.name || 'VIP').substring(0, 2)}
            </div>
          )}
        </div>
      ))}
      {(numPeople ?? 0) > 0 && (
        <div className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--color-bg)] bg-[var(--color-surface-raised)] text-center text-[10px] font-sans font-bold text-[var(--color-primary-text)] shadow-sm">
          +{numPeople}
        </div>
      )}
    </div>
  );
}
