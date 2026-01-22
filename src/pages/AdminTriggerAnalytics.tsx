import { AppLayout } from "@/components/AppLayout";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { useUpgradeTriggerAnalytics } from "@/hooks/useUpgradeTriggerAnalytics";
import { TriggerAnalyticsCards } from "@/components/admin/TriggerAnalyticsCards";
import { TriggerConversionChart } from "@/components/admin/TriggerConversionChart";
import { TriggerTypeTable } from "@/components/admin/TriggerTypeTable";
import { TriggerMetricsCards } from "@/components/admin/TriggerMetricsCards";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  </div>
);

const AdminTriggerAnalytics = () => {
  useRequireAdmin();
  const [days, setDays] = useState(30);
  const { data, isLoading } = useUpgradeTriggerAnalytics(days);

  return (
    <AppLayout
      title="Analytics de Gatilhos"
      description="Monitoramento de disparos e conversões de upgrade"
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Últimos 7 dias</SelectItem>
              <SelectItem value="14">Últimos 14 dias</SelectItem>
              <SelectItem value="30">Últimos 30 dias</SelectItem>
              <SelectItem value="60">Últimos 60 dias</SelectItem>
              <SelectItem value="90">Últimos 90 dias</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading || !data ? (
          <LoadingSkeleton />
        ) : (
          <>
            <TriggerAnalyticsCards data={data} />
            <TriggerConversionChart data={data.dailyData} />
            <TriggerTypeTable data={data.triggersByType} />
            <TriggerMetricsCards data={data} />
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default AdminTriggerAnalytics;
