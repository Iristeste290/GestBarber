import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AgendaEmptyStateProps {
  viewMode: "day" | "tomorrow" | "week" | "month";
  onNewAppointment: () => void;
}

export const AgendaEmptyState = ({ viewMode, onNewAppointment }: AgendaEmptyStateProps) => {
  const getMessage = () => {
    switch (viewMode) {
      case "day":
        return "Nenhum agendamento hoje";
      case "tomorrow":
        return "Nenhum agendamento amanhã";
      case "week":
        return "Nenhum agendamento esta semana";
      case "month":
        return "Nenhum agendamento este mês";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
      <div className={cn(
        "flex h-20 w-20 items-center justify-center rounded-full",
        "bg-muted/50 mb-6"
      )}>
        <Calendar className="h-10 w-10 text-muted-foreground/60" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        {getMessage()}
      </h3>
      
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-xs">
        Que tal criar o primeiro agendamento e começar a organizar sua agenda?
      </p>

      <Button onClick={onNewAppointment} className="gap-2">
        <Plus className="h-4 w-4" />
        Novo Agendamento
      </Button>
    </div>
  );
};
