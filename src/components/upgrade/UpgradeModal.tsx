import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Calendar, 
  Users, 
  DollarSign, 
  MapPin, 
  Sparkles,
  Clock,
  AlertTriangle,
  Target
} from "lucide-react";
import type { TriggerType, UpgradeTrigger } from "@/hooks/useGrowthTriggerEngine";

interface UpgradeModalProps {
  trigger: UpgradeTrigger | null;
  isOpen: boolean;
  onClose: () => void;
}

const triggerConfig: Record<TriggerType, {
  title: string;
  icon: React.ReactNode;
  buttonText: string;
  gradient: string;
}> = {
  TRIGGER_EMPTY_SLOTS: {
    title: "Você está perdendo dinheiro",
    icon: <Clock className="w-8 h-8 text-[#C9B27C]" />,
    buttonText: "Quero preencher minha agenda",
    gradient: "from-red-500/20 to-orange-500/20",
  },
  TRIGGER_LOST_CLIENTS: {
    title: "Clientes sumiram — e seu dinheiro junto",
    icon: <Users className="w-8 h-8 text-[#C9B27C]" />,
    buttonText: "Quero recuperar esses clientes",
    gradient: "from-orange-500/20 to-yellow-500/20",
  },
  TRIGGER_HIGH_DEMAND: {
    title: "Sua agenda está lotada — hora de crescer",
    icon: <TrendingUp className="w-8 h-8 text-[#C9B27C]" />,
    buttonText: "Quero aumentar meu faturamento",
    gradient: "from-green-500/20 to-emerald-500/20",
  },
  TRIGGER_RICH_AREA: {
    title: "Você atende clientes de alto valor",
    icon: <MapPin className="w-8 h-8 text-[#C9B27C]" />,
    buttonText: "Quero atrair mais clientes premium",
    gradient: "from-purple-500/20 to-pink-500/20",
  },
  TRIGGER_REVENUE_GROWTH: {
    title: "Sua barbearia já fatura alto",
    icon: <DollarSign className="w-8 h-8 text-[#C9B27C]" />,
    buttonText: "Quero ferramentas profissionais",
    gradient: "from-[#C9B27C]/20 to-yellow-500/20",
  },
  TRIGGER_FEATURE_BLOCK: {
    title: "Esta funcionalidade faz você ganhar mais",
    icon: <Sparkles className="w-8 h-8 text-[#C9B27C]" />,
    buttonText: "Quero desbloquear",
    gradient: "from-[#C9B27C]/20 to-amber-500/20",
  },
};

export const UpgradeModal = ({ trigger, isOpen, onClose }: UpgradeModalProps) => {
  const navigate = useNavigate();

  if (!trigger) return null;

  const config = triggerConfig[trigger.type];

  const handleUpgrade = () => {
    onClose();
    navigate("/planos");
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#111111] to-[#0A0A0A] border-[#C9B27C]/30">
        <DialogHeader className="text-center space-y-4">
          {/* Icon with gradient background */}
          <div className={`mx-auto w-20 h-20 rounded-full bg-gradient-to-br ${config.gradient} flex items-center justify-center border border-[#C9B27C]/30`}>
            {config.icon}
          </div>
          
          <DialogTitle className="text-2xl font-bold text-[#EDEDED]">
            {config.title}
          </DialogTitle>
          
          <DialogDescription className="text-[#EDEDED]/80 text-base">
            {trigger.message}
          </DialogDescription>
        </DialogHeader>

        {/* Money lost highlight */}
        {trigger.lostMoney && trigger.lostMoney > 0 && (
          <div className="my-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
            <div className="flex items-center justify-center gap-2 text-red-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Dinheiro perdido</span>
            </div>
            <div className="text-3xl font-bold text-[#C9B27C]">
              {formatMoney(trigger.lostMoney)}
            </div>
          </div>
        )}

        {/* Lost clients highlight */}
        {trigger.lostClients && trigger.lostClients > 0 && !trigger.lostMoney && (
          <div className="my-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/30 text-center">
            <div className="flex items-center justify-center gap-2 text-orange-400 mb-1">
              <Users className="w-4 h-4" />
              <span className="text-sm font-medium">Clientes perdidos</span>
            </div>
            <div className="text-3xl font-bold text-[#C9B27C]">
              {trigger.lostClients} clientes
            </div>
          </div>
        )}

        {/* Growth features preview */}
        <div className="space-y-2 py-2">
          <p className="text-sm text-[#EDEDED]/60 text-center">
            Com o plano Growth você terá:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {[
              { icon: Target, text: "Horários vazios preenchidos" },
              { icon: Users, text: "Recuperação de clientes" },
              { icon: MapPin, text: "Mapa de clientes" },
              { icon: Sparkles, text: "Suporte humano prioritário" },
            ].map((feature, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 p-2 rounded-lg bg-[#C9B27C]/10 text-[#EDEDED]/80"
              >
                <feature.icon className="w-4 h-4 text-[#C9B27C]" />
                <span>{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleUpgrade}
            size="lg"
            className="w-full bg-gradient-to-r from-[#C9B27C] to-[#E5D4A1] hover:from-[#D4BD87] hover:to-[#F0DFA9] text-black font-bold text-base h-12 shadow-lg shadow-[#C9B27C]/20"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            {config.buttonText}
          </Button>
          
          <button
            onClick={onClose}
            className="text-sm text-[#EDEDED]/40 hover:text-[#EDEDED]/60 transition-colors"
          >
            Continuar no plano Start
          </button>
        </div>

        {/* Trust badge */}
        <p className="text-center text-xs text-[#EDEDED]/40 pt-2">
          ✓ Cancele quando quiser • ✓ Sem fidelidade • ✓ Suporte prioritário
        </p>
      </DialogContent>
    </Dialog>
  );
};
