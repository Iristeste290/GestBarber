import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TrendIndicatorProps {
  value: number;
  className?: string;
}

export function TrendIndicator({ value, className }: TrendIndicatorProps) {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const isNeutral = value === 0;

  const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus;
  
  const colorClass = isPositive 
    ? "text-green-600 dark:text-green-500" 
    : isNegative 
    ? "text-red-600 dark:text-red-500" 
    : "text-muted-foreground";

  const bgClass = isPositive
    ? "bg-green-500/10"
    : isNegative
    ? "bg-red-500/10"
    : "bg-muted/50";

  return (
    <div className={cn("flex items-center gap-1 text-xs font-medium", colorClass, className)}>
      <div className={cn("p-0.5 rounded-full", bgClass)}>
        <Icon className="h-3 w-3" />
      </div>
      <span>
        {isNeutral ? "0" : `${isPositive ? "+" : ""}${value.toFixed(1)}`}%
      </span>
    </div>
  );
}
