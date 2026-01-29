import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Lightbulb, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";

const EDUCATIONAL_TIPS = [
  {
    id: "empty-slots",
    message: "Barbeiros que usam o Growth Engine costumam recuperar até 40% dos horários vazios.",
    context: ["dashboard", "agenda"],
  },
  {
    id: "inactive-clients",
    message: "Relatórios avançados mostram quais clientes não voltam — e como reconquistá-los.",
    context: ["dashboard", "relatorios"],
  },
  {
    id: "peak-hours",
    message: "Descobrir os horários mais lucrativos ajuda a otimizar preços e campanhas.",
    context: ["relatorios"],
  },
  {
    id: "no-show",
    message: "Lembretes automáticos reduzem em até 60% as faltas de clientes.",
    context: ["agenda"],
  },
  {
    id: "client-map",
    message: "Saber de onde vêm seus clientes ajuda a direcionar marketing local.",
    context: ["relatorios"],
  },
  {
    id: "revenue-forecast",
    message: "Previsão de faturamento ajuda a planejar melhor seus gastos e investimentos.",
    context: ["dashboard"],
  },
];

interface EducationalTipsProps {
  context: "dashboard" | "agenda" | "relatorios";
}

export const EducationalTips = ({ context }: EducationalTipsProps) => {
  const navigate = useNavigate();
  const { isStart, loading } = usePlanValidation();
  const [dismissedTips, setDismissedTips] = useState<string[]>([]);
  const [currentTip, setCurrentTip] = useState<typeof EDUCATIONAL_TIPS[0] | null>(null);

  useEffect(() => {
    // Carregar tips dismissadas do localStorage
    const dismissed = localStorage.getItem('dismissed-tips');
    if (dismissed) {
      setDismissedTips(JSON.parse(dismissed));
    }
  }, []);

  useEffect(() => {
    // Selecionar uma tip aleatória do contexto atual que não foi dismissada
    const availableTips = EDUCATIONAL_TIPS.filter(
      tip => tip.context.includes(context) && !dismissedTips.includes(tip.id)
    );
    
    if (availableTips.length > 0) {
      const randomIndex = Math.floor(Math.random() * availableTips.length);
      setCurrentTip(availableTips[randomIndex]);
    } else {
      setCurrentTip(null);
    }
  }, [context, dismissedTips]);

  const dismissTip = () => {
    if (!currentTip) return;
    
    const newDismissed = [...dismissedTips, currentTip.id];
    setDismissedTips(newDismissed);
    localStorage.setItem('dismissed-tips', JSON.stringify(newDismissed));
  };

  // Não mostrar para Growth ou se loading
  if (loading || !isStart || !currentTip) return null;

  return (
    <Card className="border-[#C9B27C]/20 bg-gradient-to-r from-[#C9B27C]/5 to-transparent">
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#C9B27C]/10 shrink-0">
            <Lightbulb className="h-4 w-4 text-[#C9B27C]" />
          </div>
          
          <p className="text-sm text-muted-foreground flex-1">
            {currentTip.message}
          </p>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/planos')}
              className="text-[#C9B27C] hover:text-[#C9B27C] hover:bg-[#C9B27C]/10 text-xs h-7 px-2"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Saiba mais
            </Button>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={dismissTip}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
