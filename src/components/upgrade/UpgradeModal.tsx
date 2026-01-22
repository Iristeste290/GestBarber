import { useNavigate } from "react-router-dom";
import { useRef } from "react";
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
  TrendingDown,
  Calendar, 
  CalendarDays,
  CalendarClock,
  Users, 
  UserX,
  DollarSign, 
  MapPin, 
  Sparkles,
  Clock,
  AlertTriangle,
  Target,
  XCircle,
  Timer,
  CalendarX,
  Ban,
  Crown,
  Scissors,
  BarChart3,
  Package,
} from "lucide-react";
import type { TriggerType, UpgradeTrigger } from "@/hooks/useGrowthTriggerEngine";
import { markTriggerDismissed, markTriggerConverted } from "@/hooks/useUpgradeTriggerAnalytics";

interface UpgradeModalProps {
  trigger: UpgradeTrigger | null;
  isOpen: boolean;
  onClose: () => void;
  eventId?: string;
}

// Configuração visual para cada tipo de trigger
const triggerConfig: Record<TriggerType, {
  title: string;
  icon: React.ReactNode;
  buttonText: string;
  gradient: string;
  highlightColor: string;
}> = {
  // 💰 FINANCEIROS
  TRIGGER_MONEY_LOST: {
    title: "Você está perdendo dinheiro com faltas",
    icon: <Ban className="w-8 h-8 text-red-400" />,
    buttonText: "Quero parar de perder dinheiro",
    gradient: "from-red-500/20 to-orange-500/20",
    highlightColor: "red",
  },
  TRIGGER_REVENUE_POTENTIAL: {
    title: "Você está deixando dinheiro na mesa",
    icon: <TrendingUp className="w-8 h-8 text-emerald-400" />,
    buttonText: "Quero ganhar mais",
    gradient: "from-emerald-500/20 to-green-500/20",
    highlightColor: "emerald",
  },
  TRIGGER_REVENUE_STAGNANT: {
    title: "Sua receita está estagnada",
    icon: <TrendingDown className="w-8 h-8 text-amber-400" />,
    buttonText: "Quero voltar a crescer",
    gradient: "from-amber-500/20 to-orange-500/20",
    highlightColor: "amber",
  },
  TRIGGER_COMMISSION_LOST: {
    title: "Comissão perdida pelos barbeiros",
    icon: <Scissors className="w-8 h-8 text-red-400" />,
    buttonText: "Quero recuperar comissões",
    gradient: "from-red-500/20 to-pink-500/20",
    highlightColor: "red",
  },
  // 📊 COMPORTAMENTAIS
  TRIGGER_EMPTY_SLOTS: {
    title: "Sua agenda está ociosa",
    icon: <CalendarX className="w-8 h-8 text-orange-400" />,
    buttonText: "Quero preencher minha agenda",
    gradient: "from-orange-500/20 to-yellow-500/20",
    highlightColor: "orange",
  },
  TRIGGER_RECURRING_EMPTY: {
    title: "Mesmos horários vazios toda semana",
    icon: <CalendarClock className="w-8 h-8 text-orange-400" />,
    buttonText: "Quero preencher esses horários",
    gradient: "from-orange-500/20 to-red-500/20",
    highlightColor: "orange",
  },
  TRIGGER_ABANDONED_BOOKING: {
    title: "Clientes desistiram de agendar",
    icon: <XCircle className="w-8 h-8 text-amber-400" />,
    buttonText: "Quero recuperar esses clientes",
    gradient: "from-amber-500/20 to-yellow-500/20",
    highlightColor: "amber",
  },
  TRIGGER_MANUAL_TIME: {
    title: "Você está gastando tempo demais",
    icon: <Timer className="w-8 h-8 text-blue-400" />,
    buttonText: "Quero automatizar meu negócio",
    gradient: "from-blue-500/20 to-cyan-500/20",
    highlightColor: "blue",
  },
  TRIGGER_LOST_CLIENTS: {
    title: "Clientes sumiram — e seu dinheiro junto",
    icon: <Users className="w-8 h-8 text-purple-400" />,
    buttonText: "Quero recuperar meus clientes",
    gradient: "from-purple-500/20 to-pink-500/20",
    highlightColor: "purple",
  },
  TRIGGER_VIP_CLIENT_LOST: {
    title: "Cliente VIP sumiu",
    icon: <Crown className="w-8 h-8 text-[#C9B27C]" />,
    buttonText: "Quero reativar clientes VIP",
    gradient: "from-[#C9B27C]/20 to-yellow-500/20",
    highlightColor: "gold",
  },
  TRIGGER_WAIT_TIME: {
    title: "Clientes esperando muito",
    icon: <Clock className="w-8 h-8 text-amber-400" />,
    buttonText: "Quero reduzir tempo de espera",
    gradient: "from-amber-500/20 to-orange-500/20",
    highlightColor: "amber",
  },
  // 📈 COMPARATIVOS
  TRIGGER_BENCHMARK_NOSHOW: {
    title: "Sua taxa de falta é muito alta",
    icon: <AlertTriangle className="w-8 h-8 text-red-400" />,
    buttonText: "Quero reduzir faltas",
    gradient: "from-red-500/20 to-orange-500/20",
    highlightColor: "red",
  },
  TRIGGER_BENCHMARK_OCCUPANCY: {
    title: "Ocupação abaixo da média do setor",
    icon: <BarChart3 className="w-8 h-8 text-blue-400" />,
    buttonText: "Quero aumentar minha ocupação",
    gradient: "from-blue-500/20 to-indigo-500/20",
    highlightColor: "blue",
  },
  TRIGGER_NO_NEW_SERVICES: {
    title: "Sua oferta está parada no tempo",
    icon: <Package className="w-8 h-8 text-gray-400" />,
    buttonText: "Quero inovar meus serviços",
    gradient: "from-gray-500/20 to-slate-500/20",
    highlightColor: "gray",
  },
  TRIGGER_COMPETITOR_GROWTH: {
    title: "Concorrentes estão crescendo mais",
    icon: <TrendingUp className="w-8 h-8 text-red-400" />,
    buttonText: "Quero superar a concorrência",
    gradient: "from-red-500/20 to-orange-500/20",
    highlightColor: "red",
  },
  // ⚡ URGÊNCIA/SAZONAIS
  TRIGGER_HIGH_DEMAND: {
    title: "Sua agenda está lotada — hora de crescer",
    icon: <TrendingUp className="w-8 h-8 text-[#C9B27C]" />,
    buttonText: "Quero aumentar meu faturamento",
    gradient: "from-green-500/20 to-emerald-500/20",
    highlightColor: "green",
  },
  TRIGGER_SEASONAL: {
    title: "Prepare-se para a alta temporada",
    icon: <CalendarDays className="w-8 h-8 text-[#C9B27C]" />,
    buttonText: "Quero maximizar vendas",
    gradient: "from-[#C9B27C]/20 to-amber-500/20",
    highlightColor: "gold",
  },
  TRIGGER_CAPACITY_FULL: {
    title: "Você está recusando clientes",
    icon: <UserX className="w-8 h-8 text-red-400" />,
    buttonText: "Quero otimizar minha agenda",
    gradient: "from-red-500/20 to-pink-500/20",
    highlightColor: "red",
  },
  // 🏆 OUTROS
  TRIGGER_RICH_AREA: {
    title: "Você atende clientes de alto valor",
    icon: <MapPin className="w-8 h-8 text-[#C9B27C]" />,
    buttonText: "Quero atrair mais clientes premium",
    gradient: "from-purple-500/20 to-pink-500/20",
    highlightColor: "purple",
  },
  TRIGGER_REVENUE_GROWTH: {
    title: "Sua barbearia já fatura alto",
    icon: <DollarSign className="w-8 h-8 text-[#C9B27C]" />,
    buttonText: "Quero ferramentas profissionais",
    gradient: "from-[#C9B27C]/20 to-yellow-500/20",
    highlightColor: "gold",
  },
  TRIGGER_FEATURE_BLOCK: {
    title: "Esta funcionalidade aumenta seu lucro",
    icon: <Sparkles className="w-8 h-8 text-[#C9B27C]" />,
    buttonText: "Quero desbloquear",
    gradient: "from-[#C9B27C]/20 to-amber-500/20",
    highlightColor: "gold",
  },
};

