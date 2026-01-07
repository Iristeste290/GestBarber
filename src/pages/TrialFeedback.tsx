import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { MessageSquare, Star, ThumbsUp, ThumbsDown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";

const FEATURES = [
  { id: "agenda", label: "Agenda de agendamentos" },
  { id: "barbeiros", label: "Gestão de barbeiros" },
  { id: "servicos", label: "Catálogo de serviços" },
  { id: "relatorios", label: "Relatórios e métricas" },
  { id: "interface", label: "Interface fácil de usar" },
  { id: "agenda_publica", label: "Link de agendamento público" },
];

const TrialFeedback = () => {
  const [rating, setRating] = useState<number>(0);
  const [likedFeatures, setLikedFeatures] = useState<string[]>([]);
  const [suggestion, setSuggestion] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { userPlan } = usePlanValidation();

  const handleFeatureToggle = (featureId: string) => {
    setLikedFeatures(prev => 
      prev.includes(featureId) 
        ? prev.filter(f => f !== featureId)
        : [...prev, featureId]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Por favor, dê uma nota de 1 a 5 estrelas");
      return;
    }

    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("trial_feedback").insert({
        user_id: user.id,
        rating,
        liked_features: likedFeatures,
        improvement_suggestion: suggestion || null,
        would_recommend: wouldRecommend,
        plan_type: userPlan?.plan || "freemium",
      });

      if (error) throw error;

      toast.success("Obrigado pelo feedback!");
      navigate("/assinatura-expirada");
    } catch (error) {
      console.error("Erro ao enviar feedback:", error);
      // Mesmo com erro, redireciona para não bloquear o usuário
      navigate("/assinatura-expirada");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate("/assinatura-expirada");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Como foi sua experiência?</CardTitle>
          <CardDescription>
            Seu período gratuito acabou! Antes de continuar, nos conte o que achou do GestBarber.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Qual nota você dá para o app?</Label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star 
                    className={`w-10 h-10 transition-colors ${
                      star <= rating 
                        ? "fill-amber-400 text-amber-400" 
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Features */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">O que você mais gostou?</Label>
            <div className="grid grid-cols-2 gap-2">
              {FEATURES.map((feature) => (
                <div
                  key={feature.id}
                  className="flex items-center space-x-2"
                >
                  <Checkbox
                    id={feature.id}
                    checked={likedFeatures.includes(feature.id)}
                    onCheckedChange={() => handleFeatureToggle(feature.id)}
                  />
                  <label
                    htmlFor={feature.id}
                    className="text-sm cursor-pointer"
                  >
                    {feature.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Would recommend */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Recomendaria para outros barbeiros?</Label>
            <div className="flex gap-3">
              <Button
                type="button"
                variant={wouldRecommend === true ? "default" : "outline"}
                size="sm"
                onClick={() => setWouldRecommend(true)}
                className="flex-1"
              >
                <ThumbsUp className="w-4 h-4 mr-2" />
                Sim
              </Button>
              <Button
                type="button"
                variant={wouldRecommend === false ? "default" : "outline"}
                size="sm"
                onClick={() => setWouldRecommend(false)}
                className="flex-1"
              >
                <ThumbsDown className="w-4 h-4 mr-2" />
                Não
              </Button>
            </div>
          </div>

          {/* Suggestion */}
          <div className="space-y-2">
            <Label htmlFor="suggestion" className="text-sm font-medium">
              O que podemos melhorar? (opcional)
            </Label>
            <Textarea
              id="suggestion"
              placeholder="Sua sugestão nos ajuda a melhorar..."
              value={suggestion}
              onChange={(e) => setSuggestion(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          <Button 
            onClick={handleSubmit} 
            className="w-full" 
            size="lg"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar e continuar"
            )}
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleSkip}
            className="text-muted-foreground"
            disabled={isSubmitting}
          >
            Pular
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default TrialFeedback;
