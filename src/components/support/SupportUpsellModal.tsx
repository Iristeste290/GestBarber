import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  TrendingUp, 
  Sparkles,
  CheckCircle,
  Crown
} from "lucide-react";

interface SupportUpsellModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger?: "support_click" | "empty_agenda" | "revenue_drop";
}

const TRIGGER_MESSAGES = {
  support_click: {
    title: "Barbearias Growth recebem ajuda real para crescer",
    subtitle: "Você já tentou acessar o suporte algumas vezes. No Growth, você tem:",
  },
  empty_agenda: {
    title: "Sua agenda pode estar mais cheia",
    subtitle: "Barbearias Growth usam estratégias inteligentes para lotar a agenda:",
  },
  revenue_drop: {
    title: "Vamos reverter essa queda juntos",
    subtitle: "No plano Growth você tem acesso a:",
  },
};

const BENEFITS = [
  { icon: Sparkles, text: "Assistente de Crescimento com IA" },
  { icon: Calendar, text: "Estratégias para lotar a agenda" },
  { icon: TrendingUp, text: "Análise de oportunidades" },
  { icon: CheckCircle, text: "Suporte humano prioritário" },
];

export const SupportUpsellModal = ({ 
  open, 
  onOpenChange, 
  trigger = "support_click" 
}: SupportUpsellModalProps) => {
  const navigate = useNavigate();
  const messages = TRIGGER_MESSAGES[trigger];

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/planos");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-[#111] to-[#0A0A0A] border-[#C9B27C]/30">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-[#C9B27C]/20 to-amber-500/20 flex items-center justify-center border border-[#C9B27C]/30">
            <Crown className="w-8 h-8 text-[#C9B27C]" />
          </div>
          <DialogTitle className="text-xl text-[#EDEDED]">
            {messages.title}
          </DialogTitle>
          <p className="text-sm text-[#EDEDED]/60 mt-2">
            {messages.subtitle}
          </p>
        </DialogHeader>

        <div className="space-y-3 my-4">
          {BENEFITS.map((benefit, idx) => (
            <div 
              key={idx}
              className="flex items-center gap-3 p-3 rounded-lg bg-[#C9B27C]/10 border border-[#C9B27C]/20"
            >
              <benefit.icon className="w-5 h-5 text-[#C9B27C] flex-shrink-0" />
              <span className="text-sm text-[#EDEDED]">{benefit.text}</span>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={handleUpgrade}
            className="w-full bg-gradient-to-r from-[#C9B27C] to-[#E5D4A1] hover:from-[#D4BD87] hover:to-[#F0DFA9] text-black font-bold py-6"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Ativar Growth agora
          </Button>
          
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="w-full text-[#EDEDED]/50 hover:text-[#EDEDED]/70"
          >
            Continuar no Start
          </Button>
        </div>

        <p className="text-center text-xs text-[#EDEDED]/40 mt-2">
          ✓ Cancele quando quiser • ✓ Sem fidelidade
        </p>
      </DialogContent>
    </Dialog>
  );
};
