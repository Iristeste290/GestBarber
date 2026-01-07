import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, Zap, Crown, Sparkles, Clock, AlertTriangle, Calendar, Infinity, Rocket } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";


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
  const { userPlan, loading, isFreemium } = usePlanValidation();
  const [searchParams] = useSearchParams();
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);
  const [stripePrices, setStripePrices] = useState<StripePriceData[]>([]);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [appointmentsUsed, setAppointmentsUsed] = useState<number | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'mensal' | 'anual'>('mensal');
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

    // Buscar agendamentos usados no mês (apenas para freemium)
    const fetchAppointmentsCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar barbeiros do usuário
      const { data: barbers } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user.id);

      if (!barbers || barbers.length === 0) {
        setAppointmentsUsed(0);
        return;
      }

      const barberIds = barbers.map(b => b.id);

      // Início do mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('appointments')
        .select('id', { count: 'exact', head: true })
        .in('barber_id', barberIds)
        .gte('appointment_date', startOfMonth.toISOString().split('T')[0]);

      setAppointmentsUsed(count || 0);
    };

    fetchAppointmentsCount();
  }, []);

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      toast.info('Pagamento cancelado', {
        description: 'Você pode tentar novamente quando quiser.',
      });
      navigate('/planos', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleSubscribe = async (planType: 'mensal' | 'anual') => {
    setIsCreatingCheckout(true);
    
    // Abre nova aba imediatamente para evitar bloqueio de popup
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

  if (loading || loadingPrices) {
    return <FullPageLoader text="Carregando planos..." />;
  }

  const mensalPrice = stripePrices.find(p => p.id === 'price_1SX04CKtuTWnHVngnvYdIlzZ');
  const anualPrice = stripePrices.find(p => p.id === 'price_1SX074KtuTWnHVngd5iTQf1k');

  const formatPrice = (amount: number) => {
    return (amount / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  // Calcular dias restantes do plano Freemium
  const getDaysRemaining = () => {
    if (!userPlan?.currentPeriodEnd) return null;
    const endDate = new Date(userPlan.currentPeriodEnd);
    const today = new Date();
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysRemaining = getDaysRemaining();

  const plans = [
    {
      name: 'Freemium',
      price: 'Grátis',
      period: 'para sempre',
      icon: Sparkles,
      features: [
        { text: 'Até 2 barbeiros', included: true },
        { text: 'Até 50 agendamentos/mês', included: true },
        { text: 'Até 10 serviços', included: true },
        { text: 'Relatórios e previsões', included: true },
        { text: 'Controle de custos', included: true },
        { text: 'Controle de caixa', included: true },
        { text: 'Suporte por e-mail (48h)', included: false },
        { text: 'Produtos', included: false, comingSoon: true },
        { text: 'Sistema de pagamentos', included: false, comingSoon: true },
        { text: 'Metas semanais', included: false, comingSoon: true },
        { text: 'Automações', included: false, comingSoon: true },
        { text: 'IA e Posts automáticos', included: false, comingSoon: true },
      ],
      current: userPlan?.plan === 'freemium',
      cta: null, // Freemium é gratuito, não precisa assinar
      badge: null,
    },
    {
      name: 'Pro',
      price: mensalPrice ? formatPrice(mensalPrice.amount) : 'R$ 97',
      period: '/mês',
      icon: Zap,
      features: [
        { text: 'Barbeiros ilimitados', included: true },
        { text: 'Agendamentos ilimitados', included: true },
        { text: 'Serviços ilimitados', included: true },
        { text: 'Relatórios e previsões', included: true },
        { text: 'Controle de custos', included: true },
        { text: 'Controle de caixa', included: true },
        { text: 'Suporte por e-mail (48h)', included: true },
        { text: 'Produtos ilimitados', included: true, comingSoon: true },
        { text: 'Metas semanais', included: true, comingSoon: true },
        { text: 'Automações completas', included: true, comingSoon: true },
        { text: 'IA e Posts automáticos', included: true, comingSoon: true },
        { text: 'Sistema de pagamentos', included: true, comingSoon: true },
      ],
      current: userPlan?.plan === 'mensal',
      cta: userPlan?.plan !== 'mensal' ? () => handleSubscribe('mensal') : null,
      badge: 'Mais Popular',
    },
    {
      name: 'Premium',
      price: anualPrice ? formatPrice(anualPrice.amount) : 'R$ 294,80',
      originalPrice: mensalPrice ? formatPrice(mensalPrice.amount * 12) : 'R$ 394,80',
      period: '/ano',
      icon: Crown,
      features: [
        { text: 'Tudo do Pro', included: true },
        { text: 'Economia de 3 meses', included: true },
        { text: 'Suporte por e-mail (12h)', included: true },
        { text: 'Prioridade em novos recursos', included: true },
        { text: 'Preço fixo garantido no ano', included: true },
      ],
      current: userPlan?.plan === 'anual',
      cta: userPlan?.plan !== 'anual' ? () => handleSubscribe('anual') : null,
      badge: 'Melhor Valor',
    },
  ];

  return (
    <AppLayout
      title="Planos e Assinaturas"
      description="Escolha o plano ideal para sua barbearia"
    >
      <div className="space-y-8 animate-fade-in">
        {/* Alerta de limite de agendamentos para Freemium */}
        {isFreemium && appointmentsUsed !== null && userPlan && (
          (() => {
            const maxAppointments = userPlan.limits.maxAppointmentsPerMonth;
            const percentUsed = (appointmentsUsed / maxAppointments) * 100;
            const remaining = maxAppointments - appointmentsUsed;
            
            // Mostrar alerta se usar >= 70% do limite
            if (percentUsed >= 70) {
              const isNearLimit = percentUsed >= 90;
              const isAtLimit = appointmentsUsed >= maxAppointments;
              
              return (
                <Alert variant={isAtLimit ? "destructive" : "default"} className={isNearLimit && !isAtLimit ? "border-amber-500 bg-amber-500/10" : ""}>
                  <AlertTriangle className={`h-4 w-4 ${isAtLimit ? '' : isNearLimit ? 'text-amber-500' : ''}`} />
                  <AlertTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {isAtLimit 
                      ? 'Limite de agendamentos atingido!' 
                      : isNearLimit 
                        ? 'Limite de agendamentos quase atingido!' 
                        : 'Atenção ao limite de agendamentos'
                    }
                  </AlertTitle>
                  <AlertDescription className="space-y-3">
                    <p>
                      {isAtLimit 
                        ? `Você usou todos os ${maxAppointments} agendamentos do mês. Faça upgrade para continuar agendando.`
                        : `Você já usou ${appointmentsUsed} de ${maxAppointments} agendamentos este mês. Restam apenas ${remaining} agendamentos.`
                      }
                    </p>
                    <div className="space-y-1">
                      <Progress value={Math.min(percentUsed, 100)} className="h-2" />
                      <p className="text-xs text-muted-foreground">{appointmentsUsed}/{maxAppointments} agendamentos usados</p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => handleSubscribe('mensal')}
                      className={isAtLimit ? "" : "bg-amber-500 hover:bg-amber-600"}
                      disabled={isCreatingCheckout}
                    >
                      <Crown className="h-4 w-4 mr-1" />
                      Fazer Upgrade para Ilimitado
                    </Button>
                  </AlertDescription>
                </Alert>
              );
            }
            return null;
          })()
        )}

        {userPlan && (
          <Card className={`${isFreemium && daysRemaining !== null && daysRemaining <= 7 ? 'border-amber-500/50 bg-amber-500/5' : 'glass-card'}`}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Plano Atual
                {isFreemium && daysRemaining !== null && daysRemaining <= 7 && (
                  <Badge variant="destructive" className="animate-pulse">
                    Expirando em breve
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span>Você está no plano</span>
                  <Badge variant="secondary">{userPlan.plan.toUpperCase()}</Badge>
                  {userPlan.currentPeriodEnd && !isFreemium && (
                    <span>
                      • Válido até {new Date(userPlan.currentPeriodEnd).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
                {isFreemium && daysRemaining !== null && (
                  <div className={`flex items-center gap-2 mt-2 p-3 rounded-lg ${daysRemaining <= 7 ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' : 'bg-muted'}`}>
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">
                      {daysRemaining === 0 
                        ? 'Seu plano expira hoje!' 
                        : daysRemaining === 1 
                          ? 'Falta 1 dia para o plano expirar' 
                          : `Faltam ${daysRemaining} dias para o plano expirar`
                      }
                    </span>
                    {daysRemaining <= 7 && (
                      <Button 
                        size="sm" 
                        onClick={() => handleSubscribe('mensal')}
                        className="ml-auto bg-amber-500 hover:bg-amber-600"
                        disabled={isCreatingCheckout}
                      >
                        <Crown className="h-4 w-4 mr-1" />
                        Fazer Upgrade
                      </Button>
                    )}
                  </div>
                )}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pt-6 mt-2">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isHighlighted = plan.badge === 'Mais Popular';
            return (
              <Card
                key={plan.name}
                className={`relative overflow-visible mt-4 ${
                  plan.current
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : isHighlighted
                      ? 'border-primary/50 shadow-md'
                      : 'glass-card hover:border-primary/50 transition-all'
                } ${isHighlighted ? 'sm:scale-105 sm:z-10' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <Badge className="bg-gradient-to-r from-primary to-accent whitespace-nowrap shadow-lg text-xs sm:text-sm px-3 py-1">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                {plan.current && (
                  <div className="absolute -top-4 right-2 sm:right-4 z-20">
                    <Badge variant="secondary" className="whitespace-nowrap shadow-lg text-xs sm:text-sm px-3 py-1 bg-background border">
                      Plano Atual
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-3 sm:pb-4 pt-4 sm:pt-6">
                  <div className="mx-auto mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl sm:text-2xl">{plan.name}</CardTitle>
                  <div className="mt-2 sm:mt-4 flex flex-col items-center">
                    {'originalPrice' in plan && plan.originalPrice && (
                      <span className="text-sm sm:text-base text-muted-foreground line-through">
                        {plan.originalPrice}
                      </span>
                    )}
                    <div>
                      <span className="text-2xl sm:text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm sm:text-base">{plan.period}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <ul className="space-y-2 sm:space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        )}
                        <span
                          className={`text-sm sm:text-base ${
                            feature.included
                              ? 'text-foreground'
                              : 'text-muted-foreground line-through'
                          }`}
                        >
                          {feature.text}
                        </span>
                        {'comingSoon' in feature && feature.comingSoon && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/50 text-amber-600 dark:text-amber-400 flex-shrink-0">
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            Em breve
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="px-4 sm:px-6 pb-4 sm:pb-6">
                  {plan.cta ? (
                    <Button
                      onClick={plan.cta}
                      className="w-full"
                      size="lg"
                      disabled={isCreatingCheckout}
                    >
                      {isCreatingCheckout ? (
                        <span className="flex items-center gap-2 text-sm sm:text-base">
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                          Abrindo...
                        </span>
                      ) : 'Assinar Agora'}
                    </Button>
                  ) : plan.current ? (
                    <Button className="w-full" size="lg" variant="outline" disabled>
                      Plano Atual
                    </Button>
                  ) : (
                    <Button className="w-full" size="lg" variant="outline" disabled>
                      Não Disponível
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Aviso sobre recursos em desenvolvimento */}
        <Alert className="border-amber-500/30 bg-amber-500/5">
          <Rocket className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-600 dark:text-amber-400">MVP em evolução</AlertTitle>
          <AlertDescription className="text-sm">
            Alguns recursos marcados como <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/50 text-amber-600 dark:text-amber-400 mx-1"><Clock className="w-2.5 h-2.5 mr-0.5 inline" />Em breve</Badge> 
            estão em desenvolvimento ativo e serão liberados gradualmente. Ao assinar, você garante acesso assim que forem lançados, 
            sem custo adicional!
          </AlertDescription>
        </Alert>

        {/* Tabela Comparativa */}
        <Card className="glass-card overflow-hidden">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  Comparativo de Recursos
                </CardTitle>
                <CardDescription>
                  Veja todas as diferenças entre os planos
                </CardDescription>
              </div>
              
              {/* Toggle Mensal/Anual */}
              <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                <button
                  onClick={() => setBillingPeriod('mensal')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    billingPeriod === 'mensal'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Mensal
                </button>
                <button
                  onClick={() => setBillingPeriod('anual')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    billingPeriod === 'anual'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Anual
                  <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-600 dark:text-green-400">
                    -17%
                  </Badge>
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[200px] font-semibold">Recurso</TableHead>
                    <TableHead className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Sparkles className="w-5 h-5 text-muted-foreground" />
                        <span>Freemium</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center bg-primary/5">
                      <div className="flex flex-col items-center gap-1">
                        <Zap className="w-5 h-5 text-primary" />
                        <span className="text-primary font-semibold">Pro</span>
                        <Badge variant="secondary" className="text-xs">Popular</Badge>
                      </div>
                    </TableHead>
                    <TableHead className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <Crown className="w-5 h-5 text-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400 font-semibold">Premium</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Limites */}
                  <TableRow>
                    <TableCell className="font-medium">Barbeiros</TableCell>
                    <TableCell className="text-center">Até 2</TableCell>
                    <TableCell className="text-center bg-primary/5">
                      <span className="flex items-center justify-center gap-1 text-primary font-medium">
                        <Infinity className="w-4 h-4" /> Ilimitado
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <Infinity className="w-4 h-4" /> Ilimitado
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Agendamentos/mês</TableCell>
                    <TableCell className="text-center">Até 50</TableCell>
                    <TableCell className="text-center bg-primary/5">
                      <span className="flex items-center justify-center gap-1 text-primary font-medium">
                        <Infinity className="w-4 h-4" /> Ilimitado
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <Infinity className="w-4 h-4" /> Ilimitado
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Serviços</TableCell>
                    <TableCell className="text-center">Até 10</TableCell>
                    <TableCell className="text-center bg-primary/5">
                      <span className="flex items-center justify-center gap-1 text-primary font-medium">
                        <Infinity className="w-4 h-4" /> Ilimitado
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <Infinity className="w-4 h-4" /> Ilimitado
                      </span>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        Produtos
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-muted-foreground border-muted-foreground/30">
                          <Clock className="w-2.5 h-2.5 mr-0.5" />
                          Em breve
                        </Badge>
                      </span>
                    </TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5">
                      <span className="flex items-center justify-center gap-1 text-primary font-medium">
                        <Infinity className="w-4 h-4" /> Ilimitado
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                        <Infinity className="w-4 h-4" /> Ilimitado
                      </span>
                    </TableCell>
                  </TableRow>

                  {/* Features */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-muted-foreground text-sm">
                      Funcionalidades
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Automações WhatsApp</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">IA e Posts Automáticos</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Relatórios e Previsões</TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Sistema de Pagamentos</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Metas Semanais</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Controle de Custos</TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Controle de Caixa</TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                  </TableRow>

                  {/* Suporte */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-muted-foreground text-sm">
                      Suporte e Benefícios
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Suporte por E-mail</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5">48h</TableCell>
                    <TableCell className="text-center text-amber-600 dark:text-amber-400 font-medium">12h</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Prioridade em Novos Recursos</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-5 h-5 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Preço Fixo Garantido</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-5 h-5 text-muted-foreground mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-500 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Economia</TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center bg-primary/5">-</TableCell>
                    <TableCell className="text-center text-green-600 dark:text-green-400 font-medium">3 meses grátis</TableCell>
                  </TableRow>

                  {/* Preço */}
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold text-lg">Preço</TableCell>
                    <TableCell className="text-center">
                      <span className="text-2xl font-bold">Grátis</span>
                    </TableCell>
                    <TableCell className="text-center bg-primary/5">
                      <div className="flex flex-col items-center">
                        {billingPeriod === 'mensal' ? (
                          <>
                            <span className="text-2xl font-bold text-primary">
                              {mensalPrice ? formatPrice(mensalPrice.amount) : 'R$ 97'}
                            </span>
                            <span className="text-sm text-muted-foreground">/mês</span>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-primary">
                              {anualPrice ? formatPrice(Math.round(anualPrice.amount / 12)) : 'R$ 81'}
                            </span>
                            <span className="text-sm text-muted-foreground">/mês</span>
                            <span className="text-xs text-muted-foreground">
                              ({anualPrice ? formatPrice(anualPrice.amount) : 'R$ 970'}/ano)
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {anualPrice ? formatPrice(anualPrice.amount) : 'R$ 970'}
                        </span>
                        <span className="text-sm text-muted-foreground">/ano</span>
                        <Badge
                          variant="secondary"
                          className="mt-1 text-xs bg-green-500/10 text-green-600"
                        >
                          3 meses grátis
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* CTAs */}
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell className="text-center py-4">
                      {userPlan?.plan === 'freemium' ? (
                        <Badge variant="outline">Plano Atual</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center bg-primary/5 py-4">
                      {(billingPeriod === 'mensal' && userPlan?.plan === 'mensal') || 
                       (billingPeriod === 'anual' && userPlan?.plan === 'anual') ? (
                        <Badge>Plano Atual</Badge>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => handleSubscribe(billingPeriod)}
                          disabled={isCreatingCheckout}
                        >
                          {isCreatingCheckout ? (
                            <span className="flex items-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Abrindo...
                            </span>
                          ) : billingPeriod === 'mensal' ? 'Assinar Pro Mensal' : 'Assinar Pro Anual'}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      {userPlan?.plan === 'anual' ? (
                        <Badge className="bg-amber-500">Plano Atual</Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-500 text-amber-600 hover:bg-amber-500/10"
                          onClick={() => handleSubscribe('anual')}
                          disabled={isCreatingCheckout}
                        >
                          {isCreatingCheckout ? (
                            <span className="flex items-center gap-2">
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              Processando...
                            </span>
                          ) : 'Assinar Premium Anual'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Precisa de ajuda para escolher?</CardTitle>
            <CardDescription>
              {isFreemium 
                ? "Faça upgrade para um plano pago e tenha acesso ao suporte prioritário."
                : "Entre em contato conosco e vamos te ajudar a encontrar o plano ideal para sua barbearia."
              }
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex gap-2 flex-wrap">
            {isFreemium ? (
              <Button 
                onClick={() => {
                  const plansSection = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-3');
                  plansSection?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <Crown className="w-4 h-4 mr-2" />
                Ver Planos Disponíveis
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline"
                  onClick={() => {
                    window.open("mailto:suportegestbarber@gmail.com?subject=Dúvida sobre planos", "_blank");
                  }}
                >
                  Falar com Suporte
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText("suportegestbarber@gmail.com");
                    toast.success("E-mail copiado!", {
                      description: "suportegestbarber@gmail.com",
                    });
                  }}
                >
                  Copiar E-mail
                </Button>
              </>
            )}
          </CardFooter>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Planos;