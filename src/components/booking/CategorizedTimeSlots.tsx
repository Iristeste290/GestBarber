import { cn } from "@/lib/utils";
import { Sun, Sunrise, Moon } from "lucide-react";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface CategorizedTimeSlotsProps {
  slots: TimeSlot[];
  onSelect: (time: string) => void;
}

interface TimeCategory {
  label: string;
  icon: React.ReactNode;
  slots: TimeSlot[];
}

const categorizeSlots = (slots: TimeSlot[]): TimeCategory[] => {
  const morning: TimeSlot[] = [];
  const afternoon: TimeSlot[] = [];
  const evening: TimeSlot[] = [];

  slots.forEach((slot) => {
    const hour = parseInt(slot.time.split(":")[0], 10);
    if (hour < 12) {
      morning.push(slot);
    } else if (hour < 18) {
      afternoon.push(slot);
    } else {
      evening.push(slot);
    }
  });

  return [
    { label: "Manhã", icon: <Sunrise className="w-4 h-4" />, slots: morning },
    { label: "Tarde", icon: <Sun className="w-4 h-4" />, slots: afternoon },
    { label: "Noite", icon: <Moon className="w-4 h-4" />, slots: evening },
  ].filter((cat) => cat.slots.length > 0);
};

export const CategorizedTimeSlots = ({ slots, onSelect }: CategorizedTimeSlotsProps) => {
  const categories = categorizeSlots(slots);

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {categories.map((category) => {
        const availableInCategory = category.slots.filter((s) => s.available).length;
        
        return (
          <div key={category.label} className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{category.icon}</span>
              <h3 className="font-semibold text-foreground">{category.label}</h3>
              {availableInCategory > 0 && (
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {availableInCategory} disponíveis
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {category.slots.map((slot) => (
                <button
                  key={slot.time}
                  disabled={!slot.available}
                  onClick={() => onSelect(slot.time)}
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
          </div>
        );
      })}
    </div>
  );
};
