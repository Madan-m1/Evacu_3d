import React from 'react';

interface SkeletonProps {
  className?: string;
}

// Base pulse skeleton block
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-800/60 rounded-lg ${className}`} />
);

// A full dashboard table skeleton
export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({
  rows = 4,
  cols = 4,
}) => (
  <div className="w-full">
    {/* Header */}
    <div className="flex gap-4 px-6 py-3 border-b border-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-3 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex gap-4 px-6 py-4 border-b border-gray-800/50">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className={`h-4 flex-1 ${c === 0 ? 'max-w-[180px]' : ''}`} />
        ))}
      </div>
    ))}
  </div>
);

// Card skeleton (for building picker, feature cards etc)
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-[#1a1d2e] border border-gray-800 rounded-xl px-5 py-4 flex items-center gap-4">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="w-5 h-5 rounded shrink-0" />
      </div>
    ))}
  </div>
);

// Stat card skeleton for dashboard header
export const StatCardSkeleton: React.FC = () => (
  <div className="bg-[#1a1d2e] border border-gray-800 rounded-xl p-5 space-y-3">
    <Skeleton className="h-3 w-1/2" />
    <Skeleton className="h-7 w-1/3" />
  </div>
);

export default Skeleton;
