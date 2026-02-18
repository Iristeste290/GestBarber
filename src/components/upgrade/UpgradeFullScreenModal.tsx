import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Crown, CheckCircle2, TrendingUp,
  Calendar, BarChart3, Sparkles, DollarSign, Headphones
} from "lucide-react";
import { markTriggerConverted, markTriggerDismissed } from "@/hooks/useUpgradeTriggerAnalytics";

interface UpgradeFullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureName?: string;
  triggerMessage?: string;
  lostMoney?: number;
  eventId?: string;
}

const BENEFITS = [
  { icon: Calendar, label: "Agendamentos ilimitados" },
  { icon: BarChart3, label: "Relatórios avançados" },
  { icon: Sparkles, label: "Automação com IA" },
  { icon: DollarSign, label: "Controle financeiro completo" },
  { icon: Headphones, label: "Suporte prioritário" },
];

const COMPARISON = [
  { feature: "Agendamentos", start: "100 no total", growth: "Ilimitados" },
  { feature: "Clientes", start: "100 no total", growth: "Ilimitados" },
  { feature: "Barbeiros", start: "Até 3", growth: "Ilimitados" },
  { feature: "Relatórios IA", start: "❌", growth: "✅ Completos" },
  { feature: "Automação", start: "❌", growth: "✅ Inclusa" },
];

export const UpgradeFullScreenModal = ({
  isOpen,
  onClose,
  featureName,
  triggerMessage,
  lostMoney,
  eventId,
}: UpgradeFullScreenModalProps) => {
  const navigate = useNavigate();

  // Travar scroll do fundo
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleUpgrade = () => {
    if (eventId) markTriggerConverted(eventId);
    onClose();
    navigate("/planos");
  };

  const handleDismiss = () => {
    if (eventId) markTriggerDismissed(eventId);
    onClose();
  };

  const formatMoney = (v: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(v);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[1000] bg-black/70 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Modal — full screen mobile, centralizado desktop */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
            className="fixed z-[1001] bottom-0 left-0 right-0 sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-[#0D0D0D] sm:rounded-2xl border-t border-[#C9B27C]/25 sm:border sm:border-[#C9B27C]/25 flex flex-col max-h-[96dvh] sm:max-h-[88vh] overflow-y-auto">
              
              {/* Barra de arraste (mobile) */}
              <div className="sm:hidden flex justify-center pt-3 pb-1 flex-shrink-0">
                <div className="w-10 h-1 rounded-full bg-white/15" />
              </div>

              {/* Linha dourada */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#C9B27C] to-transparent opacity-60" />

              {/* Botão fechar */}
              <button
                onClick={handleDismiss}
                className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                aria-label="Fechar"
              >
                <X className="w-4 h-4 text-white/70" />
              </button>

              {/* Conteúdo */}
              <div className="px-6 pt-5 pb-8 sm:pt-7 sm:pb-8 space-y-6">

                {/* Header */}
                <div className="space-y-3 pr-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#C9B27C]/15 border border-[#C9B27C]/30">
                    <Crown className="w-3.5 h-3.5 text-[#C9B27C]" />
                    <span className="text-[11px] font-semibold text-[#C9B27C] tracking-wide uppercase">
                      Plano Growth
                    </span>
                  </div>

                  <h2 className="text-[22px] sm:text-2xl font-bold text-white leading-tight">
                    Você pode estar deixando dinheiro na mesa
                  </h2>
                  <p className="text-sm text-white/55 leading-relaxed">
                    {triggerMessage ||
                      "O plano Growth libera ferramentas que aumentam seus agendamentos e reduzem faltas."}
                  </p>
                </div>

                {/* Destaque de perda financeira */}
                {lostMoney && lostMoney > 50 && (
                  <div className="rounded-xl bg-red-500/10 border border-red-500/25 p-4 text-center">
                    <p className="text-xs text-red-300/80 font-medium uppercase tracking-wide mb-1">
                      Estimativa de receita perdida
                    </p>
                    <p className="text-3xl font-bold text-[#C9B27C]">
                      {formatMoney(lostMoney)}
                    </p>
                  </div>
                )}

                {/* Benefícios */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                    O que você desbloqueia
                  </p>
                  <div className="grid grid-cols-1 gap-2">
                    {BENEFITS.map((b) => (
                      <div
                        key={b.label}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8"
                      >
                        <div className="w-7 h-7 rounded-lg bg-[#C9B27C]/15 flex items-center justify-center flex-shrink-0">
                          <b.icon className="w-3.5 h-3.5 text-[#C9B27C]" />
                        </div>
                        <span className="text-sm text-white/85 font-medium">{b.label}</span>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400/80 ml-auto flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comparativo */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">
                    Comparativo de planos
                  </p>
                  <div className="rounded-xl overflow-hidden border border-white/10">
                    {/* Header */}
                    <div className="grid grid-cols-3 text-center py-2 bg-white/5">
                      <span className="text-xs text-white/40 font-medium">Recurso</span>
                      <span className="text-xs text-white/40 font-medium">Start</span>
                      <span className="text-xs text-[#C9B27C] font-semibold">Growth</span>
                    </div>
                    {COMPARISON.map((row, i) => (
                      <div
                        key={row.feature}
                        className={`grid grid-cols-3 text-center py-2.5 px-2 ${
                          i % 2 === 0 ? "bg-white/[0.03]" : ""
                        }`}
                      >
                        <span className="text-xs text-white/60 text-left pl-2">{row.feature}</span>
                        <span className="text-xs text-white/35">{row.start}</span>
                        <span className="text-xs text-emerald-400 font-medium">{row.growth}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTAs */}
                <div className="space-y-3 pt-1">
                  <button
                    onClick={handleUpgrade}
                    className="w-full h-14 rounded-2xl bg-gradient-to-r from-[#C9B27C] to-[#E5D4A1] hover:from-[#D4BD87] hover:to-[#F0DFA9] text-black font-bold text-[15px] flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-[#C9B27C]/25"
                  >
                    <TrendingUp className="w-5 h-5" />
                    Quero parar de perder dinheiro
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="w-full py-3 text-sm text-white/35 hover:text-white/55 transition-colors"
                  >
                    Continuar no plano Start
                  </button>
                </div>

                {/* Trust */}
                <p className="text-center text-[11px] text-white/25">
                  ✓ Cancele quando quiser &nbsp;•&nbsp; ✓ Sem fidelidade
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
