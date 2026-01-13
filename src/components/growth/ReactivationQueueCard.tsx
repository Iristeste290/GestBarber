import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MessageCircle, User, UserX, RefreshCw, Phone } from "lucide-react";
import { ReactivationClient, generateWhatsAppLink, useGrowthEngine } from "@/hooks/useGrowthEngine";
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
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ReactivationQueueCardProps {
  clients: ReactivationClient[];
  isLoading: boolean;
}

export const ReactivationQueueCard = ({ clients, isLoading }: ReactivationQueueCardProps) => {
  const { markAsSent } = useGrowthEngine();
  const [selectedClient, setSelectedClient] = useState<ReactivationClient | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const generateMessage = (client: ReactivationClient) => {
    const firstName = client.client_name?.split(" ")[0] || "Cliente";
    return `Oi ${firstName}! 👋 Faz tempo que você não corta com a gente. Temos horários disponíveis essa semana. Quer agendar? Responda para marcar seu horário!`;
  };

  const handleOpenReactivate = (client: ReactivationClient) => {
    setSelectedClient(client);
    setIsDialogOpen(true);
  };

  const handleSendMessage = () => {
    if (selectedClient?.client_phone) {
      const link = generateWhatsAppLink(selectedClient.client_phone, generateMessage(selectedClient));
      window.open(link, "_blank");
      markAsSent.mutate(selectedClient.id);
      setIsDialogOpen(false);
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
            <RefreshCw className="h-5 w-5 text-green-500" />
            Máquina de Retorno
          </CardTitle>
          <CardDescription>
            Nenhum cliente inativo encontrado! 🎉
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <UserX className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-muted-foreground">
              Todos os seus clientes estão ativos nos últimos 30 dias.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            💰 Clientes Sumidos = Dinheiro Parado
          </CardTitle>
          <CardDescription>
            {clients.length} cliente(s) não voltam há mais de 30 dias. Reative-os agora!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden sm:table-cell">Último Corte</TableHead>
                  <TableHead>Dias Inativo</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="rounded-full bg-muted p-1.5">
                          <User className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{client.client_name || "Cliente sem nome"}</p>
                          <p className="text-xs text-muted-foreground sm:hidden">
                            {client.last_appointment_date 
                              ? format(new Date(client.last_appointment_date), "dd/MM/yy", { locale: ptBR })
                              : "Sem registro"
                            }
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {client.last_appointment_date 
                          ? format(new Date(client.last_appointment_date), "dd/MM/yyyy", { locale: ptBR })
                          : "Sem registro"
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                        {client.days_inactive} dias
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {client.client_phone ? (
                        <Button 
                          size="sm" 
                          variant="default"
                          className="gap-2"
                          onClick={() => handleOpenReactivate(client)}
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="hidden sm:inline">Reativar</span>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" />
                          Sem telefone
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reactivation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              Reativar Cliente
            </DialogTitle>
            <DialogDescription>
              Envie uma mensagem para trazer {selectedClient?.client_name?.split(" ")[0] || "o cliente"} de volta!
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Client Info */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted">
              <div className="rounded-full bg-background p-3">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="font-semibold">{selectedClient?.client_name || "Cliente"}</p>
                <p className="text-sm text-muted-foreground">{selectedClient?.client_phone}</p>
                <p className="text-xs text-blue-600 mt-1">
                  Inativo há {selectedClient?.days_inactive} dias
                </p>
              </div>
            </div>

            {/* Message Preview */}
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm font-medium text-green-800 mb-2">💬 Mensagem que será enviada:</p>
              <p className="text-sm text-green-700">
                {selectedClient && generateMessage(selectedClient)}
              </p>
            </div>

            {/* Action Button */}
            <Button 
              className="w-full gap-2" 
              size="lg"
              onClick={handleSendMessage}
              disabled={!selectedClient?.client_phone}
            >
              <MessageCircle className="h-5 w-5" />
              Abrir WhatsApp e Enviar
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              O cliente será marcado como "contactado" após enviar
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
