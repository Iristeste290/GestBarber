import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Ban, ShieldAlert, User, MessageCircle, ShieldCheck, AlertCircle } from "lucide-react";
import { ClientBehavior, generateWhatsAppLink } from "@/hooks/useGrowthEngine";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProblematicClientsCardProps {
  clients: ClientBehavior[];
  isLoading: boolean;
}

export const ProblematicClientsCard = ({ clients, isLoading }: ProblematicClientsCardProps) => {
  const [selectedClient, setSelectedClient] = useState<ClientBehavior | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getClassificationBadge = (classification: string) => {
    switch (classification) {
      case "bloqueado":
        return (
          <Badge variant="destructive" className="gap-1">
            <Ban className="h-3 w-3" />
            Bloqueado
          </Badge>
        );
      case "risco":
        return (
          <Badge variant="secondary" className="gap-1 bg-orange-100 text-orange-700 hover:bg-orange-200">
            <AlertTriangle className="h-3 w-3" />
            Risco
          </Badge>
        );
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const generateConfirmationMessage = (client: ClientBehavior) => {
    const firstName = client.client_name?.split(" ")[0] || "Cliente";
    return `Oi ${firstName}! Para confirmar seu próximo agendamento, precisamos de confirmação prévia. Por favor, responda SIM para confirmar que você virá ao horário marcado. Isso nos ajuda a organizar melhor a agenda. Obrigado!`;
  };

  const handleOpenActions = (client: ClientBehavior) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleSendConfirmation = () => {
    if (selectedClient?.client_phone) {
      const link = generateWhatsAppLink(selectedClient.client_phone, generateConfirmationMessage(selectedClient));
      window.open(link, "_blank");
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-500" />
            Clientes Problemáticos
          </CardTitle>
          <CardDescription>
            Nenhum cliente problemático identificado! 🎉
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <ShieldCheck className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-muted-foreground">
              Todos os seus clientes estão com comportamento normal.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const blockedClients = clients.filter(c => c.classification === "bloqueado");
  const riskyClients = clients.filter(c => c.classification === "risco");

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-500" />
            ⚠️ Clientes que Causam Prejuízo
          </CardTitle>
          <CardDescription>
            {blockedClients.length} bloqueado(s) e {riskyClients.length} em risco. Tome uma ação!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Blocked Clients Alert */}
          {blockedClients.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Atenção: {blockedClients.length} cliente(s) bloqueado(s)</AlertTitle>
              <AlertDescription>
                Esses clientes têm mais de 40% de faltas e causam prejuízo à sua barbearia. 
                Considere exigir confirmação prévia ou bloquear agendamentos.
              </AlertDescription>
            </Alert>
          )}

          {/* Clients Table */}
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Faltas</TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id} className={client.classification === "bloqueado" ? "bg-red-50/50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`rounded-full p-1.5 ${client.classification === "bloqueado" ? "bg-red-100" : "bg-muted"}`}>
                          <User className={`h-3 w-3 ${client.classification === "bloqueado" ? "text-red-500" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{client.client_name || "Cliente sem nome"}</p>
                          <p className="text-xs text-muted-foreground">{client.client_phone || "Sem telefone"}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-red-600 font-semibold">{client.canceled + client.no_show}</span>
                      <span className="text-muted-foreground">/{client.total_appointments}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`font-semibold ${client.cancel_rate > 40 ? "text-red-600" : "text-orange-600"}`}>
                        {client.cancel_rate.toFixed(0)}%
                      </span>
                    </TableCell>
                    <TableCell>
                      {getClassificationBadge(client.classification)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant={client.classification === "bloqueado" ? "destructive" : "outline"}
                        onClick={() => handleOpenActions(client)}
                      >
                        Ações
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Actions Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedClient?.classification === "bloqueado" ? (
                <Ban className="h-5 w-5 text-red-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              )}
              Ações para Cliente
            </DialogTitle>
            <DialogDescription>
              {selectedClient?.client_name || "Cliente"} - Taxa de faltas: {selectedClient?.cancel_rate.toFixed(0)}%
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Client Info */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
              <div className={`rounded-full p-3 ${selectedClient?.classification === "bloqueado" ? "bg-red-100" : "bg-orange-100"}`}>
                <User className={`h-5 w-5 ${selectedClient?.classification === "bloqueado" ? "text-red-500" : "text-orange-500"}`} />
              </div>
              <div>
                <p className="font-semibold">{selectedClient?.client_name || "Cliente"}</p>
                <p className="text-sm text-muted-foreground">{selectedClient?.client_phone}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs">
                    <span className="text-red-600 font-semibold">{(selectedClient?.canceled || 0) + (selectedClient?.no_show || 0)}</span>
                    <span className="text-muted-foreground">/{selectedClient?.total_appointments} faltas</span>
                  </span>
                  {selectedClient && getClassificationBadge(selectedClient.classification)}
                </div>
              </div>
            </div>

            {/* Warning for blocked */}
            {selectedClient?.classification === "bloqueado" && (
              <Alert variant="destructive">
                <Ban className="h-4 w-4" />
                <AlertTitle>Cliente causa prejuízo!</AlertTitle>
                <AlertDescription>
                  Este cliente tem mais de 40% de faltas. Cada falta é dinheiro perdido na sua barbearia.
                </AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Escolha uma ação:</p>
              
              <Button 
                className="w-full gap-2 justify-start" 
                variant="outline"
                onClick={handleSendConfirmation}
                disabled={!selectedClient?.client_phone}
              >
                <MessageCircle className="h-4 w-4 text-green-600" />
                <div className="text-left">
                  <p className="font-medium">Exigir Confirmação</p>
                  <p className="text-xs text-muted-foreground">Enviar mensagem pedindo confirmação prévia</p>
                </div>
              </Button>

              <Button 
                className="w-full gap-2 justify-start" 
                variant="outline"
                disabled
              >
                <Ban className="h-4 w-4 text-red-500" />
                <div className="text-left">
                  <p className="font-medium">Bloquear Agendamento</p>
                  <p className="text-xs text-muted-foreground">Impedir novos agendamentos (em breve)</p>
                </div>
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground pt-2">
              Proteja sua receita tomando ações contra clientes problemáticos
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
