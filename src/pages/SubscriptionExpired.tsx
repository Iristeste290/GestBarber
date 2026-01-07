import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Clock, Zap, Check, LogOut, Loader2 } from "lucide-react";
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
  const anualPrice = stripePrices.find(p => p.id === 'price_1SX074KtuTWnHVngd5iTQf1k');

  const formatPrice = (amount: number) => {
    return (amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const handleSubscribe = async (planType: 'mensal' | 'anual') => {
    setIsCreatingCheckout(true);
    const checkoutWindow = window.open('about:blank', '_blank');
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { planType },
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/20 mb-4">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Seu período gratuito expirou
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Os 30 dias do plano Freemium acabaram. Para continuar usando o BarberPro, 
            escolha um dos planos abaixo e desbloqueie todo o potencial da sua barbearia.
          </p>
        </div>

        {/* Plans */}
        {loadingPrices ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pro Plan */}
          <Card className="relative border-primary/50 shadow-lg hover:shadow-xl transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-primary to-accent shadow-lg">
                Mais Popular
              </Badge>
            </div>
            <CardHeader className="text-center pt-8">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Zap className="w-7 h-7 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl">Pro</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">
                  {mensalPrice ? formatPrice(mensalPrice.amount) : 'R$ 97,00'}
                </span>
                <span className="text-muted-foreground">/mês</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  'Barbeiros ilimitados',
                  'Agendamentos ilimitados',
                  'Serviços ilimitados',
                  'Produtos ilimitados',
                  'Automações completas',
                  'IA e Posts automáticos',
                  'Relatórios e previsões',
                  'Sistema de pagamentos',
                  'Suporte por e-mail (48h)',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSubscribe('mensal')}
                className="w-full"
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
                    <Zap className="w-4 h-4 mr-2" />
                    Assinar Pro
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Premium Plan */}
          <Card className="relative hover:shadow-xl transition-all">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="secondary" className="shadow-lg">
                Melhor Valor
              </Badge>
            </div>
            <CardHeader className="text-center pt-8">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <CardTitle className="text-2xl">Premium</CardTitle>
              <div className="mt-4">
                {mensalPrice && (
                  <span className="text-sm text-muted-foreground line-through">
                    {formatPrice(mensalPrice.amount * 12)}
                  </span>
                )}
                <div>
                  <span className="text-4xl font-bold">
                    {anualPrice ? formatPrice(anualPrice.amount) : 'R$ 970,00'}
                  </span>
                  <span className="text-muted-foreground">/ano</span>
                </div>
                <Badge variant="outline" className="mt-2 text-green-600 border-green-600">
                  Economia de 3 meses
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {[
                  'Tudo do plano Pro',
                  'Economia de 3 meses',
                  'Suporte por e-mail (12h)',
                  'Prioridade em novos recursos',
                  'Preço fixo garantido no ano',
                ].map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => handleSubscribe('anual')}
                className="w-full"
                size="lg"
                variant="outline"
                disabled={isCreatingCheckout}
              >
                {isCreatingCheckout ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Abrindo...
                  </span>
                ) : (
                  <>
                    <Crown className="w-4 h-4 mr-2" />
                    Assinar Premium
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        )}

        {/* Footer */}
        <div className="text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Pagamento seguro via Stripe • Cancele quando quiser
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sair da conta
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionExpired;
