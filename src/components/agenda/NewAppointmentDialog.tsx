import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { usePlanValidation } from "@/hooks/usePlanValidation";

interface OccupiedSlot {
  time: string;
  duration: number;
  serviceName: string;
}

const appointmentSchema = z.object({
  barberId: z.string().uuid({ message: "Barbeiro inválido" }),
  serviceId: z.string().uuid({ message: "Serviço inválido" }),
  date: z.date().refine((date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }, { message: "Não é possível agendar datas passadas" }),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { message: "Horário inválido" }),
});

interface NewAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewAppointmentDialog = ({ open, onOpenChange }: NewAppointmentDialogProps) => {
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { checkLimit } = usePlanValidation();

  // Fetch barber's appointments for selected date
  useEffect(() => {
    if (selectedBarber && selectedDate) {
      loadOccupiedSlots();
    } else {
      setOccupiedSlots([]);
    }
  }, [selectedBarber, selectedDate]);

  const loadOccupiedSlots = async () => {
    if (!selectedBarber || !selectedDate) return;
    
    setLoadingSlots(true);
    try {
      const { data, error } = await supabase
        .from("appointments")
        .select(`
          appointment_time,
          duration_minutes,
          services!appointments_service_id_fkey (name, duration_minutes)
        `)
        .eq("barber_id", selectedBarber)
        .eq("appointment_date", format(selectedDate, "yyyy-MM-dd"))
        .in("status", ["pending", "confirmed"]); // Only block pending/confirmed, not completed/cancelled/no_show
      
      if (error) throw error;

      const slots: OccupiedSlot[] = (data || []).map((apt: any) => ({
        time: apt.appointment_time?.slice(0, 5) || "",
        duration: apt.duration_minutes || apt.services?.duration_minutes || 30,
        serviceName: apt.services?.name || "Serviço",
      }));

      console.log("Occupied slots for", selectedBarber, format(selectedDate, "yyyy-MM-dd"), ":", slots);
      setOccupiedSlots(slots);
    } catch (error) {
      console.error("Error loading occupied slots:", error);
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  const loadData = async () => {
    try {
      const { data: barbersData, error: barbersError } = await supabase
        .from("barbers")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (barbersError) throw barbersError;

      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (servicesError) throw servicesError;

      setBarbers(barbersData || []);
      setServices(servicesData || []);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour <= 19; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(time);
      }
    }
    return slots;
  };

  // Check if a time slot is occupied considering service duration
  const getSlotStatus = (slotTime: string): { isOccupied: boolean; reason?: string } => {
    const selectedService = services.find(s => s.id === selectedService);
    const newServiceDuration = selectedService?.duration_minutes || 30;
    
    const slotMinutes = timeToMinutes(slotTime);
    const newServiceEnd = slotMinutes + newServiceDuration;

    for (const occupied of occupiedSlots) {
      const occupiedStart = timeToMinutes(occupied.time);
      const occupiedEnd = occupiedStart + occupied.duration;

      // Check if new appointment would overlap with existing
      if (slotMinutes < occupiedEnd && newServiceEnd > occupiedStart) {
        return {
          isOccupied: true,
          reason: `${occupied.serviceName} (${occupied.time} - ${minutesToTime(occupiedEnd)})`,
        };
      }
    }

    return { isOccupied: false };
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

  // Memoized time slots with occupation status
  const timeSlotsWithStatus = useMemo(() => {
    const slots = generateTimeSlots();
    const currentService = services.find(s => s.id === selectedService);
    const serviceDuration = currentService?.duration_minutes || 30;

    return slots.map(slot => {
      const slotMinutes = timeToMinutes(slot);
      const serviceEnd = slotMinutes + serviceDuration;

      let isOccupied = false;
      let reason = "";

      for (const occupied of occupiedSlots) {
        const occupiedStart = timeToMinutes(occupied.time);
        const occupiedEnd = occupiedStart + occupied.duration;

        // Check overlap
        if (slotMinutes < occupiedEnd && serviceEnd > occupiedStart) {
          isOccupied = true;
          reason = `${occupied.serviceName} (${occupied.time} - ${minutesToTime(occupiedEnd)})`;
          break;
        }
      }

      return { time: slot, isOccupied, reason };
    });
  }, [occupiedSlots, selectedService, services]);

  const handleSubmit = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime || !clientName || !clientPhone) {
      toast.error("Preencha todos os campos");
      return;
    }

    // Validar telefone
    const cleanPhone = clientPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast.error("Telefone deve ter 10 ou 11 dígitos");
      return;
    }

