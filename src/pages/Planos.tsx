import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, TrendingUp, Briefcase, Sparkles, Crown } from "lucide-react";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

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

const Planos = () => {
  const { userPlan, loading, isGrowth, isStart } = usePlanValidation();
  const [searchParams] = useSearchParams();
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
        toast.error('Erro ao carregar preços dos planos');
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
  }, []);

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast.info('Pagamento cancelado', {
        description: 'Você pode tentar novamente quando quiser.',
      });
      navigate('/planos', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubscribe = async () => {
    // Verificar se o usuário está autenticado
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast.info('Faça login para assinar', {
        description: 'Você será redirecionado para a página de login.',
      });
      navigate('/auth');
      return;
    }

    setIsCreatingCheckout(true);
    const checkoutWindow = window.open('about:blank', '_blank');
    
    try {
      // Usar o plano mensal por padrão (Growth)
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

  if (loading || loadingPrices) {
    return <FullPageLoader text="Carregando planos..." />;
  }

  const mensalPrice = stripePrices.find(p => p.id === 'price_1SopUFKtuTWnHVngHNaXabSC');
  
  const formatPrice = (amount: number) => {
    return (amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const startFeatures = [
    { text: 'Agenda completa', included: true },
    { text: 'Gestão de clientes', included: true },
    { text: 'Barbeiros ilimitados', included: true },
    { text: 'Serviços ilimitados', included: true },
    { text: 'Controle de caixa', included: true },
    { text: 'Controle de custos', included: true },
    { text: 'Relatórios básicos', included: true },
    { text: 'Growth Engine', included: false },
    { text: 'Mapa de Clientes', included: false },
    { text: 'Ranking', included: false },
    { text: 'IA do Site', included: false },
    { text: 'Alertas Inteligentes', included: false },
    { text: 'Produtos', included: false, comingSoon: true },
    { text: 'Metas', included: false, comingSoon: true },
    { text: 'Automação', included: false, comingSoon: true },
    { text: 'Posts Prontos', included: false, comingSoon: true },
    { text: 'Pagamentos', included: false, comingSoon: true },
    { text: 'Config WhatsApp', included: false, comingSoon: true },
  ];

  const growthFeatures = [
    { text: 'Tudo do Start', included: true, highlight: true },
    { text: 'Growth Engine completo', included: true },
    { text: 'Horários Vazios', included: true },
    { text: 'Clientes Sumidos', included: true },
    { text: 'Clientes Problemáticos', included: true },
    { text: 'Ranking Invisível', included: true },
    { text: 'Mapa de Clientes', included: true },
    { text: 'IA do Site', included: true },
    { text: 'SEO Local (Google Maps)', included: true },
    { text: 'Alertas de dinheiro perdido', included: true },
    { text: 'Suporte humano prioritário', included: true },
    { text: 'Produtos', included: true, comingSoon: true },
    { text: 'Metas', included: true, comingSoon: true },
    { text: 'Automação', included: true, comingSoon: true },
    { text: 'Posts Prontos', included: true, comingSoon: true },
    { text: 'Pagamentos', included: true, comingSoon: true },
    { text: 'Config WhatsApp', included: true, comingSoon: true },
  ];

  return (
    <AppLayout
      title="Planos"
      description="Escolha como você quer usar o GestBarber"
    >
      <div className="space-y-8 animate-fade-in">
        {/* Header motivacional */}
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
            Você quer só trabalhar ou quer <span className="text-[#C9B27C]">crescer</span>?
          </h2>
          <p className="text-muted-foreground">
            O plano Start organiza sua barbearia. O plano Growth faz ela crescer.
          </p>
        </div>

        {/* Cards dos planos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {/* Start Plan */}
          <Card className={`relative ${isStart ? 'border-primary ring-2 ring-primary/20' : 'border-border'}`}>
            {isStart && (
              <div className="absolute -top-3 right-4">
                <Badge variant="secondary" className="shadow-lg">
                  Plano Atual
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-muted flex items-center justify-center">
                <Briefcase className="w-7 h-7 text-muted-foreground" />
              </div>
              <CardTitle className="text-2xl">Start</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">Grátis</span>
                <span className="text-muted-foreground ml-2">para sempre</span>
              </div>
              <CardDescription className="mt-2">
                Para organizar sua barbearia
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {startFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    {feature.included ? (
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                      {feature.text}
                    </span>
                    {feature.comingSoon && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Em breve
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                disabled
              >
                {isStart ? 'Plano Atual' : 'Plano Gratuito'}
              </Button>
            </CardFooter>
          </Card>

          {/* Growth Plan */}
          <Card className={`relative border-[#C9B27C] shadow-lg shadow-[#C9B27C]/10 ${isGrowth ? 'ring-2 ring-[#C9B27C]/30' : ''}`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-[#C9B27C] to-[#E8D9A8] text-black shadow-lg">
                <Crown className="w-3 h-3 mr-1" />
                Recomendado
              </Badge>
            </div>
            {isGrowth && (
              <div className="absolute -top-3 right-4">
                <Badge variant="secondary" className="shadow-lg bg-[#C9B27C] text-black">
                  Plano Atual
                </Badge>
              </div>
            )}
            <CardHeader className="text-center pb-4 pt-8">
              <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-gradient-to-br from-[#C9B27C] to-[#E8D9A8] flex items-center justify-center">
                <TrendingUp className="w-7 h-7 text-black" />
              </div>
              <CardTitle className="text-2xl">Growth</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-[#C9B27C]">
                  {mensalPrice ? formatPrice(mensalPrice.amount) : 'R$ 59,90'}
                </span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <CardDescription className="mt-2">
                Para crescer e ganhar mais dinheiro
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {growthFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Check className={`w-4 h-4 flex-shrink-0 ${feature.highlight ? 'text-[#C9B27C]' : 'text-green-500'}`} />
                    <span className={`text-sm ${feature.highlight ? 'font-semibold text-[#C9B27C]' : 'text-foreground'}`}>
                      {feature.text}
                    </span>
                    {feature.comingSoon && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Em breve
                      </Badge>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              {isGrowth ? (
                <Button
                  variant="outline"
                  className="w-full border-[#C9B27C] text-[#C9B27C]"
                  size="lg"
                  disabled
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Plano Atual
                </Button>
              ) : (
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
              )}
            </CardFooter>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 text-sm text-muted-foreground">
          <p>Pagamento seguro via Stripe • Cancele quando quiser</p>
          <p>
            <span className="text-[#C9B27C] font-medium">Dúvida?</span>{' '}
            O plano Growth se paga sozinho com o dinheiro que você vai deixar de perder.
          </p>
        </div>
      </div>
    </AppLayout>
  );
};

export default Planos;
