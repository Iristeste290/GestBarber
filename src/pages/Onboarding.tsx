import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useActivation } from "@/hooks/useActivation";
import { toast } from "sonner";
import { 
  Sparkles, 
  ArrowRight,
  Scissors,
  CheckCircle2,
  Loader2
} from "lucide-react";

type Step = "welcome" | "create-service" | "success";

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { completeActivation } = useActivation();

  const handleCreateService = async () => {
    if (!serviceName.trim() || !servicePrice.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    const price = parseFloat(servicePrice.replace(",", "."));
    if (isNaN(price) || price <= 0) {
      toast.error("Digite um preço válido");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Create the service
      const { error: serviceError } = await supabase
        .from("services")
        .insert({
          name: serviceName.trim(),
          price: price,
          duration_minutes: 30, // Default duration
          user_id: user.id,
          is_active: true,
        });

      if (serviceError) throw serviceError;

      // Mark activation as complete
      await completeActivation.mutateAsync("first_service");

      setCurrentStep("success");
    } catch (error: any) {
      console.error("Error creating service:", error);
      toast.error(error.message || "Erro ao criar serviço");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoToDashboard = () => {
    navigate("/painel");
  };

  const getProgress = () => {
    switch (currentStep) {
      case "welcome": return 33;
      case "create-service": return 66;
      case "success": return 100;
      default: return 0;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="mb-6 space-y-2">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Passo 1 de 1</span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>

        {/* Welcome Step */}
        {currentStep === "welcome" && (
          <Card className="glass-card border-2 animate-fade-in">
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-10 h-10 md:w-12 md:h-12 text-primary" />
              </div>
              
              <div className="space-y-3">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Bem-vindo ao GestBarber!
                </h1>
                <p className="text-muted-foreground text-base md:text-lg">
                  Vamos configurar seu primeiro serviço
                </p>
                <p className="text-sm text-muted-foreground">
                  (Leva menos de 1 minuto)
                </p>
              </div>

              <Button 
                size="lg" 
                onClick={() => setCurrentStep("create-service")}
                className="w-full max-w-xs bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Começar
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Create Service Step */}
        {currentStep === "create-service" && (
          <Card className="glass-card border-2 animate-fade-in">
            <CardContent className="p-8 md:p-12 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Scissors className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold">
                  Crie seu primeiro serviço
                </h2>
                <p className="text-sm text-muted-foreground">
                  Este é o serviço mais popular. Você pode adicionar mais depois.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service-name">Nome do serviço</Label>
                  <Input
                    id="service-name"
                    placeholder="Ex: Corte masculino"
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    disabled={isSubmitting}
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-price">Preço (R$)</Label>
                  <Input
                    id="service-price"
                    placeholder="Ex: 35,00"
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    disabled={isSubmitting}
                    className="h-12 text-base"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <Button 
                size="lg" 
                onClick={handleCreateService}
                disabled={isSubmitting || !serviceName.trim() || !servicePrice.trim()}
                className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar serviço"
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Success Step */}
        {currentStep === "success" && (
          <Card className="glass-card border-2 animate-fade-in">
            <CardContent className="p-8 md:p-12 text-center space-y-6">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 md:w-12 md:h-12 text-green-500" />
              </div>
              
              <div className="space-y-3">
                <h2 className="text-2xl md:text-3xl font-bold text-green-600">
                  Pronto!
                </h2>
                <p className="text-base md:text-lg text-foreground">
                  Seu primeiro serviço foi criado.
                </p>
                <p className="text-sm text-muted-foreground">
                  Agora você já pode agendar clientes e controlar seu faturamento.
                </p>
              </div>

              <Button 
                size="lg" 
                onClick={handleGoToDashboard}
                className="w-full max-w-xs bg-gradient-to-r from-primary to-accent hover:opacity-90"
              >
                Ir para o painel
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Help Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Você pode adicionar mais serviços e configurações no painel
        </p>
      </div>
    </div>
  );
}
