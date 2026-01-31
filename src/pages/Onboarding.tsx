import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useActivation } from "@/hooks/useActivation";
import { toast } from "sonner";
import { 
  ArrowRight,
  ArrowLeft,
  Scissors,
  CheckCircle2,
  Loader2,
  Building2,
  Clock,
  Target,
  CalendarDays,
  TrendingUp,
  Users,
  LayoutGrid
} from "lucide-react";

type Step = 1 | 2 | 3;

const weekDays = [
  { id: 0, label: "Dom" },
  { id: 1, label: "Seg" },
  { id: 2, label: "Ter" },
  { id: 3, label: "Qua" },
  { id: 4, label: "Qui" },
  { id: 5, label: "Sex" },
  { id: 6, label: "Sáb" },
];

const goals = [
  { id: "fill_agenda", label: "Encher a agenda", icon: CalendarDays, description: "Ter mais clientes agendados" },
  { id: "earn_more", label: "Ganhar mais por cliente", icon: TrendingUp, description: "Aumentar o ticket médio" },
  { id: "organize", label: "Organizar a barbearia", icon: LayoutGrid, description: "Ter controle de tudo" },
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { completeActivation } = useActivation();

  // Step 1: Barbershop info
  const [city, setCity] = useState("");
  const [barberCount, setBarberCount] = useState("");

  // Step 2: Working days and hours
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6]); // Mon-Sat by default
  const [openTime, setOpenTime] = useState("09:00");
  const [closeTime, setCloseTime] = useState("19:00");

  // Step 3: Main goal
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);

  const toggleDay = (dayId: number) => {
    setSelectedDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId)
        : [...prev, dayId]
    );
  };

  const getProgress = () => {
    return (currentStep / 3) * 100;
  };

  const canProceedStep1 = city.trim().length >= 2 && barberCount.trim().length > 0;
  const canProceedStep2 = selectedDays.length > 0 && openTime && closeTime;
  const canProceedStep3 = selectedGoal !== null;

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as Step);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  const handleComplete = async () => {
    if (!selectedGoal) return;
    
    setIsSubmitting(true);

    try {
      // Usa getSession() em vez de getUser() para evitar problemas de autenticação
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Usuário não autenticado. Por favor, faça login novamente.");
      
      const user = session.user;

      // Save onboarding data to profile (using existing fields or creating new ones)
      // For now, we'll store it in a simple way
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          // We'll store the main goal in activation_source for now
          activation_source: selectedGoal,
        })
        .eq("id", user.id);

      if (updateError) {
        console.error("Error updating profile:", updateError);
      }

      // Mark activation as complete
      await completeActivation.mutateAsync("onboarding_complete");

      toast.success("Barbearia configurada!", {
        description: "Tudo pronto. Vamos começar!",
      });

      // Redirect para o painel (evita levar usuário Start para área bloqueada)
      navigate("/painel");
    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast.error(error.message || "Erro ao salvar configurações");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Progress */}
        <div className="mb-8 space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Configuração inicial</span>
            <span className="text-primary font-medium">Passo {currentStep} de 3</span>
          </div>
          <Progress value={getProgress()} className="h-2" />
        </div>

        {/* Step 1: Barbershop Info */}
        {currentStep === 1 && (
          <Card className="border-primary/20 bg-[#111111] animate-fade-in">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-[#EDEDED]">
                  Sobre sua barbearia
                </h1>
                <p className="text-muted-foreground">
                  Vamos conhecer seu negócio para personalizar sua experiência.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-[#EDEDED]">Cidade</Label>
                  <Input
                    id="city"
                    placeholder="Ex: São Paulo"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-12 bg-[#1a1a1a] border-[#333]"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="barber-count" className="text-[#EDEDED]">Quantos barbeiros trabalham aqui?</Label>
                  <Input
                    id="barber-count"
                    type="number"
                    placeholder="Ex: 3"
                    min="1"
                    value={barberCount}
                    onChange={(e) => setBarberCount(e.target.value)}
                    className="h-12 bg-[#1a1a1a] border-[#333]"
                  />
                </div>
              </div>

              <Button 
                onClick={handleNext}
                disabled={!canProceedStep1}
                className="w-full h-12 bg-primary hover:bg-primary/90 font-semibold"
              >
                Continuar
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Working Hours */}
        {currentStep === 2 && (
          <Card className="border-primary/20 bg-[#111111] animate-fade-in">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-[#EDEDED]">
                  Horário de funcionamento
                </h1>
                <p className="text-muted-foreground">
                  Quando sua barbearia está aberta?
                </p>
              </div>

              <div className="space-y-6">
                {/* Days selection */}
                <div className="space-y-3">
                  <Label className="text-[#EDEDED]">Dias de funcionamento</Label>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {weekDays.map((day) => (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => toggleDay(day.id)}
                        className={`w-12 h-12 rounded-lg font-medium transition-all ${
                          selectedDays.includes(day.id)
                            ? "bg-primary text-primary-foreground"
                            : "bg-[#1a1a1a] text-muted-foreground border border-[#333] hover:border-primary/50"
                        }`}
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Hours selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="open-time" className="text-[#EDEDED]">Abre às</Label>
                    <Input
                      id="open-time"
                      type="time"
                      value={openTime}
                      onChange={(e) => setOpenTime(e.target.value)}
                      className="h-12 bg-[#1a1a1a] border-[#333]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="close-time" className="text-[#EDEDED]">Fecha às</Label>
                    <Input
                      id="close-time"
                      type="time"
                      value={closeTime}
                      onChange={(e) => setCloseTime(e.target.value)}
                      className="h-12 bg-[#1a1a1a] border-[#333]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12 border-[#333] text-[#EDEDED] hover:bg-[#1a1a1a]"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar
                </Button>
                <Button 
                  onClick={handleNext}
                  disabled={!canProceedStep2}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 font-semibold"
                >
                  Continuar
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Main Goal */}
        {currentStep === 3 && (
          <Card className="border-primary/20 bg-[#111111] animate-fade-in">
            <CardContent className="p-8 space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-[#EDEDED]">
                  O que você mais quer agora?
                </h1>
                <p className="text-muted-foreground">
                  Isso ajuda o Growth Engine a priorizar o que importa.
                </p>
              </div>

              <div className="space-y-3">
                {goals.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = selectedGoal === goal.id;
                  
                  return (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => setSelectedGoal(goal.id)}
                      className={`w-full p-4 rounded-xl border transition-all text-left flex items-center gap-4 ${
                        isSelected
                          ? "bg-primary/10 border-primary"
                          : "bg-[#1a1a1a] border-[#333] hover:border-primary/50"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-primary" : "bg-[#222]"
                      }`}>
                        <Icon className={`w-6 h-6 ${isSelected ? "text-primary-foreground" : "text-muted-foreground"}`} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-semibold ${isSelected ? "text-primary" : "text-[#EDEDED]"}`}>
                          {goal.label}
                        </p>
                        <p className="text-sm text-muted-foreground">{goal.description}</p>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 h-12 border-[#333] text-[#EDEDED] hover:bg-[#1a1a1a]"
                >
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Voltar
                </Button>
                <Button 
                  onClick={handleComplete}
                  disabled={!canProceedStep3 || isSubmitting}
                  className="flex-1 h-12 bg-primary hover:bg-primary/90 font-semibold"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      Começar a usar
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Você pode alterar tudo isso depois nas configurações
        </p>
      </div>
    </div>
  );
}
