import { Skeleton } from "@/components/ui/skeleton";

export const TimeSlotsSkeleton = () => {
  return (
    <div className="space-y-6">
      {/* Morning section */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-20" />
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
      
      {/* Afternoon section */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-16" />
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
      
      {/* Evening section */}
      <div className="space-y-3">
        <Skeleton className="h-5 w-14" />
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
};
