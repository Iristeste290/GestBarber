import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, Users, Scissors, Calendar } from "lucide-react";

interface UsageLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: "clients" | "barbers" | "appointments";
  current: number;
  max: number;
}

const resourceConfig = {
  clients: {
    title: "Limite de clientes atingido",
    description: "Você atingiu o limite de 100 clientes no plano Start. Para cadastrar mais clientes e crescer sua barbearia, faça upgrade para o plano Growth.",
    icon: <Users className="w-8 h-8 text-amber-400" />,
    label: "Clientes",
  },
  barbers: {
    title: "Limite de barbeiros atingido",
    description: "Você atingiu o limite de 3 barbeiros no plano Start. Para adicionar mais barbeiros à sua equipe, faça upgrade para o plano Growth.",
    icon: <Scissors className="w-8 h-8 text-amber-400" />,
    label: "Barbeiros",
  },
  appointments: {
    title: "Limite de agendamentos atingido",
    description: "Você atingiu o limite de 100 agendamentos no plano Start. Para continuar agendando e não perder clientes, faça upgrade para o plano Growth.",
    icon: <Calendar className="w-8 h-8 text-amber-400" />,
    label: "Agendamentos",
  },
};

export const UsageLimitModal = ({ isOpen, onClose, resource, current, max }: UsageLimitModalProps) => {
  const navigate = useNavigate();
  const config = resourceConfig[resource];
  const percentage = Math.min(100, Math.round((current / max) * 100));

  const handleUpgrade = () => {
    onClose();
    navigate("/planos");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/30">
            {config.icon}
          </div>

          <DialogTitle className="text-xl font-bold">
            {config.title}
          </DialogTitle>

          <DialogDescription className="text-base">
            {config.description}
          </DialogDescription>
        </DialogHeader>

        {/* Usage bar */}
        <div className="my-4 p-4 rounded-xl bg-muted/50 border border-border space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{config.label}</span>
            <span className="font-bold text-foreground">{current}/{max}</span>
          </div>
          <Progress value={percentage} className="h-3" />
          <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Limite atingido — {percentage}% usado</span>
          </div>
        </div>

        {/* Benefits */}
        <div className="space-y-2 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No plano Growth você tem:</p>
          <ul className="space-y-1.5">
            <li className="flex items-center gap-2">✅ Clientes ilimitados</li>
            <li className="flex items-center gap-2">✅ Barbeiros ilimitados</li>
            <li className="flex items-center gap-2">✅ Agendamentos ilimitados</li>
            <li className="flex items-center gap-2">✅ Growth Engine + IA</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleUpgrade}
            size="lg"
            className="w-full bg-[#C9B27C] hover:bg-[#C9B27C]/90 text-black font-bold"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            Fazer upgrade para Growth
          </Button>

          <button
            onClick={onClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continuar no plano Start
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