// Benefícios mostrados no modal baseados no tipo de trigger
const getTriggerBenefits = (type: TriggerType) => {
  const baseBenefits = [
    { icon: Target, text: "Horários vazios preenchidos" },
    { icon: Users, text: "Recuperação de clientes" },
    { icon: MapPin, text: "Mapa de clientes" },
    { icon: Sparkles, text: "Suporte humano prioritário" },
  ];

  // Benefícios específicos por trigger
  const specificBenefits: Partial<Record<TriggerType, typeof baseBenefits>> = {
    TRIGGER_MONEY_LOST: [
      { icon: AlertTriangle, text: "Previsão de no-show com IA" },
      { icon: Clock, text: "Lembretes automáticos" },
      { icon: DollarSign, text: "Confirmação obrigatória" },
      { icon: Users, text: "Lista de clientes problemáticos" },
    ],
    TRIGGER_EMPTY_SLOTS: [
      { icon: Calendar, text: "Preenchimento automático" },
      { icon: Users, text: "Reativação de clientes" },
      { icon: TrendingUp, text: "Promoções inteligentes" },
      { icon: Target, text: "Análise de horários vazios" },
    ],
    TRIGGER_ABANDONED_BOOKING: [
      { icon: XCircle, text: "Recuperação de abandonos" },
      { icon: Clock, text: "Remarketing automático" },
      { icon: Users, text: "Follow-up inteligente" },
      { icon: Target, text: "Análise de desistências" },
    ],
    TRIGGER_MANUAL_TIME: [
      { icon: Timer, text: "Agendamento automático" },
      { icon: Clock, text: "Lembretes automáticos" },
      { icon: DollarSign, text: "Cobranças automáticas" },
      { icon: Calendar, text: "Confirmações automáticas" },
    ],
    // 👥 Fase 2 - Clientes perdidos
    TRIGGER_LOST_CLIENTS: [
      { icon: Users, text: "Reativação automática" },
      { icon: Clock, text: "Mensagens personalizadas" },
      { icon: Target, text: "Promoções de retorno" },
      { icon: Calendar, text: "Agendamento facilitado" },
    ],
    // 💵 Fase 2 - Potencial de receita
    TRIGGER_REVENUE_POTENTIAL: [
      { icon: TrendingUp, text: "Recuperar faltas" },
      { icon: Calendar, text: "Preencher agenda" },
      { icon: Users, text: "Reativar clientes" },
      { icon: Timer, text: "Automatizar processos" },
    ],
  };

  return specificBenefits[type] || baseBenefits;
};

