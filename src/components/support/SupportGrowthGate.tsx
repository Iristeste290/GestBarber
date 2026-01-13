import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  HeadphonesIcon, 
  Calendar, 
  Users, 
  TrendingUp, 
  Sparkles,
  Crown 
} from "lucide-react";

const SUPPORT_BENEFITS = [
  { icon: Calendar, text: "Configuração da agenda" },
  { icon: Users, text: "Ajuda com clientes" },
  { icon: TrendingUp, text: "Estratégias de crescimento" },
  { icon: Sparkles, text: "Uso do Growth Engine" },
];

export const SupportGrowthGate = () => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <Card className="max-w-lg w-full border-[#C9B27C]/30 bg-gradient-to-br from-[#111111] to-[#0A0A0A]">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br from-[#C9B27C]/20 to-amber-500/20 flex items-center justify-center border border-[#C9B27C]/30">
            <HeadphonesIcon className="w-10 h-10 text-[#C9B27C]" />
          </div>
          <div className="inline-flex items-center justify-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-[#C9B27C]" />
            <span className="text-sm font-medium text-[#C9B27C]">Exclusivo do Growth</span>
          </div>
          <CardTitle className="text-2xl text-[#EDEDED]">
            Suporte humano é um benefício do plano Growth
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-center text-[#EDEDED]/70 leading-relaxed">
            O plano Start permite usar o GestBarber livremente.
            <br />
            O plano Growth inclui suporte direto para ajudar você a ganhar mais dinheiro com sua barbearia.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-2 gap-3">
            {SUPPORT_BENEFITS.map((benefit, i) => (
              <div 
                key={i}
                className="flex items-center gap-2 p-3 rounded-lg bg-[#C9B27C]/10 text-sm text-[#EDEDED]/80"
              >
                <benefit.icon className="w-4 h-4 text-[#C9B27C] flex-shrink-0" />
                <span>{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3 pt-2">
            <Button 
              size="lg" 
              onClick={() => navigate('/planos')}
              className="w-full bg-gradient-to-r from-[#C9B27C] to-[#E5D4A1] hover:from-[#D4BD87] hover:to-[#F0DFA9] text-black font-bold shadow-lg shadow-[#C9B27C]/20"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Quero crescer com suporte
            </Button>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate(-1)}
              className="w-full text-[#EDEDED]/50 hover:text-[#EDEDED]/70"
            >
              Continuar no plano Start
            </Button>
          </div>

          {/* Trust badge */}
          <p className="text-center text-xs text-[#EDEDED]/40">
            ✓ Cancele quando quiser • ✓ Sem fidelidade
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
