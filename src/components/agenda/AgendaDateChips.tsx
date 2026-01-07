import { cn } from "@/lib/utils";
import { Calendar, CalendarDays, CalendarRange, Sun } from "lucide-react";

type ViewMode = "day" | "tomorrow" | "week" | "month";

interface AgendaDateChipsProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

const chips: { mode: ViewMode; label: string; icon: React.ElementType }[] = [
  { mode: "day", label: "Hoje", icon: Sun },
  { mode: "tomorrow", label: "Amanhã", icon: Calendar },
  { mode: "week", label: "Semana", icon: CalendarDays },
  { mode: "month", label: "Mês", icon: CalendarRange },
];

export const AgendaDateChips = ({ viewMode, onViewModeChange }: AgendaDateChipsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
      {chips.map(({ mode, label, icon: Icon }) => (
        <button
          key={mode}
          onClick={() => onViewModeChange(mode)}
          className={cn(
            "flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2",
            "active:scale-95",
            viewMode === mode
              ? "bg-primary text-primary-foreground shadow-md"
              : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
};
