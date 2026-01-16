import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Clock, CheckCircle2, Scissors, Store, Star, CalendarDays } from "lucide-react";
import { format, addMinutes, parse } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AppointmentBookingForm } from "@/components/agenda/AppointmentBookingForm";
import { cn } from "@/lib/utils";

interface Barber {
  id: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
  user_id: string | null;
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
  const { barberId } = useParams();
  const navigate = useNavigate();
  const [barber, setBarber] = useState<Barber | null>(null);
  const [barbershopName, setBarbershopName] = useState<string>("");
  const [barbershopLogoUrl, setBarbershopLogoUrl] = useState<string | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [noWorkHours, setNoWorkHours] = useState(false);

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
      const { data: barberData, error: barberError } = await supabase
        .from("barbers")
        .select("id, name, specialty, avatar_url, user_id")
        .eq("id", barberId)
        .single();

      if (barberError) throw barberError;
      setBarber(barberData);

      // Buscar nome e logo da barbearia usando a view pública segura
      if (barberData?.user_id) {
        const { data: profileData } = await supabase
          .from("barbershop_public_info")
          .select("barbershop_name, barbershop_logo_url")
          .eq("id", barberData.user_id)
          .maybeSingle();
        
        if (profileData?.barbershop_name) {
          setBarbershopName(profileData.barbershop_name);
        }
        if (profileData?.barbershop_logo_url) {
          setBarbershopLogoUrl(profileData.barbershop_logo_url);
        }

        // Buscar serviços do dono da barbearia
        const { data: servicesData, error: servicesError } = await supabase
          .from("services")
          .select("id, name, duration_minutes, price")
          .eq("user_id", barberData.user_id)
          .eq("is_active", true)
          .order("name");

        if (servicesError) throw servicesError;
        setServices(servicesData || []);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
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

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setShowBookingForm(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    setSelectedTime(null);
    setSelectedService(null);
    loadAvailableSlots();
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
          <Button onClick={() => navigate("/agenda")} size="lg" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Header */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative container mx-auto px-4 py-8 md:py-12">
          <Button
            variant="ghost"
            onClick={() => navigate("/agenda")}
            className="mb-6 -ml-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          {/* Barbershop Logo & Name */}
          {(barbershopName || barbershopLogoUrl) && (
            <div className="flex items-center justify-center gap-3 mb-8">
              {barbershopLogoUrl && (
                <img
                  src={barbershopLogoUrl}
                  alt={barbershopName || "Logo da barbearia"}
                  className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover border-2 border-primary/20 shadow-lg"
                />
              )}
              {barbershopName && (
                <div className="text-center md:text-left">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Barbearia</p>
                  <h2 className="text-xl md:text-2xl font-bold text-foreground">{barbershopName}</h2>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
            {/* Avatar */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary/50 rounded-full blur opacity-30 group-hover:opacity-50 transition-opacity" />
              {barber.avatar_url ? (
                <img
                  src={barber.avatar_url}
                  alt={barber.name}
                  className="relative w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-background shadow-2xl"
                />
              ) : (
                <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center border-4 border-background shadow-2xl">
                  <span className="text-4xl md:text-5xl font-bold text-primary-foreground">
                    {barber.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center border-4 border-background shadow-lg">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-left space-y-3">
              <div className="space-y-1">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
                  {barber.name}
                </h1>
                {barber.specialty && (
                  <p className="text-lg text-primary font-medium flex items-center justify-center md:justify-start gap-2">
                    <Scissors className="w-4 h-4" />
                    {barber.specialty}
                  </p>
                )}
              </div>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  Profissional verificado
                </span>
                <span className="flex items-center gap-1.5 bg-muted/50 px-3 py-1.5 rounded-full">
                  <CalendarDays className="w-4 h-4" />
                  Agendamento online
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12">
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
          </div>

          {/* Calendar Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Date Selection */}
            <div className="bg-card rounded-2xl border shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CalendarDays className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Escolha a Data</h2>
                  <p className="text-sm text-muted-foreground">Selecione o dia do agendamento</p>
                </div>
              </div>

              <div className="flex justify-center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  locale={ptBR}
                  className="rounded-xl border-0 p-0 pointer-events-auto"
                  classNames={{
                    months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center",
                    caption_label: "text-sm font-medium",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted",
                    nav_button_previous: "absolute left-1",
                    nav_button_next: "absolute right-1",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                    row: "flex w-full mt-2",
                    cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                    day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 inline-flex items-center justify-center rounded-md text-sm transition-colors hover:bg-muted",
                    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                    day_today: "bg-accent text-accent-foreground",
                    day_outside: "text-muted-foreground opacity-50",
                    day_disabled: "text-muted-foreground opacity-50",
                    day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                    day_hidden: "invisible",
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
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center space-y-3">
                      <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin mx-auto" />
                      <p className="text-sm text-muted-foreground">Buscando horários...</p>
                    </div>
                  </div>
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
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => handleTimeSelect(slot.time)}
                        className={cn(
                          "py-3 px-2 rounded-xl text-sm font-medium transition-all duration-200",
                          slot.available
                            ? "bg-muted/50 hover:bg-primary hover:text-primary-foreground border border-transparent hover:border-primary hover:shadow-md active:scale-95"
                            : "bg-muted/30 text-muted-foreground/50 cursor-not-allowed line-through"
                        )}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
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
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            Agendamento online • Powered by <span className="font-semibold text-primary">GestBarber</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicBarberSchedule;
