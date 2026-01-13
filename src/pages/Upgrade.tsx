import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Check, Crown, Rocket, Shield, Users, Calendar, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const Upgrade = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("trial_ends_at, subscription_status")
        .eq("id", session.user.id)
        .single();

      if (profile?.subscription_status === "active") {
        navigate("/painel");
        return;
      }

      if (profile?.trial_ends_at) {
        const now = new Date();
        const trialEndsAt = new Date(profile.trial_ends_at);
        const diffTime = trialEndsAt.getTime() - now.getTime();
        const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setDaysRemaining(Math.max(0, days));
        setIsExpired(now > trialEndsAt);
      }
    };

    checkStatus();
  }, [navigate]);

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: { planType: "mensal" },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      console.error("Erro ao criar checkout:", error);
      toast.error("Erro ao processar upgrade. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Users, text: "Barbeiros ilimitados" },
    { icon: Calendar, text: "Agendamentos ilimitados" },
    { icon: TrendingUp, text: "Relatórios avançados" },
    { icon: Shield, text: "Motor de crescimento" },
    { icon: Rocket, text: "Automações WhatsApp" },
    { icon: Crown, text: "Suporte prioritário" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-6">
        {/* Alerta de Expiração */}
        <Card className={`border-2 ${isExpired ? "border-destructive bg-destructive/5" : "border-amber-500 bg-amber-500/5"}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${isExpired ? "bg-destructive/10" : "bg-amber-500/10"}`}>
                <AlertTriangle className={`h-6 w-6 ${isExpired ? "text-destructive" : "text-amber-500"}`} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isExpired ? "text-destructive" : "text-amber-600"}`}>
                  {isExpired 
                    ? "🚫 Seu período de teste acabou" 
                    : `⏳ Seu GestBarber será bloqueado em ${daysRemaining} dia${daysRemaining !== 1 ? "s" : ""}`
                  }
                </h2>
                <p className="text-muted-foreground mt-1">
                  {isExpired 
                    ? "Para continuar usando o GestBarber e não perder seus clientes e faturamento, ative o plano Growth."
                    : "Não perca seus clientes e faturamento. Ative o plano Growth agora."
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card do Plano Growth */}
        <Card className="border-2 border-primary shadow-lg">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-2 p-3 bg-primary/10 rounded-full w-fit">
              <Crown className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Plano Growth</CardTitle>
            <CardDescription>Tudo que você precisa para crescer</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Preço */}
            <div className="text-center">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-4xl font-bold">R$ 97</span>
                <span className="text-muted-foreground">/mês</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                ou R$ 970/ano (2 meses grátis)
              </p>
            </div>

            {/* Features */}
            <div className="grid gap-3">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="p-1.5 bg-primary/10 rounded-full">
                    <Check className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-sm">{feature.text}</span>
                </div>
              ))}
            </div>

            {/* Botão de Upgrade */}
            <Button 
              onClick={handleUpgrade} 
              disabled={loading}
              className="w-full h-12 text-lg font-semibold"
              size="lg"
            >
              {loading ? (
                "Processando..."
              ) : (
                <>
                  <Crown className="mr-2 h-5 w-5" />
                  ATIVAR PLANO GROWTH
                </>
              )}
            </Button>

            {/* Garantia */}
            <p className="text-center text-xs text-muted-foreground">
              ✅ Garantia de 7 dias • Cancele quando quiser
            </p>
          </CardContent>
        </Card>

        {/* Link para voltar (só se não expirou) */}
        {!isExpired && (
          <div className="text-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/painel")}
              className="text-muted-foreground"
            >
              Continuar no período de teste
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Upgrade;
