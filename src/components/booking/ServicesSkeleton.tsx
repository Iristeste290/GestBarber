import { Skeleton } from "@/components/ui/skeleton";

export const ServicesSkeleton = () => {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-full p-4 rounded-xl border-2 border-border bg-card"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <Skeleton className="h-6 w-20" />
          </div>
        </div>
      ))}
    </div>
  );
};
