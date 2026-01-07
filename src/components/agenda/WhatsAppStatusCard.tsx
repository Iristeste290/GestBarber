import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Bell, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const NotificationStatusCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-green-500/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-500" />
          <CardTitle className="text-lg">
            Notificações Automáticas
          </CardTitle>
        </div>
        <CardDescription>
          Receba alertas de novos agendamentos via Push e E-mail
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="text-sm space-y-2">
            <p className="font-medium">Como funciona:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Cliente acessa o link da agenda pública</li>
              <li>Cliente escolhe barbeiro, serviço, data e horário</li>
              <li>Cliente preenche nome e telefone</li>
              <li>Sistema cria o agendamento automaticamente</li>
              <li className="text-green-600 font-medium">✓ Você recebe notificação push e/ou e-mail</li>
            </ol>
          </div>

          <div className="pt-2 border-t space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Bell className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Push Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Receba alertas em tempo real no navegador
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Mail className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">E-mail</p>
                <p className="text-xs text-muted-foreground">
                  Detalhes completos do agendamento no seu e-mail
                </p>
              </div>
            </div>

            <Button
              onClick={() => navigate("/perfil")}
              className="w-full"
              variant="outline"
              size="sm"
            >
              Configurar Notificações
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
