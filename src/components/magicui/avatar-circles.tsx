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
          className="relative inline-block size-8 rounded-full border-2 border-[#0a0a0a] bg-[#1a1a1a] shadow-sm overflow-hidden"
          title={url.name || 'VIP Client'}
        >
          {url.imageUrl ? (
            <img
              className="size-full object-cover"
              src={url.imageUrl}
              alt={url.name || 'Avatar'}
            />
          ) : (
            <div className="size-full flex items-center justify-center font-sans text-[10px] uppercase font-bold text-[#E5C378]">
              {(url.name || 'VIP').substring(0, 2)}
            </div>
          )}
        </div>
      ))}
      {(numPeople ?? 0) > 0 && (
        <div className="flex size-8 items-center justify-center rounded-full border-2 border-[#0a0a0a] bg-[#1a1a1a] text-center text-[10px] font-sans font-medium text-white shadow-sm">
          +{numPeople}
        </div>
      )}
    </div>
  );
}
