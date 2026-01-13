import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Clock, Check, LogOut, Loader2, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface StripePriceData {
  id: string;
  amount: number;
  currency: string;
  nickname: string | null;
  product: string | undefined;
  recurring: {
    interval: string;
  } | null;
}

const SubscriptionExpired = () => {
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [stripePrices, setStripePrices] = useState<StripePriceData[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-plan-prices');
        if (error) throw error;
        setStripePrices(data || []);
      } catch (error) {
        console.error('Erro ao buscar preços:', error);
      } finally {
        setLoadingPrices(false);
      }
    };
    fetchPrices();
  }, []);

  const mensalPrice = stripePrices.find(p => p.id === 'price_1SX04CKtuTWnHVngnvYdIlzZ');

  const formatPrice = (amount: number) => {
    return (amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleSubscribe = async () => {
    setIsCreatingCheckout(true);
    const checkoutWindow = window.open('about:blank', '_blank');
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { planType: 'mensal' },
      });

      if (error) throw error;

      if (data.url && checkoutWindow) {
        checkoutWindow.location.href = data.url;
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        checkoutWindow?.close();
        throw new Error('URL de checkout não retornada');
      }
    } catch (error) {
      checkoutWindow?.close();
      console.error('Erro ao criar checkout:', error);
      toast.error('Erro ao processar pagamento', {
        description: 'Tente novamente mais tarde',
      });
    } finally {
      setIsCreatingCheckout(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const growthFeatures = [
    'Tudo do plano Start',
    'Growth Engine completo',
    'Horários Vazios',
    'Clientes Sumidos',
    'Clientes Problemáticos',
    'Ranking Invisível',
    'Mapa de Clientes',
    'IA do Site + SEO Local',
    'Alertas de dinheiro perdido',
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C9B27C]/20 mb-4">
            <Clock className="w-10 h-10 text-[#C9B27C]" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#EDEDED]">
            Seu plano Growth expirou
          </h1>
          <p className="text-lg text-[#EDEDED]/60 max-w-md mx-auto">
            Para continuar usando as funcionalidades de crescimento, renove seu plano Growth.
          </p>
        </div>

        {/* Growth Plan Card */}
        {loadingPrices ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#C9B27C]" />
          </div>
        ) : (
          <Card className="relative border-[#C9B27C] bg-[#111111] shadow-lg shadow-[#C9B27C]/10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-[#C9B27C] to-[#E8D9A8] text-black shadow-lg">
                <Crown className="w-3 h-3 mr-1" />
                Recomendado
              </Badge>
            </div>
            <CardHeader className="text-center pt-10">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-[#C9B27C] to-[#E8D9A8] flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-black" />
              </div>
              <CardTitle className="text-2xl text-[#EDEDED]">Growth</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-[#C9B27C]">
                  {mensalPrice ? formatPrice(mensalPrice.amount) : 'R$ 32,90'}
                </span>
                <span className="text-[#EDEDED]/60">/mês</span>
              </div>
              <CardDescription className="text-[#EDEDED]/60 mt-2">
                Para crescer e ganhar mais dinheiro
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {growthFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className={`w-4 h-4 flex-shrink-0 ${idx === 0 ? 'text-[#C9B27C]' : 'text-green-500'}`} />
                    <span className={`text-sm ${idx === 0 ? 'text-[#C9B27C] font-semibold' : 'text-[#EDEDED]'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleSubscribe}
                className="w-full bg-[#C9B27C] hover:bg-[#C9B27C]/90 text-black font-bold"
                size="lg"
                disabled={isCreatingCheckout}
              >
                {isCreatingCheckout ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Abrindo...
                  </span>
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Quero crescer
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-sm text-[#EDEDED]/40">
            Pagamento seguro via Stripe • Cancele quando quiser
          </p>
          <p className="text-sm text-[#EDEDED]/60">
            Ou continue usando o plano <span className="font-medium">Start</span> gratuitamente
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/dashboard')}
              className="border-[#333333] text-[#EDEDED] hover:bg-[#1a1a1a]"
            >
              Continuar com Start
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-[#EDEDED]/60 hover:text-[#EDEDED]"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
