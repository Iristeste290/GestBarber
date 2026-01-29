import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trophy, TrendingUp, BarChart3, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";
import confetti from "canvas-confetti";

const MILESTONES = [20, 40, 60, 80, 100];

export const MilestoneUpsell = () => {
  const navigate = useNavigate();
  const { isStart, loading: planLoading } = usePlanValidation();
  const [showDialog, setShowDialog] = useState(false);
  const [milestone, setMilestone] = useState(0);

  const { data: appointmentsCount } = useQuery({
    queryKey: ['monthly-appointments-count'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 0;

      const now = new Date();
      const start = format(startOfMonth(now), 'yyyy-MM-dd');
      const end = format(endOfMonth(now), 'yyyy-MM-dd');

      // P2 FIX: Corrigido para buscar pelo user_id do barbeiro (dono da barbearia)
      const { count } = await supabase
        .from('appointments')
        .select('id, barber:barbers!inner(user_id)', { count: 'exact', head: true })
        .eq('barber.user_id', user.id)
        .gte('appointment_date', start)
        .lte('appointment_date', end)
        .in('status', ['completed', 'scheduled']);

      return count || 0;
    },
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (planLoading || !isStart || !appointmentsCount) return;

    // Verificar se atingiu um milestone
    const reachedMilestone = MILESTONES.find(m => 
      appointmentsCount >= m && appointmentsCount < m + 5
    );

    if (!reachedMilestone) return;

    // Verificar se já mostrou este milestone
    const shownMilestones = JSON.parse(localStorage.getItem('shown-milestones') || '[]');
    if (shownMilestones.includes(reachedMilestone)) return;

    // Mostrar celebração
    setMilestone(reachedMilestone);
    setShowDialog(true);
    
    // Salvar que mostrou
    localStorage.setItem('shown-milestones', JSON.stringify([...shownMilestones, reachedMilestone]));

    // Confetti!
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  }, [appointmentsCount, isStart, planLoading]);

  const handleUpgrade = () => {
    setShowDialog(false);
    navigate('/planos');
  };

  if (!isStart) return null;

  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-[#C9B27C]/20">
              <Trophy className="h-5 w-5 text-[#C9B27C]" />
            </div>
            <DialogTitle className="flex items-center gap-2">
              Parabéns! 
              <Sparkles className="h-4 w-4 text-[#C9B27C]" />
            </DialogTitle>
          </div>
          <DialogDescription className="text-left text-base">
            Você já atendeu <strong className="text-foreground">{milestone} clientes</strong> este mês!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Você está usando o GestBarber como um profissional de verdade.
          </p>
          
          <div className="p-4 rounded-lg bg-[#C9B27C]/10 border border-[#C9B27C]/20">
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-[#C9B27C] mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Barbeiros no Growth usam dados para crescer
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Descubra quais serviços dão mais lucro, quais horários são mais rentáveis e como aumentar seu ticket médio.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => setShowDialog(false)}>
            Continuar assim
          </Button>
          <Button
            onClick={handleUpgrade}
            className="bg-[#C9B27C] hover:bg-[#C9B27C]/90 text-black"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Ver como crescer mais
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
