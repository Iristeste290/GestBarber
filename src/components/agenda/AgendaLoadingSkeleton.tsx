import { Skeleton } from "@/components/ui/skeleton";

export const AgendaLoadingSkeleton = () => {
  return (
    <div className="space-y-4 animate-fade-in">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-xl border-l-4 border-l-muted bg-card p-4 shadow-sm"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-3">
              {/* Time and status */}
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              
              {/* Customer name */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              
              {/* Service */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-3.5 rounded-full" />
                <Skeleton className="h-3.5 w-12" />
              </div>
              
              {/* Barber */}
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
