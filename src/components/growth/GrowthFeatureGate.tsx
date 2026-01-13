import { ReactNode, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Lock, Sparkles, DollarSign, Target, Users, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";

interface GrowthFeatureGateProps {
  children: ReactNode;
  featureName: string;
  featureDescription?: string;
  compact?: boolean;
  /** Se true, dispara o modal de upgrade ao invés de mostrar inline */
  useModal?: boolean;
}

// Features que fazem parte do Growth
const GROWTH_FEATURES = [
  "Growth Engine",
  "Mapa de Clientes",
  "Ranking Invisível",
  "IA do Site",
  "SEO Local",
  "Alertas Inteligentes",
  "Horários Vazios",
  "Clientes Sumidos",
  "Clientes Problemáticos",
  "Relatórios Avançados",
  "Campanhas",
  "Posts IA",
];

// Benefícios do Growth para mostrar no card
const GROWTH_BENEFITS = [
  { icon: Target, text: "Preenche horários vazios" },
  { icon: Users, text: "Recupera clientes" },
  { icon: MapPin, text: "Mapa de clientes" },
  { icon: DollarSign, text: "Suporte humano prioritário" },
];

export const GrowthFeatureGate = ({
  children,
  featureName,
  featureDescription,
  compact = false,
  useModal = false,
}: GrowthFeatureGateProps) => {
  const { isGrowth, loading } = usePlanValidation();
  const navigate = useNavigate();

  // Enquanto carrega, mostra o children (ou skeleton)
  if (loading) {
    return <>{children}</>;
  }

  // Se é Growth, mostra o conteúdo normalmente
  if (isGrowth) {
    return <>{children}</>;
  }

  // Se não é Growth, mostra o bloqueio
  if (compact) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="text-center p-4 space-y-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#C9B27C]/20">
              <Lock className="w-5 h-5 text-[#C9B27C]" />
            </div>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              {featureName} faz parte do plano <span className="font-bold text-[#C9B27C]">Growth</span>
            </p>
            <Button 
              size="sm" 
              onClick={() => navigate('/planos')}
              className="bg-[#C9B27C] hover:bg-[#C9B27C]/90 text-black"
            >
              <TrendingUp className="w-3 h-3 mr-1" />
              Quero crescer
            </Button>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">
          {children}
        </div>
      </div>
    );
  }

  return (
    <Card className="border-[#C9B27C]/30 bg-gradient-to-br from-[#111111] to-[#0A0A0A]">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-[#C9B27C]/20 to-amber-500/20 flex items-center justify-center border border-[#C9B27C]/30">
          <Lock className="w-8 h-8 text-[#C9B27C]" />
        </div>
        <CardTitle className="text-xl text-[#EDEDED]">{featureName}</CardTitle>
        <CardDescription className="text-[#EDEDED]/60">
          {featureDescription || "Esta funcionalidade faz parte do plano Growth — ela existe para fazer sua barbearia ganhar mais dinheiro."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Benefícios do Growth */}
        <div className="grid grid-cols-2 gap-2">
          {GROWTH_BENEFITS.map((benefit, i) => (
            <div 
              key={i}
              className="flex items-center gap-2 p-2 rounded-lg bg-[#C9B27C]/10 text-xs text-[#EDEDED]/80"
            >
              <benefit.icon className="w-4 h-4 text-[#C9B27C] flex-shrink-0" />
              <span>{benefit.text}</span>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-center gap-2 text-sm text-[#EDEDED]/60">
          <Sparkles className="w-4 h-4 text-[#C9B27C]" />
          <span>Desbloqueie todo o potencial da sua barbearia</span>
        </div>
        
        <Button 
          size="lg" 
          onClick={() => navigate('/planos')}
          className="w-full bg-gradient-to-r from-[#C9B27C] to-[#E5D4A1] hover:from-[#D4BD87] hover:to-[#F0DFA9] text-black font-bold shadow-lg shadow-[#C9B27C]/20"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Quero parar de perder dinheiro
        </Button>

        {/* Trust badge */}
        <p className="text-center text-xs text-[#EDEDED]/40">
          ✓ Cancele quando quiser • ✓ Sem fidelidade
        </p>
      </CardContent>
    </Card>
  );
};

// Hook para verificar se uma feature é bloqueada
export const useGrowthFeature = (featureName: string) => {
  const { isGrowth, loading } = usePlanValidation();
  
  return {
    isBlocked: !loading && !isGrowth,
    isGrowth,
    loading,
  };
};
