import React from 'react';

export const SkeletonLine: React.FC<{ className?: string }> = ({ className = 'h-4 w-full' }) => (
  <div className={`bg-gray-200 rounded animate-pulse ${className}`} />
);

export const SkeletonCard: React.FC = () => (
  <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
    <SkeletonLine className="h-5 w-2/3" />
    <SkeletonLine className="h-4 w-full" />
    <SkeletonLine className="h-4 w-4/5" />
    <div className="flex space-x-2 pt-2">
      <SkeletonLine className="h-6 w-16 rounded-full" />
      <SkeletonLine className="h-6 w-20 rounded-full" />
    </div>
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 4 }) => (
  <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
    {/* Header */}
    <div className="border-b border-gray-200 p-4">
      <div className="flex space-x-4">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonLine key={i} className="h-4 flex-1" />
        ))}
      </div>
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, row) => (
      <div key={row} className="border-b border-gray-100 p-4">
        <div className="flex space-x-4">
          {Array.from({ length: cols }).map((_, col) => (
            <SkeletonLine key={col} className="h-4 flex-1" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonCardGrid: React.FC<{ count?: number }> = ({ count = 6 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

export const SkeletonDashboard: React.FC = () => (
  <div className="space-y-6">
    {/* Welcome banner */}
    <SkeletonLine className="h-40 w-full rounded-2xl" />
    {/* AI Features */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonLine key={i} className="h-28 rounded-xl" />
      ))}
    </div>
    {/* Quick Actions */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <SkeletonLine key={i} className="h-24 rounded-xl" />
      ))}
    </div>
    {/* Content grid */}
    <div className="grid lg:grid-cols-2 gap-6">
      <SkeletonLine className="h-64 rounded-xl" />
      <SkeletonLine className="h-64 rounded-xl" />
    </div>
  </div>
);
