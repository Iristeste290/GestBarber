import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";

interface AgendaHeaderProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  appointmentCount: number;
  onNewAppointment: () => void;
}

export const AgendaHeader = ({
  selectedDate,
  onDateChange,
  appointmentCount,
  onNewAppointment,
}: AgendaHeaderProps) => {
  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  
  const formatDateLabel = () => {
    if (isToday) {
      return `Hoje • ${format(selectedDate, "dd MMM", { locale: ptBR })}`;
    }
    return format(selectedDate, "EEEE • dd MMM", { locale: ptBR });
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Left side - Date and count */}
      <div className="flex items-center gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="ghost" 
              className="h-auto p-0 hover:bg-transparent group"
            >
              <div className="flex items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold capitalize leading-tight md:text-2xl">
                    {formatDateLabel()}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {appointmentCount === 0 
                      ? "Nenhum agendamento" 
                      : appointmentCount === 1 
                        ? "1 agendamento"
                        : `${appointmentCount} agendamentos`
                    }
                  </p>
                </div>
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarPicker
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && onDateChange(date)}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Right side - New appointment button (desktop) */}
      <Button 
        onClick={onNewAppointment}
        size="lg"
        className="hidden sm:flex gap-2 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
      >
        <Plus className="h-5 w-5" />
        Novo Agendamento
      </Button>
    </div>
  );
};
