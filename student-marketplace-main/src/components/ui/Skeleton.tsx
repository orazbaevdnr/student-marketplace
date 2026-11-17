import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div
      className={`animate-pulse bg-ink-200/70 rounded-lg ${className}`}
    />
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="bg-surface rounded-xl border border-ink-200/80 overflow-hidden shadow-xs flex flex-col">
      <div className="relative w-full aspect-[4/3]">
        <Skeleton className="w-full h-full rounded-none" />
        <Skeleton className="absolute bottom-3 left-3 h-8 w-24 rounded-xl bg-sun-200/80" />
      </div>
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-5 w-4/5 mb-2" />
          <Skeleton className="h-4 w-3/5" />
        </div>
        <div className="pt-3 border-t border-ink-100 flex items-center justify-between">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
    </div>
  );
};
