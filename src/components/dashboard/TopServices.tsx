import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scissors } from "lucide-react";
import { format, startOfMonth } from "date-fns";
import { useMemo } from "react";

interface ServiceStats {
  id: string;
  name: string;
  count: number;
  revenue: number;
}

export const TopServices = () => {
  const firstDayOfMonth = useMemo(() => 
    format(startOfMonth(new Date()), "yyyy-MM-dd"), 
  []);

  const { data: topServices = [] } = useQuery<ServiceStats[]>({
    queryKey: ["top-services", firstDayOfMonth],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar barbeiros do usuário
      const { data: userBarbers } = await supabase
        .from("barbers")
        .select("id")
        .eq("user_id", user.id);
      
      const barberIds = userBarbers?.map(b => b.id) || [];
      if (barberIds.length === 0) return [];

      const { data: appointments, error } = await supabase
        .from("appointments")
        .select("service_id, services(id, name, price)")
        .in("barber_id", barberIds)
        .eq("status", "completed")
        .gte("appointment_date", firstDayOfMonth);

      if (error) throw error;

      const serviceStats: Record<string, ServiceStats> = {};
      appointments?.forEach((apt) => {
        if (apt.services) {
          const serviceId = apt.services.id;
          if (!serviceStats[serviceId]) {
            serviceStats[serviceId] = {
              id: serviceId,
              name: apt.services.name,
              count: 0,
              revenue: 0,
            };
          }
          serviceStats[serviceId].count++;
          serviceStats[serviceId].revenue += Number(apt.services.price);
        }
      });

      return Object.values(serviceStats)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    },
    staleTime: 60000, // 1 minuto
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Serviços</CardTitle>
        <CardDescription>Serviços mais solicitados este mês</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 md:space-y-4">
          {topServices.map((service, index) => (
            <div
              key={service.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex-shrink-0">
                  <Scissors className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{service.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {service.count} agendamento{service.count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end sm:text-right gap-2 ml-12 sm:ml-0">
                <Badge variant={index === 0 ? "default" : "secondary"} className="text-xs">
                  #{index + 1}
                </Badge>
                <p className="text-sm font-medium whitespace-nowrap">
                  R$ {service.revenue.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
          {topServices.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nenhum serviço concluído ainda
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
