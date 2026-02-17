import { useState, useEffect, useMemo, useCallback } from "react";
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
import { Calendar as CalendarIcon, Clock, AlertCircle, ChevronRight, ChevronLeft, User, Phone, Scissors, UserCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { z } from "zod";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { UsageLimitModal } from "@/components/upgrade/UsageLimitModal";
import { useManualProcessTracker } from "@/hooks/useManualProcessTracker";
import { useIsMobile } from "@/hooks/use-mobile";
import { 
  sanitizeName, 
  sanitizePhone, 
  validateAppointmentCustomer,
  containsDangerousContent 
} from "@/lib/input-sanitizer";

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

const TOTAL_STEPS = 6;
const stepLabels = ["Nome", "Telefone", "Serviço", "Barbeiro", "Data", "Horário"];
const stepIcons = [User, Phone, Scissors, UserCheck, CalendarIcon, Clock];

export const NewAppointmentDialog = ({ open, onOpenChange }: NewAppointmentDialogProps) => {
  const isMobile = useIsMobile();
  const [step, setStep] = useState(1);
  const [barbers, setBarbers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [selectedService, setSelectedService] = useState("");
  const [selectedBarber, setSelectedBarber] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const { checkCanAdd } = useUsageLimits();
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState({ current: 0, max: 0 });
  
  const { startManualProcess, endManualProcess, cancelManualProcess } = useManualProcessTracker();

  useEffect(() => {
    if (open) {
      startManualProcess("manual_appointment");
      setStep(1);
    } else {
      cancelManualProcess();
    }
  }, [open, startManualProcess, cancelManualProcess]);

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
        .in("status", ["pending", "confirmed"]);
      
      if (error) throw error;

      const slots: OccupiedSlot[] = (data || []).map((apt: any) => ({
        time: apt.appointment_time?.slice(0, 5) || "",
        duration: apt.duration_minutes || apt.services?.duration_minutes || 30,
        serviceName: apt.services?.name || "Serviço",
      }));

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: barbersData, error: barbersError } = await supabase
        .from("barbers")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("name");

      if (barbersError) throw barbersError;

      const { data: servicesData, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("user_id", user.id)
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

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const minutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
  };

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

    const customerValidation = validateAppointmentCustomer({
      customerName: clientName,
      customerPhone: clientPhone,
    });

    if (!customerValidation.success) {
      toast.error((customerValidation as { success: false; error: string }).error);
      return;
    }

    const { customerName: validatedName, customerPhone: validatedPhone } = customerValidation.data;

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
      const check = checkCanAdd("appointments");
      if (!check.allowed) {
        setLimitInfo({ current: check.current, max: check.max });
        setShowLimitModal(true);
        setIsLoading(false);
        return;
      }

      const service = services.find(s => s.id === selectedService);
      if (!service) {
        toast.error("Serviço não encontrado");
        setIsLoading(false);
        return;
      }

      const { data: appointmentId, error } = await supabase.rpc(
        "create_appointment_safe",
        {
          p_barber_id: selectedBarber,
          p_service_id: selectedService,
          p_customer_name: validatedName,
          p_customer_phone: validatedPhone,
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
      await endManualProcess();
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
    setNameError(null);
    setPhoneError(null);
    setStep(1);
  };

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (containsDangerousContent(rawValue)) {
      setNameError("Caracteres não permitidos detectados");
      return;
    }
    const sanitized = sanitizeName(rawValue);
    setClientName(sanitized);
    setNameError(null);
  }, []);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizePhone(e.target.value);
    setClientPhone(sanitized);
    setPhoneError(null);
  }, []);

  const canGoNext = () => {
    switch (step) {
      case 1: return clientName.trim().length >= 2;
      case 2: return clientPhone.trim().length >= 10;
      case 3: return selectedService !== "";
      case 4: return selectedBarber !== "";
      case 5: return !!selectedDate;
      case 6: return selectedTime !== "";
      default: return false;
    }
  };

  // --- STEP RENDERERS ---

  const renderStepName = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <User className="h-5 w-5" />
        <span className="font-semibold text-sm">Qual o nome do cliente?</span>
      </div>
      <input
        type="text"
        value={clientName}
        onChange={handleNameChange}
        placeholder="Nome completo do cliente"
        autoFocus
        className={cn(
          "flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          nameError && "border-destructive"
        )}
        maxLength={100}
      />
      {nameError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {nameError}
        </p>
      )}
    </div>
  );

  const renderStepPhone = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <Phone className="h-5 w-5" />
        <span className="font-semibold text-sm">Telefone (WhatsApp)</span>
      </div>
      <input
        type="tel"
        value={clientPhone}
        onChange={handlePhoneChange}
        placeholder="11999999999"
        autoFocus
        className={cn(
          "flex h-12 w-full rounded-lg border border-input bg-background px-4 py-3 text-base ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          phoneError && "border-destructive"
        )}
        maxLength={11}
      />
      {phoneError && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {phoneError}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Apenas números (DDD + número). Ex: 11999999999
      </p>
    </div>
  );

  const renderStepService = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <Scissors className="h-5 w-5" />
        <span className="font-semibold text-sm">Selecione o serviço</span>
      </div>
      <Select value={selectedService} onValueChange={setSelectedService}>
        <SelectTrigger className="h-12 text-base">
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
                <span className="text-xs opacity-70">
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
  );

  const renderStepBarber = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <UserCheck className="h-5 w-5" />
        <span className="font-semibold text-sm">Selecione o barbeiro</span>
      </div>
      <Select value={selectedBarber} onValueChange={setSelectedBarber}>
        <SelectTrigger className="h-12 text-base">
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
  );

  const renderStepDate = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <CalendarIcon className="h-5 w-5" />
        <span className="font-semibold text-sm">Escolha a data</span>
      </div>
      <div className="flex justify-center">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
          initialFocus
          className="pointer-events-auto rounded-lg border border-border"
        />
      </div>
    </div>
  );

  const renderStepTime = () => (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-primary">
        <Clock className="h-5 w-5" />
        <span className="font-semibold text-sm">Escolha o horário</span>
      </div>
      {loadingSlots ? (
        <p className="text-sm text-muted-foreground py-4 text-center">Carregando horários...</p>
      ) : (
        <div className="grid grid-cols-4 gap-2 max-h-[240px] overflow-y-auto p-1">
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
      {occupiedSlots.length > 0 && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <span className="inline-block w-3 h-3 bg-destructive/10 border border-destructive/30 rounded" />
          Horários riscados estão ocupados
        </p>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 1: return renderStepName();
      case 2: return renderStepPhone();
      case 3: return renderStepService();
      case 4: return renderStepBarber();
      case 5: return renderStepDate();
      case 6: return renderStepTime();
      default: return null;
    }
  };

  // --- MOBILE: 6-STEP STEPPER ---
  if (isMobile) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[95vw] p-4">
            <DialogHeader className="pb-1">
              <DialogTitle className="text-base">Novo Agendamento</DialogTitle>
              <DialogDescription className="text-xs">
                Passo {step} de {TOTAL_STEPS} — {stepLabels[step - 1]}
              </DialogDescription>
            </DialogHeader>

            {/* Progress bar */}
            <div className="flex gap-1 mb-3">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-300",
                    i < step ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>

            <div className="min-h-[180px]">
              {renderCurrentStep()}
            </div>

            <div className="flex gap-2 pt-2">
              {step > 1 ? (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1" size="lg">
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              ) : (
                <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" size="lg">
                  Cancelar
                </Button>
              )}
              {step < TOTAL_STEPS ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canGoNext()} className="flex-1" size="lg">
                  Continuar
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={isLoading || !selectedTime} className="flex-1" size="lg">
                  {isLoading ? "Criando..." : "Confirmar"}
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <UsageLimitModal
          isOpen={showLimitModal}
          onClose={() => setShowLimitModal(false)}
          resource="appointments"
          current={limitInfo.current}
          max={limitInfo.max}
        />
      </>
    );
  }

  // --- DESKTOP: ALL FIELDS IN ONE VIEW ---
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Agendamento</DialogTitle>
            <DialogDescription>
              Preencha os dados para criar um novo agendamento
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Nome do Cliente</Label>
              <input
                type="text"
                value={clientName}
                onChange={handleNameChange}
                placeholder="Nome completo do cliente"
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  nameError && "border-destructive"
                )}
                maxLength={100}
              />
              {nameError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {nameError}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label>Telefone do Cliente (WhatsApp)</Label>
              <input
                type="tel"
                value={clientPhone}
                onChange={handlePhoneChange}
                placeholder="11999999999"
                className={cn(
                  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  phoneError && "border-destructive"
                )}
                maxLength={11}
              />
              {phoneError && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {phoneError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Apenas números (DDD + número). Ex: 11999999999
              </p>
            </div>

            {/* Service */}
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
                        <span className="text-xs opacity-70">
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

            {/* Barber */}
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

            {/* Date */}
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

            {/* Time */}
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

      <UsageLimitModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        resource="appointments"
        current={limitInfo.current}
        max={limitInfo.max}
      />
    </>
  );
};
