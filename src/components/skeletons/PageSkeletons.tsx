import { memo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// Stats Cards Skeleton
export const StatsCardsSkeleton = memo(function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="contain-content">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <Skeleton className="h-7 w-20 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
});

// Chart Skeleton
export const ChartSkeleton = memo(function ChartSkeleton() {
  return (
    <Card className="contain-content">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="text-right">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-20 mt-1" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-6">
        <Skeleton className="h-[280px] w-full" />
      </CardContent>
    </Card>
  );
});

// Service Card Skeleton
export const ServiceCardSkeleton = memo(function ServiceCardSkeleton() {
  return (
    <Card className="contain-content overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex justify-between pt-2 border-t">
          <Skeleton className="h-6 w-20" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// Barber Card Skeleton
export const BarberCardSkeleton = memo(function BarberCardSkeleton() {
  return (
    <Card className="contain-content">
      <CardHeader className="px-4 pt-4 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-3">
        <Skeleton className="h-8 w-full" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-5 w-10" />
        </div>
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  );
});

// Product Card Skeleton
export const ProductCardSkeleton = memo(function ProductCardSkeleton() {
  return (
    <Card className="contain-content">
      <CardHeader className="pb-3 pr-12">
        <div className="space-y-3">
          <div className="flex justify-between items-start gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-full" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
          <Skeleton className="h-6 w-28" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-3 w-20" />
      </CardContent>
    </Card>
  );
});

// List Item Skeleton
export const ListItemSkeleton = memo(function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 border-b last:border-b-0">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-5 w-16" />
    </div>
  );
});

// Dashboard Skeleton
export const DashboardSkeleton = memo(function DashboardSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <Skeleton className="h-7 w-48 mb-2" />
        <Skeleton className="h-4 w-32" />
      </Card>
      <StatsCardsSkeleton />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        <ChartSkeleton />
        <Card className="contain-content">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

// Services Page Skeleton
export const ServicesPageSkeleton = memo(function ServicesPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ServiceCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
});

// Barbers Page Skeleton
export const BarbersPageSkeleton = memo(function BarbersPageSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-36" />
      </div>
      <div className="grid gap-3 md:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <BarberCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
});

// Products Page Skeleton
export const ProductsPageSkeleton = memo(function ProductsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
});

// Agenda Skeleton
export const AgendaSkeleton = memo(function AgendaSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col lg:flex-row gap-3 justify-between">
        <Skeleton className="h-10 w-full lg:w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
      <Card className="contain-content">
        <CardContent className="p-4">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

// Payments Page Skeleton
export const PaymentsPageSkeleton = memo(function PaymentsPageSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="contain-content">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-7 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <Card className="contain-content">
        <CardContent className="p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <ListItemSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
});

// Reports Page Skeleton
export const ReportsPageSkeleton = memo(function ReportsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="contain-content">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <ChartSkeleton />
    </div>
  );
});

// Cash Register Skeleton
export const CashRegisterSkeleton = memo(function CashRegisterSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="contain-content">
            <CardContent className="p-4">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-10 w-full" />
      <Card className="contain-content">
        <CardContent className="p-4 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
    </div>
  );
});

// Costs Page Skeleton
export const CostsPageSkeleton = memo(function CostsPageSkeleton() {
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="contain-content">
            <CardContent className="p-4">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-6 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card className="contain-content">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-32" />
        </CardContent>
      </Card>
      <Card className="contain-content">
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <ListItemSkeleton key={i} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
});

// Growth Engine Skeleton
export const GrowthEngineSkeleton = memo(function GrowthEngineSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-10 w-36" />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="contain-content">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-8" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Card className="contain-content">
          <CardHeader>
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
