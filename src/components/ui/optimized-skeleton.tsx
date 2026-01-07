import { memo } from "react";
import { cn } from "@/lib/utils";

interface OptimizedSkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export const OptimizedSkeleton = memo(function OptimizedSkeleton({
  className,
  variant = "rectangular",
  width,
  height,
}: OptimizedSkeletonProps) {
  const variantClasses = {
    text: "rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  return (
    <div
      className={cn(
        "skeleton",
        variantClasses[variant],
        className
      )}
      style={{
        width: width,
        height: height,
      }}
      aria-hidden="true"
    />
  );
});

// Skeletons pré-definidos para uso comum
export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 contain-content">
      <div className="flex items-center justify-between">
        <OptimizedSkeleton className="h-4 w-24" />
        <OptimizedSkeleton variant="circular" className="h-8 w-8" />
      </div>
      <OptimizedSkeleton className="h-8 w-20" />
      <OptimizedSkeleton className="h-3 w-32" />
    </div>
  );
});

export const ListItemSkeleton = memo(function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 contain-content">
      <OptimizedSkeleton variant="circular" className="h-10 w-10 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <OptimizedSkeleton className="h-4 w-3/4" />
        <OptimizedSkeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
});

export const TableRowSkeleton = memo(function TableRowSkeleton({ columns = 4 }: { columns?: number }) {
  return (
    <div className="flex items-center gap-4 p-3 contain-content">
      {Array.from({ length: columns }).map((_, i) => (
        <OptimizedSkeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
  );
});

export const ChartSkeleton = memo(function ChartSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4 contain-content">
      <div className="space-y-2 mb-4">
        <OptimizedSkeleton className="h-5 w-48" />
        <OptimizedSkeleton className="h-3 w-32" />
      </div>
      <OptimizedSkeleton className="h-[200px] w-full" />
    </div>
  );
});