export const UpgradeModal = ({ trigger, isOpen, onClose, eventId }: UpgradeModalProps) => {
  const navigate = useNavigate();
  const closedRef = useRef(false);

  if (!trigger) return null;

  const config = triggerConfig[trigger.type];
  const benefits = getTriggerBenefits(trigger.type);

  const handleUpgrade = () => {
    if (eventId) {
      markTriggerConverted(eventId);
    }
    onClose();
    navigate("/planos");
  };

  const handleDismiss = () => {
    if (eventId && !closedRef.current) {
      closedRef.current = true;
      markTriggerDismissed(eventId);
    }
    onClose();
  };

  const formatMoney = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  // Determinar qual métrica destacar
  const renderHighlight = () => {
    // 💰 Dinheiro perdido
    if (trigger.lostMoney && trigger.lostMoney > 0) {
      return (
        <div className="my-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
          <div className="flex items-center justify-center gap-2 text-red-400 mb-1">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Dinheiro perdido</span>
          </div>
          <div className="text-3xl font-bold text-[#C9B27C]">
            {formatMoney(trigger.lostMoney)}
          </div>
          {trigger.noShowCount && trigger.noShowCount > 0 && (
            <p className="text-xs text-red-300 mt-1">
              em {trigger.noShowCount} agendamentos que falharam
            </p>
          )}
        </div>
      );
    }

    // ❌ Agendamentos abandonados
    if (trigger.abandonedBookings && trigger.abandonedBookings > 0) {
      return (
        <div className="my-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-center">
          <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Clientes que desistiram</span>
          </div>
          <div className="text-3xl font-bold text-[#C9B27C]">
            {trigger.abandonedBookings} clientes
          </div>
          <p className="text-xs text-amber-300 mt-1">
            começaram a agendar mas abandonaram
          </p>
        </div>
      );
    }

    // ⏱️ Tempo desperdiçado
    if (trigger.manualTimeMinutes && trigger.manualTimeMinutes > 0) {
      const hours = Math.round(trigger.manualTimeMinutes / 60 * 10) / 10;
      return (
        <div className="my-4 p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 text-center">
          <div className="flex items-center justify-center gap-2 text-blue-400 mb-1">
            <Timer className="w-4 h-4" />
            <span className="text-sm font-medium">Tempo desperdiçado</span>
          </div>
          <div className="text-3xl font-bold text-[#C9B27C]">
            {hours}h esta semana
          </div>
          <p className="text-xs text-blue-300 mt-1">
            em processos manuais que poderiam ser automáticos
          </p>
        </div>
      );
    }

    // 👥 Clientes perdidos - com cálculo de receita perdida
    if (trigger.lostClients && trigger.lostClients > 0) {
      return (
        <div className="my-4 p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-center">
          <div className="flex items-center justify-center gap-2 text-purple-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Clientes que sumiram</span>
          </div>
          <div className="text-3xl font-bold text-[#C9B27C]">
            {trigger.lostClients} clientes
          </div>
          <p className="text-xs text-purple-300 mt-1">
            não voltaram nos últimos 30 dias
          </p>
          {trigger.lostMoney && trigger.lostMoney > 0 && (
            <p className="text-sm text-purple-200 mt-2 font-medium">
              = {formatMoney(trigger.lostMoney)}/mês em receita perdida
            </p>
          )}
        </div>
      );
    }

    // 💵 Potencial de receita extra
    if (trigger.potentialRevenueMonthly && trigger.potentialRevenueMonthly > 0) {
      return (
        <div className="my-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
          <div className="flex items-center justify-center gap-2 text-emerald-400 mb-1">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">Potencial de ganho extra</span>
          </div>
          <div className="text-3xl font-bold text-[#C9B27C]">
            +{formatMoney(trigger.potentialRevenueMonthly)}/mês
          </div>
          <p className="text-xs text-emerald-300 mt-1">
            com automações do Growth
          </p>
          {trigger.potentialRevenueYearly && trigger.potentialRevenueYearly > 0 && (
            <p className="text-sm text-emerald-200 mt-2 font-medium">
              = +{formatMoney(trigger.potentialRevenueYearly)}/ano
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#111111] to-[#0A0A0A] border-[#C9B27C]/30" onInteractOutside={handleDismiss}>
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

        {/* Highlight da métrica */}
        {renderHighlight()}

        {/* Growth features preview */}
        <div className="space-y-2 py-2">
          <p className="text-sm text-[#EDEDED]/60 text-center">
            Com o plano Growth você terá:
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {benefits.map((feature, i) => (
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
            onClick={handleDismiss}
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
