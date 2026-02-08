import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Clock, CheckCircle2, Scissors, Star, CalendarDays, ChevronRight } from "lucide-react";
import { format, addMinutes, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentBookingForm } from "@/components/agenda/AppointmentBookingForm";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { ServicesSkeleton } from "@/components/booking/ServicesSkeleton";
import { TimeSlotsSkeleton } from "@/components/booking/TimeSlotsSkeleton";
import { CategorizedTimeSlots } from "@/components/booking/CategorizedTimeSlots";
import { BookingSuccessScreen } from "@/components/booking/BookingSuccessScreen";
import { useAvailableDates } from "@/hooks/useAvailableDates";

interface Barber {
  id: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
}

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const PublicBarberSchedule = () => {
  const { userId, barberId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [barber, setBarber] = useState<Barber | null>(null);
  const [barbershopName, setBarbershopName] = useState<string>("");
  const [barbershopLogoUrl, setBarbershopLogoUrl] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [noWorkHours, setNoWorkHours] = useState(false);
  const [customerPhone, setCustomerPhone] = useState<string>("");

  // Mobile stepper state
  const [mobileStep, setMobileStep] = useState(1);

  // Hook for checking unavailable dates
  const { isDateUnavailable, loading: loadingDates } = useAvailableDates({ barberId });

  // Stepper steps configuration
  const stepperSteps = [
    { label: "Serviço", icon: <Scissors className="w-4 h-4" /> },
    { label: "Data", icon: <CalendarDays className="w-4 h-4" /> },
    { label: "Horário", icon: <Clock className="w-4 h-4" /> },
  ];

  useEffect(() => {
    if (barberId) {
      loadBarberData();
    }
  }, [barberId]);

  useEffect(() => {
    if (selectedDate && selectedService) {
      loadAvailableSlots();
    }
  }, [selectedDate, selectedService]);

  const loadBarberData = async () => {
    try {
      setLoading(true);
      setLoadingServices(true);
      
      const { data: payload, error: invokeError } = await supabase.functions.invoke(
        "public-barber",
        { body: { barberId } },
      );

      if (invokeError) throw invokeError;

      const payloadBarber = (payload as any)?.barber as Barber | undefined;
      const shop = (payload as any)?.barbershop as {
        barbershop_name: string | null;
        barbershop_logo_url: string | null;
      } | undefined;
      const payloadServices = (payload as any)?.services as Service[] | undefined;

      if (!payloadBarber) {
        setBarber(null);
        return;
      }

      setBarber(payloadBarber);
      setBarbershopName(shop?.barbershop_name ?? "");
      setBarbershopLogoUrl(shop?.barbershop_logo_url ?? null);
      setServices(payloadServices ?? []);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
      setLoadingServices(false);
    }
  };

  const loadAvailableSlots = async () => {
    if (!selectedDate || !selectedService || !barberId) return;

    try {
      setLoadingSlots(true);
      setNoWorkHours(false);
      setAvailableSlots([]);
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const weekday = selectedDate.getDay();

      const { data: workHours, error: workHoursError } = await supabase
        .from("barber_work_hours")
        .select("start_time, end_time")
        .eq("barber_id", barberId)
        .eq("weekday", weekday)
        .maybeSingle();

      if (workHoursError) throw workHoursError;

      if (!workHours) {
        setNoWorkHours(true);
        setLoadingSlots(false);
        return;
      }

      const { data: breaks, error: breaksError } = await supabase
        .from("barber_breaks")
        .select("start_time, end_time")
        .eq("barber_id", barberId)
        .eq("weekday", weekday);

      if (breaksError) {
        console.error("Erro ao buscar intervalos:", breaksError);
      }

      const parseTime = (timeStr: string) => {
        if (timeStr.split(':').length === 3) {
          return parse(timeStr, "HH:mm:ss", new Date());
        }
        return parse(timeStr, "HH:mm", new Date());
      };

      const isTimeInBreak = (time: Date) => {
        if (!breaks || breaks.length === 0) return false;
        
        const timeMinutes = time.getHours() * 60 + time.getMinutes();
        
        return breaks.some((brk) => {
          const breakStart = parseTime(brk.start_time);
          const breakEnd = parseTime(brk.end_time);
          const breakStartMinutes = breakStart.getHours() * 60 + breakStart.getMinutes();
          const breakEndMinutes = breakEnd.getHours() * 60 + breakEnd.getMinutes();
          
          return timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes;
        });
      };

      const startTime = parseTime(workHours.start_time);
      const endTime = parseTime(workHours.end_time);

      const slots: TimeSlot[] = [];
      let currentTime = startTime;
      const maxEndTime = addMinutes(endTime, -selectedService.duration_minutes);

      while (currentTime <= maxEndTime) {
        const timeStr = format(currentTime, "HH:mm:ss");
        const displayTime = format(currentTime, "HH:mm");
        
        if (isTimeInBreak(currentTime)) {
          slots.push({
            time: displayTime,
            available: false,
          });
        } else {
          const { data: isAvailable, error: rpcError } = await supabase.rpc("check_time_slot_available", {
            p_barber_id: barberId,
            p_date: dateStr,
            p_time: timeStr,
            p_duration_minutes: selectedService.duration_minutes,
          });

          if (rpcError) {
            console.error("Erro ao verificar disponibilidade:", rpcError);
          }

          slots.push({
            time: displayTime,
            available: isAvailable === true,
          });
        }

        currentTime = addMinutes(currentTime, 30);
      }

      setAvailableSlots(slots);
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    if (isMobile) {
      setMobileStep(2);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date && isMobile && selectedService) {
      setMobileStep(3);
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowBookingForm(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setShowSuccess(true);
  };

  const handleNewBooking = () => {
    setShowSuccess(false);
    setSelectedTime(null);
    setSelectedService(null);
    setSelectedDate(undefined);
    setMobileStep(1);
  };

  const handleMobileBack = () => {
    if (mobileStep > 1) {
      setMobileStep(mobileStep - 1);
    }
  };

  // Disable dates that are in the past or have no availability
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || isDateUnavailable(date);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary animate-spin mx-auto" />
            <Scissors className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Carregando agenda...</p>
        </div>
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-xl border p-8 text-center space-y-6">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <Scissors className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Barbeiro não encontrado</h1>
            <p className="text-muted-foreground">
              O link que você acessou não está mais disponível ou o profissional não existe.
            </p>
          </div>
          <Button onClick={() => navigate(userId ? `/agenda-publica/${userId}` : "/")} size="lg" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  // Show success screen
  if (showSuccess && selectedDate && selectedService && selectedTime) {
    return (
      <BookingSuccessScreen
        barberName={barber.name}
        service={selectedService}
        date={selectedDate}
        time={selectedTime}
        customerPhone={customerPhone}
        onNewBooking={handleNewBooking}
      />
    );
  }

  // Show booking form
  if (showBookingForm && selectedDate && selectedService && selectedTime) {
    return (
      <AppointmentBookingForm
        barberId={barberId!}
        barberName={barber.name}
        service={selectedService}
        date={selectedDate}
        time={selectedTime}
        onSuccess={handleBookingSuccess}
        onCancel={() => setShowBookingForm(false)}
      />
    );
  }

  const availableCount = availableSlots.filter(s => s.available).length;

  // Render mobile stepper flow
  const renderMobileContent = () => {
    return (
      <div className="space-y-4">
        {/* Stepper */}
        <BookingStepper currentStep={mobileStep} steps={stepperSteps} />

        {/* Step 1: Service Selection */}
        {mobileStep === 1 && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Scissors className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Escolha o Serviço</h2>
                <p className="text-sm text-muted-foreground">Selecione o que deseja fazer</p>
              </div>
            </div>

            {loadingServices ? (
              <ServicesSkeleton />
            ) : (
              <div className="space-y-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => handleServiceSelect(service)}
                    className="w-full text-left p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-md hover:border-primary/50 border-border bg-card hover:bg-muted/30"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground truncate">{service.name}</h3>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {service.duration_minutes} min
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-foreground">R$ {service.price.toFixed(2)}</span>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Date Selection */}
        {mobileStep === 2 && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" onClick={handleMobileBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Escolha a Data</h2>
                <p className="text-sm text-muted-foreground">Dias em cinza estão indisponíveis</p>
              </div>
            </div>

            {/* Selected service summary */}
            {selectedService && (
              <div className="bg-primary/5 rounded-xl p-3 border border-primary/20">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Serviço selecionado:</span>
                  <span className="font-semibold text-foreground">{selectedService.name}</span>
                </div>
              </div>
            )}

            <div className="flex justify-center bg-card rounded-2xl border p-4">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                locale={ptBR}
                className="rounded-xl border-0 p-0 pointer-events-auto"
                classNames={{
                  day_disabled: "text-muted-foreground/30 opacity-50 cursor-not-allowed",
                  day: "h-10 w-10 p-0 font-normal aria-selected:opacity-100 inline-flex items-center justify-center rounded-md text-sm transition-colors hover:bg-muted",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                }}
              />
            </div>
          </div>
        )}

        {/* Step 3: Time Selection */}
        {mobileStep === 3 && (
          <div className="animate-fade-in space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Button variant="ghost" size="icon" onClick={handleMobileBack}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Escolha o Horário</h2>
                {selectedDate && (
                  <p className="text-sm text-muted-foreground">
                    {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                  </p>
                )}
              </div>
            </div>

            {/* Selected service & date summary */}
            {selectedService && selectedDate && (
              <div className="bg-primary/5 rounded-xl p-3 border border-primary/20 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Serviço:</span>
                  <span className="font-semibold text-foreground">{selectedService.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Data:</span>
                  <span className="font-semibold text-foreground">{format(selectedDate, "dd/MM/yyyy")}</span>
                </div>
              </div>
            )}

            <div className="bg-card rounded-2xl border p-4">
              {loadingSlots ? (
                <TimeSlotsSkeleton />
              ) : noWorkHours ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <CalendarDays className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Dia não disponível</p>
                    <p className="text-sm text-muted-foreground">
                      O profissional não trabalha neste dia.
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleMobileBack}>
                    Escolher outra data
                  </Button>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Sem horários disponíveis</p>
                    <p className="text-sm text-muted-foreground">
                      Todos os horários estão ocupados.
                    </p>
                  </div>
                  <Button variant="outline" onClick={handleMobileBack}>
                    Escolher outra data
                  </Button>
                </div>
              ) : (
                <>
                  {availableCount > 0 && (
                    <div className="flex justify-end mb-4">
                      <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                        {availableCount} {availableCount === 1 ? 'horário' : 'horários'} disponíveis
                      </span>
                    </div>
                  )}
                  <CategorizedTimeSlots slots={availableSlots} onSelect={handleTimeSelect} />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render desktop layout
  const renderDesktopContent = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
        {/* Services Column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Escolha o Serviço</h2>
              <p className="text-sm text-muted-foreground">Selecione o que deseja fazer</p>
            </div>
          </div>

          {loadingServices ? (
            <ServicesSkeleton />
          ) : (
            <div className="space-y-3">
              {services.map((service) => {
                const isSelected = selectedService?.id === service.id;
                return (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border-2 transition-all duration-200",
                      "hover:shadow-md hover:border-primary/50",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20"
                        : "border-border bg-card hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                          )}
                          <h3 className={cn(
                            "font-semibold text-foreground truncate",
                            isSelected && "text-primary"
                          )}>
                            {service.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {service.duration_minutes} min
                          </span>
                        </div>
                      </div>
                      <div className={cn(
                        "text-lg font-bold whitespace-nowrap",
                        isSelected ? "text-primary" : "text-foreground"
                      )}>
                        R$ {service.price.toFixed(2)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Calendar & Time Slots Column */}
        <div className="lg:col-span-3 space-y-6">
          {/* Date Selection */}
          <div className="bg-card rounded-2xl border shadow-sm p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Escolha a Data</h2>
                <p className="text-sm text-muted-foreground">Dias em cinza estão indisponíveis</p>
              </div>
            </div>

            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={isDateDisabled}
                locale={ptBR}
                className="rounded-xl border-0 p-0 pointer-events-auto"
                classNames={{
                  day_disabled: "text-muted-foreground/30 opacity-50 cursor-not-allowed",
                  day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 inline-flex items-center justify-center rounded-md text-sm transition-colors hover:bg-muted",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                  day_today: "bg-accent text-accent-foreground font-semibold",
                }}
              />
            </div>
          </div>

          {/* Time Slots */}
          {selectedService && selectedDate && (
            <div className="bg-card rounded-2xl border shadow-sm p-6 animate-fade-in">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Horários Disponíveis</h2>
                    <p className="text-sm text-muted-foreground">
                      {format(selectedDate, "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                </div>
                {!loadingSlots && availableCount > 0 && (
                  <span className="text-sm font-medium text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                    {availableCount} {availableCount === 1 ? 'horário' : 'horários'}
                  </span>
                )}
              </div>

              {loadingSlots ? (
                <TimeSlotsSkeleton />
              ) : noWorkHours ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <CalendarDays className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Dia não disponível</p>
                    <p className="text-sm text-muted-foreground">
                      O profissional não trabalha neste dia. Selecione outra data.
                    </p>
                  </div>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <Clock className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Sem horários disponíveis</p>
                    <p className="text-sm text-muted-foreground">
                      Todos os horários estão ocupados. Tente outra data.
                    </p>
                  </div>
                </div>
              ) : (
                <CategorizedTimeSlots slots={availableSlots} onSelect={handleTimeSelect} />
              )}
            </div>
          )}

          {/* Selected Summary */}
          {selectedService && (
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 p-6">
              <h3 className="font-semibold text-foreground mb-3">Resumo do agendamento</h3>
              <div className="flex flex-wrap gap-3 text-sm">
                <span className="bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border">
                  <strong>Serviço:</strong> {selectedService.name}
                </span>
                <span className="bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border">
                  <strong>Duração:</strong> {selectedService.duration_minutes} min
                </span>
                <span className="bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border">
                  <strong>Valor:</strong> R$ {selectedService.price.toFixed(2)}
                </span>
                {selectedDate && (
                  <span className="bg-background/80 backdrop-blur px-3 py-1.5 rounded-lg border">
                    <strong>Data:</strong> {format(selectedDate, "dd/MM/yyyy")}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative container mx-auto px-4 py-6 md:py-12">
          <Button
            variant="ghost"
            onClick={() => navigate(userId ? `/agenda-publica/${userId}` : "/")}
            className="mb-4 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          {/* Barbershop Logo & Name */}
          {(barbershopName || barbershopLogoUrl) && (
            <div className="flex items-center justify-center gap-3 mb-6">
              {barbershopLogoUrl && (
                <img
                  src={barbershopLogoUrl}
                  alt={barbershopName || "Logo da barbearia"}
                  className="w-10 h-10 md:w-14 md:h-14 rounded-xl object-cover border-2 border-primary/20 shadow-lg"
                />
              )}
              {barbershopName && (
                <div className="text-center md:text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Barbearia</p>
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">{barbershopName}</h2>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            {/* Avatar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity" />
              {barber.avatar_url ? (
                <img
                  src={barber.avatar_url}
                  alt={barber.name}
                  className="relative w-20 h-20 md:w-36 md:h-36 rounded-full object-cover border-4 border-background shadow-2xl"
                />
              ) : (
                <div className="relative w-20 h-20 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center border-4 border-background shadow-2xl">
                  <span className="text-2xl md:text-5xl font-bold text-primary-foreground">
                    {barber.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 w-7 h-7 md:w-10 md:h-10 bg-green-500 rounded-full flex items-center justify-center border-2 md:border-4 border-background shadow-lg">
                <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-left space-y-2">
              <div className="space-y-1">
                <h1 className="text-2xl md:text-4xl font-bold text-foreground tracking-tight">
                  {barber.name}
                </h1>
                {barber.specialty && (
                  <p className="text-base md:text-lg text-primary font-medium flex items-center justify-center md:justify-start gap-2">
                    <Scissors className="w-4 h-4" />
                    {barber.specialty}
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 md:px-3 md:py-1.5 rounded-full">
                  <Star className="w-3 h-3 md:w-4 md:h-4 text-amber-500 fill-amber-500" />
                  Profissional verificado
                </span>
                <span className="flex items-center gap-1.5 bg-muted/50 px-2 py-1 md:px-3 md:py-1.5 rounded-full">
                  <CalendarDays className="w-3 h-3 md:w-4 md:h-4" />
                  Agendamento online
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 md:py-12">
        {isMobile ? renderMobileContent() : renderDesktopContent()}
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-8 md:mt-12">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <p className="text-center text-xs md:text-sm text-muted-foreground">
            Agendamento online • Powered by <span className="font-semibold text-primary">GestBarber</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicBarberSchedule;
