import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { useEngagementMetrics } from "@/hooks/useEngagementMetrics";
import { formatCurrency } from "@/utils/growthOpportunityCalculator";
import { motion, AnimatePresence } from "framer-motion";

export const DailyLossTracker = () => {
  const navigate = useNavigate();
  const { isStart, loading: planLoading } = usePlanValidation();
  const { data: metrics } = useEngagementMetrics();
  const [isVisible, setIsVisible] = useState(true);

  // Verificar se já foi descartado hoje
  useEffect(() => {
    const dismissed = sessionStorage.getItem('daily-loss-tracker-dismissed');
    const today = new Date().toDateString();
    if (dismissed === today) {
      setIsVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    sessionStorage.setItem('daily-loss-tracker-dismissed', new Date().toDateString());
    setIsVisible(false);
  };

  // P1 FIX: Só mostrar para usuários Start com perdas significativas e dados reais
  if (planLoading || !isStart || !metrics || !isVisible) return null;
  if (metrics.weeklyLostRevenue < 50) return null;
  
  // Verificar se há dados reais (ticket médio válido)
  if (metrics.avgTicket <= 0) return null;

  // Calcular potencial de ganho adicional
  const potentialGain = Math.round(metrics.weeklyLostRevenue * 0.6);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card className="border-opportunity/30 bg-gradient-to-r from-opportunity/10 via-opportunity/5 to-transparent">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-opportunity/20 shrink-0">
                <TrendingUp className="h-6 w-6 text-opportunity" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground flex items-center gap-2 mb-1">
                  💰 Oportunidades perdidas esta semana
                </h3>
                
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-opportunity">
                    +{formatCurrency(potentialGain)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    que você poderia ter faturado
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {metrics.weeklyNoShows} falta(s) • {metrics.weeklyCancellations} cancelamento(s) = {formatCurrency(metrics.weeklyLostRevenue)} perdidos
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs h-8 px-3"
                  onClick={handleDismiss}
                >
                  Depois
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/planos')}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground h-8 px-3"
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Ativar Growth Engine
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};