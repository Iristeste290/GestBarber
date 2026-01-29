import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, UserPlus, Calendar, DollarSign } from "lucide-react";
import confetti from "canvas-confetti";

type RecoveryType = 'client_reactivated' | 'slot_filled' | 'no_show_prevented';

interface RecoveryEvent {
  type: RecoveryType;
  value?: number;
  clientName?: string;
}

interface RecoveryAnimationProps {
  event: RecoveryEvent | null;
  onComplete?: () => void;
}

const getEventConfig = (type: RecoveryType) => {
  switch (type) {
    case 'client_reactivated':
      return {
        icon: UserPlus,
        title: "Cliente reativado!",
        color: "text-emerald-500",
        bgColor: "bg-emerald-500/20",
        borderColor: "border-emerald-500/30",
      };
    case 'slot_filled':
      return {
        icon: Calendar,
        title: "Horário preenchido!",
        color: "text-blue-500",
        bgColor: "bg-blue-500/20",
        borderColor: "border-blue-500/30",
      };
    case 'no_show_prevented':
      return {
        icon: CheckCircle,
        title: "Falta evitada!",
        color: "text-amber-500",
        bgColor: "bg-amber-500/20",
        borderColor: "border-amber-500/30",
      };
  }
};

export const RecoveryAnimation = ({ event, onComplete }: RecoveryAnimationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (event) {
      setIsVisible(true);
      
      // Trigger confetti for positive events
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#C9B27C', '#10B981', '#3B82F6'],
      });

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [event, onComplete]);

  if (!event) return null;

  const config = getEventConfig(event.type);
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed bottom-20 right-4 z-50"
        >
          <div className={`p-4 rounded-xl border ${config.borderColor} ${config.bgColor} backdrop-blur-sm shadow-lg`}>
            <div className="flex items-center gap-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className={`p-2 rounded-full ${config.bgColor}`}
              >
                <Icon className={`h-6 w-6 ${config.color}`} />
              </motion.div>
              
              <div>
                <p className={`font-semibold ${config.color}`}>
                  {config.title}
                </p>
                {event.clientName && (
                  <p className="text-sm text-muted-foreground">
                    {event.clientName}
                  </p>
                )}
                {event.value && event.value > 0 && (
                  <div className="flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400">
                    <DollarSign className="h-3 w-3" />
                    <span>+R$ {event.value.toFixed(0)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Hook para usar animações de recuperação
export const useRecoveryAnimation = () => {
  const [event, setEvent] = useState<RecoveryEvent | null>(null);

  const triggerRecovery = useCallback((newEvent: RecoveryEvent) => {
    setEvent(newEvent);
  }, []);

  const clearEvent = useCallback(() => {
    setEvent(null);
  }, []);

  return {
    event,
    triggerRecovery,
    clearEvent,
    RecoveryAnimationComponent: () => (
      <RecoveryAnimation event={event} onComplete={clearEvent} />
    ),
  };
};
