import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Calendar, Users, Zap, ArrowRight, Crown, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import confetti from "canvas-confetti";

interface SubscriptionStatus {
  subscribed: boolean;
  plan: string | null;
  status: string | null;
  subscription_end?: string;
  message?: string;
}

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const confettiFired = useRef(false);
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "processing" | "error">("loading");
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionStatus | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  // Verificar assinatura
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const { data, error } = await supabase.functions.invoke<SubscriptionStatus>("check-subscription");

        if (error) throw error;

        setSubscriptionData(data);

        if (data?.subscribed && data?.status === "active") {
          setVerificationStatus("success");
        } else if (data?.status === "incomplete" || data?.status === "past_due") {
          setVerificationStatus("processing");
          // Tentar novamente após 3 segundos
          if (retryCount < maxRetries) {
            setTimeout(() => setRetryCount(prev => prev + 1), 3000);
          }
        } else {
          // Pode estar processando ainda, tentar novamente
          if (retryCount < maxRetries) {
            setTimeout(() => setRetryCount(prev => prev + 1), 2000);
          } else {
            setVerificationStatus("error");
          }
        }
      } catch (error) {
        console.error("Erro ao verificar assinatura:", error);
        if (retryCount < maxRetries) {
          setTimeout(() => setRetryCount(prev => prev + 1), 2000);
        } else {
          setVerificationStatus("error");
        }
      }
    };

    checkSubscription();
  }, [retryCount]);

  // Confetti quando sucesso
  useEffect(() => {
    if (verificationStatus !== "success" || confettiFired.current) return;
    confettiFired.current = true;

    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4CAF50', '#2196F3']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4CAF50', '#2196F3']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#FFD700', '#FFA500', '#FF6B6B', '#4CAF50', '#2196F3']
    });

    frame();
  }, [verificationStatus]);

  const handleRetry = () => {
    setRetryCount(0);
    setVerificationStatus("loading");
  };

  const nextSteps = [
    {
      icon: Users,
      title: "Adicione seus barbeiros",
      description: "Cadastre sua equipe para começar a gerenciar agendamentos",
      action: () => navigate("/barbeiros"),
      cta: "Ir para Barbeiros"
    },
    {
      icon: Calendar,
      title: "Configure sua agenda",
      description: "Defina horários de funcionamento e serviços disponíveis",
      action: () => navigate("/agenda"),
      cta: "Ver Agenda"
    },
    {
      icon: Zap,
      title: "Ative automações",
      description: "Configure lembretes automáticos via WhatsApp para seus clientes",
      action: () => navigate("/automacao"),
      cta: "Configurar Automações"
    }
  ];

  // Tela de loading
  if (verificationStatus === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-fade-in">
          <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Verificando pagamento...</h1>
            <p className="text-muted-foreground">Aguarde enquanto confirmamos sua assinatura</p>
          </div>
        </div>
      </div>
    );
  }

  // Tela de processando
  if (verificationStatus === "processing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-amber-500/5 flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-fade-in max-w-md">
          <div className="w-20 h-20 mx-auto bg-amber-500/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Pagamento em processamento</h1>
            <p className="text-muted-foreground">
              Seu pagamento está sendo processado. Isso pode levar alguns segundos...
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Tentativa {retryCount + 1} de {maxRetries}
          </p>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (verificationStatus === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-destructive/5 flex items-center justify-center p-4">
        <div className="text-center space-y-6 animate-fade-in max-w-md">
          <div className="w-20 h-20 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Não foi possível confirmar</h1>
            <p className="text-muted-foreground">
              Não conseguimos confirmar sua assinatura agora. Se o pagamento foi realizado, 
              sua assinatura será ativada em alguns minutos.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleRetry} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar novamente
            </Button>
            <Button onClick={() => navigate("/planos")}>
              Ver meu plano
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Precisa de ajuda?{" "}
            <a href="mailto:suportegestbarber@gmail.com" className="text-primary hover:underline">
              Entre em contato
            </a>
          </p>
        </div>
      </div>
    );
  }

  const planName = subscriptionData?.plan === "anual" ? "Premium" : "Pro";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 animate-fade-in">
        {/* Header de sucesso */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl animate-pulse" />
            <div className="relative w-24 h-24 mx-auto bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              Pagamento Confirmado!
            </h1>
            <p className="text-xl text-muted-foreground">
              Seja bem-vindo ao plano {planName}! 🎉
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full">
            <Crown className="w-5 h-5 text-primary" />
            <span className="font-medium text-primary">Todos os recursos liberados</span>
          </div>

          {subscriptionData?.subscription_end && (
            <p className="text-sm text-muted-foreground">
              Válido até {new Date(subscriptionData.subscription_end).toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>

        {/* Card de próximos passos */}
        <Card className="border-2 border-primary/20 shadow-xl">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Próximos Passos</CardTitle>
            <CardDescription>
              Configure sua barbearia para aproveitar ao máximo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {nextSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={step.action}
                    className="flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  >
                    {step.cta}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Botão principal */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            size="lg"
            onClick={() => navigate("/painel")}
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
          >
            Ir para o Painel
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/planos")}
          >
            Ver meu plano
          </Button>
        </div>

        {/* Suporte */}
        <p className="text-center text-sm text-muted-foreground">
          Precisa de ajuda? Entre em contato pelo{" "}
          <a 
            href="mailto:suportegestbarber@gmail.com" 
            className="text-primary hover:underline"
          >
            suportegestbarber@gmail.com
          </a>
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccess;
