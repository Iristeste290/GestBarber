import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Send, CheckCircle, HelpCircle, Clock, ArrowLeft, Crown, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { getDeviceId } from "@/lib/device-id";

const TIPOS_SOLICITACAO = [
  "Dúvida sobre o app",
  "Problema técnico",
  "Pagamentos / planos",
  "Sugestão / melhoria",
];

const APP_VERSION = "1.0.0";

export default function Suporte() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useRequireAuth("/auth");
  const { isFreemium, loading: planLoading } = usePlanValidation();
  
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    whatsapp: "",
    tipo: "",
    mensagem: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [userPlan, setUserPlan] = useState("Free");
  const [deviceId, setDeviceId] = useState<string>("");

  // Load user data and subscription
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;

      // Get device ID
      const id = getDeviceId();
      setDeviceId(id);

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFormData(prev => ({
          ...prev,
          nome: profile.full_name || "",
          email: user.email || "",
          whatsapp: profile.phone || "",
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          email: user.email || "",
        }));
      }

      // Get subscription plan
      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("plan_type")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (subscription) {
        const planName = subscription.plan_type === "freemium" ? "Free" : "Pro";
        setUserPlan(planName);
      }
    };

    loadUserData();
  }, [user]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.nome || !formData.email || !formData.whatsapp || !formData.tipo || !formData.mensagem) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        navigate("/auth");
        return;
      }

      const response = await supabase.functions.invoke("create-support-ticket", {
        body: {
          nome: formData.nome,
          email: formData.email,
          whatsapp: formData.whatsapp,
          tipo: formData.tipo,
          mensagem: formData.mensagem,
          plano: userPlan,
          device_id: deviceId,
          app_version: APP_VERSION,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao enviar solicitação");
      }

      setIsSuccess(true);
      toast.success("Solicitação enviada com sucesso!");
    } catch (error: any) {
      console.error("Error submitting support ticket:", error);
      toast.error(error.message || "Erro ao enviar solicitação. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || planLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Bloquear acesso para usuários Freemium
  if (isFreemium) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-800">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
                <Lock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
              </div>
              <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-200 mb-2">
                Suporte exclusivo para planos pagos
              </h2>
              <p className="text-amber-700 dark:text-amber-300 mb-6 max-w-md mx-auto">
                O suporte por e-mail está disponível apenas para usuários dos planos Pro e Premium. 
                Faça upgrade para ter acesso ao suporte dedicado.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/ajuda")} variant="outline">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Central de Ajuda
                </Button>
                <Button onClick={() => navigate("/planos")} className="bg-amber-500 hover:bg-amber-600">
                  <Crown className="mr-2 h-4 w-4" />
                  Fazer Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (isSuccess) {
    return (
      <AppLayout>
        <div className="container max-w-2xl mx-auto py-8 px-4">
          <Card className="border-green-200 bg-green-50/50">
            <CardContent className="pt-8 pb-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-800 mb-2">
                ✅ Solicitação enviada com sucesso!
              </h2>
              <p className="text-green-700 mb-6 max-w-md mx-auto">
                Recebemos sua mensagem e nosso suporte irá analisar.
                Você receberá o retorno pelo WhatsApp ou e-mail.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/ajuda")} variant="outline">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Central de Ajuda
                </Button>
                <Button onClick={() => navigate("/painel")}>
                  Voltar ao Painel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-2xl mx-auto py-8 px-4">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => navigate("/ajuda")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Ajuda
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Fale com o Suporte
            </CardTitle>
            <CardDescription>
              Não encontrou sua resposta na Central de Ajuda?
              Envie sua solicitação abaixo e nosso suporte irá analisar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => handleChange("nome", e.target.value)}
                    placeholder="Seu nome"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    value={formData.whatsapp}
                    onChange={(e) => handleChange("whatsapp", e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo de solicitação *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value) => handleChange("tipo", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_SOLICITACAO.map((tipo) => (
                        <SelectItem key={tipo} value={tipo}>
                          {tipo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="mensagem">Mensagem *</Label>
                <Textarea
                  id="mensagem"
                  value={formData.mensagem}
                  onChange={(e) => handleChange("mensagem", e.target.value)}
                  placeholder="Descreva sua dúvida ou problema com o máximo de detalhes possível. Se for um erro, informe o que você estava tentando fazer."
                  className="min-h-[150px]"
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Enviar solicitação
                  </>
                )}
              </Button>
            </form>

            <Alert className="mt-6 bg-muted/50">
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Atendimento de segunda a sexta, das 9h às 18h.
                Respondemos normalmente em até 24 horas.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
