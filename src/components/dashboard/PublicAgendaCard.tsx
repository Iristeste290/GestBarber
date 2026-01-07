import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const PublicAgendaCard = () => {
  const navigate = useNavigate();
  const agendaUrl = `${window.location.origin}/agenda-publica`;

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
            onClick={() => navigate("/agenda-publica")}
            className="flex-1"
            size="lg"
          >
            <Users className="mr-2 h-4 w-4" />
            Ver Agenda Pública
          </Button>
          <Button
            onClick={() => window.open(agendaUrl, "_blank")}
            variant="outline"
            size="lg"
          >
            <ExternalLink className="mr-2 h-4 w-4" />
            Abrir em Nova Aba
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Compartilhe o link com seus clientes para agendamentos online
        </p>
      </CardContent>
    </Card>
  );
};
