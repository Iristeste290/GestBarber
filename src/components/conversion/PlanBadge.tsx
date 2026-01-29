import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";

interface PlanBadgeProps {
  compact?: boolean;
}

export const PlanBadge = ({ compact = false }: PlanBadgeProps) => {
  const navigate = useNavigate();
  const { isGrowth, isStart, loading } = usePlanValidation();

  if (loading) return null;

  if (isGrowth) {
    return (
      <Badge 
        variant="secondary" 
        className="bg-gradient-to-r from-[#C9B27C] to-[#E8D9A8] text-black font-medium"
      >
        <Sparkles className="h-3 w-3 mr-1" />
        Growth
      </Badge>
    );
  }

  if (compact) {
    return (
      <Badge 
        variant="outline" 
        className="text-muted-foreground cursor-pointer hover:bg-accent transition-colors"
        onClick={() => navigate('/planos')}
      >
        Start
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="text-muted-foreground">
        Plano Start
      </Badge>
      <Button 
        size="sm" 
        variant="ghost"
        onClick={() => navigate('/planos')}
        className="text-[#C9B27C] hover:text-[#C9B27C] hover:bg-[#C9B27C]/10 text-xs px-2 h-7"
      >
        <TrendingUp className="h-3 w-3 mr-1" />
        Evoluir
      </Button>
    </div>
  );
};
