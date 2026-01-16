import { useEffect, useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface AgendaFiltersSheetProps {
  selectedBarber: string;
  onBarberChange: (barberId: string) => void;
  selectedService: string;
  onServiceChange: (serviceId: string) => void;
  selectedStatus: string;
  onStatusChange: (status: string) => void;
}

export const AgendaFiltersSheet = ({
  selectedBarber,
  onBarberChange,
  selectedService,
  onServiceChange,
  selectedStatus,
  onStatusChange,
}: AgendaFiltersSheetProps) => {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const activeFiltersCount = [selectedBarber, selectedService, selectedStatus]
    .filter(v => v !== "all").length;

  useEffect(() => {
    loadFiltersData();
  }, []);

  const loadFiltersData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [barbersRes, servicesRes] = await Promise.all([
      supabase.from("barbers").select("*").eq("user_id", user.id).eq("is_active", true).order("name"),
      supabase.from("services").select("*").eq("user_id", user.id).eq("is_active", true).order("name"),
    ]);

    if (barbersRes.data) setBarbers(barbersRes.data);
    if (servicesRes.data) setServices(servicesRes.data);
  };

  const clearFilters = () => {
    onBarberChange("all");
    onServiceChange("all");
    onStatusChange("all");
  };

  const hasActiveFilters = activeFiltersCount > 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 relative"
        >
          <Filter className="h-4 w-4" />
          Filtros
          {hasActiveFilters && (
            <Badge 
              variant="default" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </SheetTitle>
          <SheetDescription>
            Filtre os agendamentos por barbeiro, serviço ou status
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Barber filter */}
          <div className="space-y-2">
            <Label htmlFor="barber-filter">Barbeiro</Label>
            <Select value={selectedBarber} onValueChange={onBarberChange}>
              <SelectTrigger id="barber-filter">
                <SelectValue placeholder="Todos os barbeiros" />
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

          {/* Service filter */}
          <div className="space-y-2">
            <Label htmlFor="service-filter">Serviço</Label>
            <Select value={selectedService} onValueChange={onServiceChange}>
              <SelectTrigger id="service-filter">
                <SelectValue placeholder="Todos os serviços" />
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

          {/* Status filter */}
          <div className="space-y-2">
            <Label htmlFor="status-filter">Status</Label>
            <Select value={selectedStatus} onValueChange={onStatusChange}>
              <SelectTrigger id="status-filter">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="completed">Concluído</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear filters button */}
          {hasActiveFilters && (
            <Button 
              variant="outline" 
              onClick={clearFilters} 
              className="w-full gap-2"
            >
              <X className="h-4 w-4" />
              Limpar filtros
            </Button>
          )}
        </div>

        {/* Apply button */}
        <div className="absolute bottom-6 left-6 right-6">
          <Button 
            onClick={() => setOpen(false)} 
            className="w-full"
          >
            Aplicar filtros
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
