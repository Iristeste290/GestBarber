import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Crown, AlertTriangle, User } from "lucide-react";

interface CustomerScoreBadgeProps {
  score?: number;
  status?: 'premium' | 'normal' | 'risk';
  showScore?: boolean;
  size?: 'sm' | 'md';
}

export const CustomerScoreBadge = ({ 
  score = 50, 
  status = 'normal', 
  showScore = false,
  size = 'sm' 
}: CustomerScoreBadgeProps) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'premium':
        return {
          icon: Crown,
          label: 'Premium',
          className: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30 hover:bg-yellow-500/30',
          description: 'Cliente VIP - Alta fidelidade',
        };
      case 'risk':
        return {
          icon: AlertTriangle,
          label: 'Risco',
          className: 'bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30',
          description: 'Cliente com histórico de faltas/cancelamentos',
        };
      default:
        return {
          icon: User,
          label: 'Normal',
          className: 'bg-muted text-muted-foreground border-muted-foreground/30 hover:bg-muted/80',
          description: 'Cliente regular',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="outline" 
          className={`${config.className} ${size === 'sm' ? 'text-xs px-1.5 py-0' : 'text-sm px-2 py-0.5'} cursor-help`}
        >
          <Icon className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} mr-1`} />
          {showScore ? `${score}` : config.label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="text-sm">
          <p className="font-semibold">{config.label} (Score: {score})</p>
          <p className="text-muted-foreground">{config.description}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};
