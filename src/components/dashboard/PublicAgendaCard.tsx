import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Users, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const PublicAgendaCard = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  const agendaUrl = userId 
    ? `${window.location.origin}/agenda-publica/${userId}` 
    : null;

  const handleCopyLink = async () => {
    if (!agendaUrl) return;
    
    try {
      await navigator.clipboard.writeText(agendaUrl);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Erro ao copiar link");
    }
  };

  const handleOpenAgenda = () => {
    if (agendaUrl) {
      window.open(agendaUrl, "_blank");
    }
  };

  if (!userId) {
    return null;
  }

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Agenda Pública</CardTitle>
        </div>
        <CardDescription>
          Permita que seus clientes agendem horários online
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={handleOpenAgenda}
            className="flex-1 h-12 text-base"
            size="lg"
          >
            <Users className="mr-2 h-4 w-4" />
            Ver Agenda Pública
          </Button>
          <Button
            onClick={handleCopyLink}
            variant="outline"
            size="lg"
          >
            {copied ? (
              <Check className="mr-2 h-4 w-4 text-primary" />
            ) : (
              <Copy className="mr-2 h-4 w-4" />
            )}
            {copied ? "Copiado!" : "Copiar Link"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Compartilhe o link com seus clientes para agendamentos online
        </p>
      </CardContent>
    </Card>
  );
};