    // Validate input
    const validationResult = appointmentSchema.safeParse({
      barberId: selectedBarber,
      serviceId: selectedService,
      date: selectedDate,
      time: selectedTime,
    });

    if (!validationResult.success) {
      toast.error(validationResult.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const limitCheck = await checkLimit("appointments");
      if (!limitCheck.allowed) {
        toast.error(`Limite de agendamentos mensais atingido! Você tem ${limitCheck.current}/${limitCheck.max} agendamentos este mês. Faça upgrade para criar mais.`);
        setIsLoading(false);
        return;
      }

      // Get service duration for conflict checking
      const service = services.find(s => s.id === selectedService);
      if (!service) {
        toast.error("Serviço não encontrado");
        setIsLoading(false);
        return;
      }

      // Use the safe RPC function that checks for conflicts
      const { data: appointmentId, error } = await supabase.rpc(
        "create_appointment_safe",
        {
          p_barber_id: selectedBarber,
          p_service_id: selectedService,
          p_customer_name: clientName.trim(),
          p_customer_phone: cleanPhone,
          p_appointment_date: format(selectedDate, "yyyy-MM-dd"),
          p_appointment_time: selectedTime + ":00",
          p_duration_minutes: service.duration_minutes,
        }
      );

      if (error) {
        if (error.message?.includes("não disponível")) {
          toast.error("Este horário não está disponível. O barbeiro já tem outro agendamento nesse período.");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Agendamento criado com sucesso!");
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      toast.error("Erro ao criar agendamento");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedService("");
    setSelectedBarber("");
    setSelectedDate(undefined);
    setSelectedTime("");
    setClientName("");
    setClientPhone("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Agendamento</DialogTitle>
          <DialogDescription>
            Preencha os dados para criar um novo agendamento
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nome do Cliente</Label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nome completo do cliente"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Telefone do Cliente (WhatsApp)</Label>
            <input
              type="tel"
              value={clientPhone}
              onChange={(e) => {
                const cleanPhone = e.target.value.replace(/\D/g, "");
                setClientPhone(cleanPhone);
              }}
              placeholder="11999999999"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              maxLength={11}
            />
            <p className="text-xs text-muted-foreground">
              Apenas números (DDD + número). Ex: 11999999999
            </p>
          </div>

          <div className="space-y-2">
            <Label>Serviço</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder={
                  services.length === 0 
                    ? "Nenhum serviço cadastrado" 
                    : "Selecione o serviço"
                } />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    <div className="flex flex-col gap-1 py-1">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-xs text-muted-foreground">
                        R$ {service.price.toFixed(2)} • {service.duration_minutes} min
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {services.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Cadastre serviços na tela /servicos primeiro
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Barbeiro</Label>
            <Select value={selectedBarber} onValueChange={setSelectedBarber}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o barbeiro" />
              </SelectTrigger>
              <SelectContent>
                {barbers.map((barber) => (
                  <SelectItem key={barber.id} value={barber.id}>
                    {barber.name} {barber.specialty && `- ${barber.specialty}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, "PPP", { locale: ptBR }) : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Horário
              {loadingSlots && (
                <span className="text-xs text-muted-foreground">(carregando...)</span>
              )}
            </Label>
            {!selectedBarber || !selectedDate ? (
              <p className="text-sm text-muted-foreground py-2">
                Selecione o barbeiro e a data para ver os horários disponíveis
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto p-1">
                {timeSlotsWithStatus.map(({ time, isOccupied, reason }) => (
                  <Button
                    key={time}
                    type="button"
                    variant={selectedTime === time ? "default" : isOccupied ? "outline" : "secondary"}
                    size="sm"
                    disabled={isOccupied}
                    onClick={() => setSelectedTime(time)}
                    className={cn(
                      "text-xs font-medium transition-all",
                      isOccupied && "opacity-50 line-through bg-destructive/10 border-destructive/30 text-muted-foreground cursor-not-allowed",
                      selectedTime === time && "ring-2 ring-primary ring-offset-2"
                    )}
                    title={isOccupied ? `Ocupado: ${reason}` : `Disponível às ${time}`}
                  >
                    <Clock className={cn("h-3 w-3 mr-1", isOccupied && "text-destructive")} />
                    {time}
                  </Button>
                ))}
              </div>
            )}
            {occupiedSlots.length > 0 && selectedBarber && selectedDate && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="inline-block w-3 h-3 bg-destructive/10 border border-destructive/30 rounded" />
                Horários riscados estão ocupados
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading} className="flex-1">
              {isLoading ? "Criando..." : "Confirmar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
