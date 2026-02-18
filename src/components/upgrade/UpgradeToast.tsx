import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Crown, X, ChevronRight } from "lucide-react";

interface UpgradeToastProps {
  isOpen: boolean;
  featureName?: string;
  onDismiss: () => void;
  onExpand: () => void;
}

// Controle de frequência — cooldown 4h
const TOAST_COOLDOWN_KEY = "upgrade_toast_last_shown";
const TOAST_COOLDOWN_MS = 4 * 60 * 60 * 1000;

export const canShowUpgradeToast = (): boolean => {
  try {
    const last = localStorage.getItem(TOAST_COOLDOWN_KEY);
    if (!last) return true;
    return Date.now() - Number(last) > TOAST_COOLDOWN_MS;
  } catch {
    return true;
  }
};

export const recordUpgradeToastShown = () => {
  try {
    localStorage.setItem(TOAST_COOLDOWN_KEY, String(Date.now()));
  } catch {}
};

export const UpgradeToast = ({ isOpen, featureName, onDismiss, onExpand }: UpgradeToastProps) => {
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      dismissedRef.current = false;
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="upgrade-toast"
          initial={{ opacity: 0, y: -16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-[64px] left-1/2 -translate-x-1/2 z-[999] w-[calc(100vw-24px)] max-w-sm"
          style={{ pointerEvents: "auto" }}
        >
          <div className="relative flex items-start gap-3 rounded-2xl border border-[#C9B27C]/30 bg-[#111111]/95 backdrop-blur-md shadow-2xl shadow-black/60 px-4 py-3.5">
            {/* Ícone premium */}
            <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-[#C9B27C]/30 to-amber-600/20 border border-[#C9B27C]/40 flex items-center justify-center">
              <Crown className="w-4 h-4 text-[#C9B27C]" />
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white leading-tight">
                Recurso exclusivo do Growth
              </p>
              <p className="text-[11px] text-white/55 mt-0.5 leading-snug">
                {featureName
                  ? `"${featureName}" aumenta seu faturamento.`
                  : "Desbloqueie e aumente seu faturamento."}
              </p>

              {/* Botões */}
              <div className="flex items-center gap-3 mt-2.5">
                <button
                  onClick={onExpand}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#C9B27C] hover:text-amber-400 transition-colors"
                >
                  Ver como liberar
                  <ChevronRight className="w-3 h-3" />
                </button>
                <span className="text-white/20">•</span>
                <button
                  onClick={onDismiss}
                  className="text-[11px] text-white/35 hover:text-white/55 transition-colors"
                >
                  Depois
                </button>
              </div>
            </div>

            {/* Fechar */}
            <button
              onClick={onDismiss}
              className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/10 transition-all"
              aria-label="Fechar"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Barra dourada no topo */}
            <div className="absolute top-0 left-4 right-4 h-[1.5px] rounded-full bg-gradient-to-r from-transparent via-[#C9B27C]/60 to-transparent" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
