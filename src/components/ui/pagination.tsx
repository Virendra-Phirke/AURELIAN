import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';

export function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      role="navigation"
      aria-label="pagination"
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  );
}

export function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul className={cn('flex flex-row items-center gap-1.5', className)} {...props} />
  );
}

export function PaginationItem({ className, ...props }: React.ComponentProps<'li'>) {
  return <li className={cn('', className)} {...props} />;
}

export type PaginationLinkProps = React.ComponentProps<'button'> & {
  isActive?: boolean;
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export function PaginationLink({
  className,
  isActive,
  size = 'icon',
  children,
  ...props
}: PaginationLinkProps) {
  return (
    <button
      type="button"
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-sans text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#E5C378] disabled:pointer-events-none disabled:opacity-40 cursor-pointer h-8 w-8',
        isActive
          ? 'bg-[#E5C378] text-black font-semibold shadow-[0_0_10px_rgba(229,195,120,0.3)]'
          : 'bg-[#111111] text-[#a3a3a3] hover:bg-[#1f1f1f] hover:text-white border border-[#222222]',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export type PaginationButtonProps = React.ComponentProps<'button'>;

export function PaginationPrevious({
  className,
  children,
  ...props
}: PaginationButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-1 h-8 px-3 rounded-lg bg-[#111111] text-[#a3a3a3] hover:bg-[#1f1f1f] hover:text-white border border-[#222222] font-sans text-xs uppercase tracking-wider transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
        className
      )}
      {...props}
    >
      <ChevronLeft className="h-3.5 w-3.5" />
      <span>{children || 'Prev'}</span>
    </button>
  );
}

export function PaginationNext({
  className,
  children,
  ...props
}: PaginationButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-1 h-8 px-3 rounded-lg bg-[#111111] text-[#a3a3a3] hover:bg-[#1f1f1f] hover:text-white border border-[#222222] font-sans text-xs uppercase tracking-wider transition-colors disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
        className
      )}
      {...props}
    >
      <span>{children || 'Next'}</span>
      <ChevronRight className="h-3.5 w-3.5" />
    </button>
  );
}

export function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      className={cn('flex h-8 w-8 items-center justify-center text-[#525252]', className)}
      {...props}
    >
      <MoreHorizontal className="h-4 w-4" />
      <span className="sr-only">More pages</span>
    </span>
  );
}

// Complete Interactive Pagination Bar Component
export interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export function DataPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20, 50],
  className,
}: DataPaginationProps) {
  if (totalItems <= 0) return null;

  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers
  const getPages = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-[#1a1a1a] bg-[#080808]/80 text-xs font-sans text-[#737373]',
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span>
          Showing <strong className="text-white font-medium">{startItem}</strong> to{' '}
          <strong className="text-white font-medium">{endItem}</strong> of{' '}
          <strong className="text-white font-medium">{totalItems}</strong>
        </span>

        {onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-[11px] uppercase tracking-wider text-[#525252]">Rows:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-[#111111] border border-[#222222] text-white text-xs rounded-md px-2 py-1 outline-none focus:border-[#E5C378] cursor-pointer"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#111] text-white">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <PaginationPrevious
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
        />

        <div className="flex items-center gap-1">
          {getPages().map((page, idx) =>
            typeof page === 'number' ? (
              <PaginationLink
                key={idx}
                isActive={page === currentPage}
                onClick={() => onPageChange(page)}
              >
                {page}
              </PaginationLink>
            ) : (
              <PaginationEllipsis key={idx} />
            )
          )}
        </div>

        <PaginationNext
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
        />
      </div>
    </div>
  );
}
