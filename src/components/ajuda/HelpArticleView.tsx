import { useState } from "react";
import { HelpArticle, HelpCategory } from "@/data/helpArticles";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ThumbsUp, ThumbsDown, CheckCircle2, Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface HelpArticleViewProps {
  article: HelpArticle;
  category: HelpCategory;
  onBack: () => void;
}

export function HelpArticleView({ article, category, onBack }: HelpArticleViewProps) {
  const [feedback, setFeedback] = useState<"yes" | "no" | "pending_reason" | null>(null);
  const [feedbackReason, setFeedbackReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const Icon = category.icon;
  
  const submitFeedback = async (isHelpful: boolean, reason?: string) => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const sessionId = sessionStorage.getItem('feedback_session') || crypto.randomUUID();
      sessionStorage.setItem('feedback_session', sessionId);
      
      const { error } = await supabase
        .from('help_article_feedback')
        .insert({
          article_id: article.id,
          category_id: category.id,
          is_helpful: isHelpful,
          user_id: user?.id || null,
          session_id: sessionId,
          feedback_reason: reason || null
        });
      
      if (error) throw error;
      
      setFeedback(isHelpful ? "yes" : "no");
      toast.success("Obrigado pelo seu feedback!");
    } catch (error) {
      console.error("Error submitting feedback:", error);
      setFeedback(isHelpful ? "yes" : "no");
      toast.success("Obrigado pelo seu feedback!");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handlePositiveFeedback = () => {
    submitFeedback(true);
  };
  
  const handleNegativeFeedback = () => {
    setFeedback("pending_reason");
  };
  
  const handleSubmitReason = () => {
    submitFeedback(false, feedbackReason.trim() || undefined);
  };
  
  const handleSkipReason = () => {
    submitFeedback(false);
  };
  
  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para {category.title}
      </Button>
      
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{category.title}</p>
              <h1 className="text-lg font-semibold">{article.title}</h1>
            </div>
          </div>
          
          <p className="text-muted-foreground leading-relaxed">
            {article.content}
          </p>
          
          {article.steps && article.steps.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Passo a passo:</h3>
              <ol className="space-y-2">
                {article.steps.map((step, index) => (
                  <li key={index} className="flex gap-3 items-start">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm text-muted-foreground pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          
          <div className="border-t pt-4">
            {feedback === "yes" || feedback === "no" ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Obrigado pelo feedback!
              </div>
            ) : feedback === "pending_reason" ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">O que podemos melhorar neste artigo?</p>
                <Textarea
                  placeholder="Conte-nos o que faltou ou o que não ficou claro... (opcional)"
                  value={feedbackReason}
                  onChange={(e) => setFeedbackReason(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={handleSubmitReason}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Enviar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkipReason}
                    disabled={isSubmitting}
                  >
                    Pular
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-medium">Este artigo foi útil?</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePositiveFeedback}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ThumbsUp className="h-4 w-4" />
                    )}
                    Sim
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNegativeFeedback}
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Não
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
