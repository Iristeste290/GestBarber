import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CalendarDays, CalendarRange, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AgendaFiltersProps {
  viewMode: "day" | "tomorrow" | "week" | "month";
  onViewModeChange: (mode: "day" | "tomorrow" | "week" | "month") => void;
  selectedBarber: string;
  onBarberChange: (barberId: string) => void;
  selectedService: string;
  onServiceChange: (serviceId: string) => void;
}

export const AgendaFilters = ({
  viewMode,
  onViewModeChange,
  selectedBarber,
  onBarberChange,
  selectedService,
  onServiceChange,
}: AgendaFiltersProps) => {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  useEffect(() => {
    loadFiltersData();
  }, []);

  const loadFiltersData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: barbersData } = await supabase
      .from("barbers")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name");

    const { data: servicesData } = await supabase
      .from("services")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .order("name");

    if (barbersData) setBarbers(barbersData);
    if (servicesData) setServices(servicesData);
  };

  return (
    <div className="bg-card rounded-lg border p-3 md:p-4 space-y-3 md:space-y-4">
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
        <Button
          variant={viewMode === "day" ? "default" : "outline"}
          onClick={() => onViewModeChange("day")}
          size="sm"
          className="text-xs md:text-sm transition-all duration-300 hover:scale-105"
        >
          <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Hoje</span>
        </Button>
        <Button
          variant={viewMode === "tomorrow" ? "default" : "outline"}
          onClick={() => onViewModeChange("tomorrow")}
          size="sm"
          className="text-xs md:text-sm transition-all duration-300 hover:scale-105"
        >
          <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Amanhã</span>
        </Button>
        <Button
          variant={viewMode === "week" ? "default" : "outline"}
          onClick={() => onViewModeChange("week")}
          size="sm"
          className="text-xs md:text-sm transition-all duration-300 hover:scale-105"
        >
          <CalendarDays className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Semana</span>
        </Button>
        <Button
          variant={viewMode === "month" ? "default" : "outline"}
          onClick={() => onViewModeChange("month")}
          size="sm"
          className="text-xs md:text-sm transition-all duration-300 hover:scale-105"
        >
          <CalendarRange className="w-3.5 h-3.5 md:w-4 md:h-4 md:mr-2" />
          <span className="hidden md:inline">Mês</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
        <div className="flex-1 min-w-0">
          <Select value={selectedBarber} onValueChange={onBarberChange}>
            <SelectTrigger className="text-xs md:text-sm">
              <SelectValue placeholder="Filtrar por barbeiro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os barbeiros</SelectItem>
              {barbers.map((barber) => (
                <SelectItem key={barber.id} value={barber.id}>
                  {barber.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-0">
          <Select value={selectedService} onValueChange={onServiceChange}>
            <SelectTrigger className="text-xs md:text-sm">
              <SelectValue placeholder="Filtrar por serviço" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os serviços</SelectItem>
              {services.map((service) => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};
