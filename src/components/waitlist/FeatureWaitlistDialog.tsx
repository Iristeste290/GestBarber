import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Sparkles, Bell, Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().email("Email inválido").max(255, "Email muito longo");

interface FeatureWaitlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  userEmail?: string;
}

export function FeatureWaitlistDialog({ 
  open, 
  onOpenChange, 
  featureName,
  userEmail 
}: FeatureWaitlistDialogProps) {
  const [email, setEmail] = useState(userEmail || "");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate email
    const result = emailSchema.safeParse(email.trim());
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("feature_waitlist")
        .insert({
          email: email.trim().toLowerCase(),
          feature_name: featureName,
          user_id: user?.id || null
        });

      if (error) {
        if (error.code === "23505") {
          // Unique constraint violation - already subscribed
          toast.info("Você já está na lista de espera para esta funcionalidade! 🎉");
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        toast.success("Você será notificado quando esta funcionalidade estiver disponível! 🚀");
      }
    } catch (error) {
      console.error("Error subscribing to waitlist:", error);
      toast.error("Erro ao se inscrever. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsSubscribed(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <DialogTitle className="text-xl">
            {isSubscribed ? "Tudo certo! 🎉" : `${featureName} - Em breve!`}
          </DialogTitle>
          <DialogDescription>
            {isSubscribed 
              ? "Você será notificado por email quando esta funcionalidade estiver disponível."
              : "Esta funcionalidade está sendo desenvolvida com muito carinho. Deixe seu email para ser avisado quando estiver pronta!"}
          </DialogDescription>
        </DialogHeader>

        {isSubscribed ? (
          <div className="flex flex-col items-center py-6 gap-4">
            <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-scale-in">
              <Bell className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-center text-muted-foreground">
              Fique de olho no seu email!
            </p>
            <Button onClick={handleClose} className="w-full">
              Entendi
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="waitlist-email">Seu melhor email</Label>
              <Input
                id="waitlist-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={255}
                disabled={isLoading}
              />
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Inscrevendo...
                </>
              ) : (
                <>
                  <Bell className="h-4 w-4 mr-2" />
                  Me avise quando estiver pronto
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              Prometemos não enviar spam. Apenas novidades importantes!
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}