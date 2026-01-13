import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, MessageCircle, Send, User, Search, Filter, DollarSign } from "lucide-react";
import { EmptySlot, ClientBehavior, generateWhatsAppLink, useGrowthEngine } from "@/hooks/useGrowthEngine";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EmptySlotsCardProps {
  slots: EmptySlot[];
  isLoading: boolean;
}

export const EmptySlotsCard = ({ slots, isLoading }: EmptySlotsCardProps) => {
  const [selectedSlot, setSelectedSlot] = useState<EmptySlot | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "recent" | "frequent">("all");
  const { activeClients, clientBehavior } = useGrowthEngine();

  const formatTime = (time: string) => time.slice(0, 5);

  const handleOpenDialog = (slot: EmptySlot) => {
    setSelectedSlot(slot);
    setSelectedClients([]);
    setSearchTerm("");
    setFilterType("all");
    setIsDialogOpen(true);
  };

  const handleClientToggle = (clientId: string) => {
    setSelectedClients(prev => 
      prev.includes(clientId) 
        ? prev.filter(id => id !== clientId)
        : [...prev, clientId]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = getFilteredClients().map(c => c.id);
    if (selectedClients.length === filteredIds.length) {
      setSelectedClients([]);
    } else {
      setSelectedClients(filteredIds);
    }
  };

  const generateMessage = (slot: EmptySlot, clientName?: string) => {
    const firstName = clientName?.split(" ")[0] || "";
    return firstName 
      ? `Oi ${firstName}! 👋 Abriu uma vaga hoje às ${formatTime(slot.slot_time)}. Quer agendar? Responda SIM para confirmar!`
      : `Olá! 👋 Temos uma vaga disponível hoje às ${formatTime(slot.slot_time)}. Quer agendar? Responda SIM para confirmar!`;
  };

  const getFilteredClients = () => {
    let clients = clientBehavior.data || [];
    
    // Filter out blocked clients
    clients = clients.filter(c => c.classification !== "bloqueado" && c.client_phone);

    // Apply search filter
    if (searchTerm) {
      clients = clients.filter(c => 
        c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.client_phone?.includes(searchTerm)
      );
    }

    // Apply type filter
    switch (filterType) {
      case "recent":
        clients = clients.sort((a, b) => {
          const dateA = a.last_appointment_date ? new Date(a.last_appointment_date).getTime() : 0;
          const dateB = b.last_appointment_date ? new Date(b.last_appointment_date).getTime() : 0;
          return dateB - dateA;
        }).slice(0, 20);
        break;
      case "frequent":
        clients = clients.sort((a, b) => b.completed - a.completed).slice(0, 20);
        break;
    }

    return clients;
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
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (slots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-green-500" />
            Horários Vazios Hoje
          </CardTitle>
          <CardDescription>
            Todos os horários estão preenchidos! 🎉
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-muted-foreground">
              Sua agenda está completa para hoje. Excelente!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredClients = getFilteredClients();

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-orange-500" />
            💰 Oportunidades de Hoje
          </CardTitle>
          <CardDescription>
            Você tem {slots.length} horário(s) vazio(s) que podem gerar receita agora!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Horário</TableHead>
                  <TableHead>Barbeiro</TableHead>
                  <TableHead className="hidden sm:table-cell">Status</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slots.map((slot) => (
                  <TableRow key={slot.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-semibold text-lg">{formatTime(slot.slot_time)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {slot.barber ? (
                        <Badge variant="outline" className="gap-1">
                          <User className="h-3 w-3" />
                          {slot.barber.name}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                        Disponível
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        className="gap-2"
                        onClick={() => handleOpenDialog(slot)}
                      >
                        <Send className="h-4 w-4" />
                        <span className="hidden sm:inline">Oferecer para clientes</span>
                        <span className="sm:hidden">Oferecer</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Client Selection Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Enviar Oferta de Horário
            </DialogTitle>
            <DialogDescription>
              Horário das {selectedSlot && formatTime(selectedSlot.slot_time)} 
              {selectedSlot?.barber && ` com ${selectedSlot.barber.name}`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Message Preview */}
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm font-medium text-green-800 mb-1">💬 Mensagem que será enviada:</p>
              <p className="text-sm text-green-700">
                {selectedSlot && generateMessage(selectedSlot, "Cliente")}
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cliente..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                <SelectTrigger className="w-full sm:w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="recent">Último corte</SelectItem>
                  <SelectItem value="frequent">Mais frequentes</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Selected Count Header */}
            {selectedClients.length > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-sm font-medium">
                  📤 Enviar mensagem para {selectedClients.length} cliente(s)
                </span>
                <Button size="sm" variant="ghost" onClick={() => setSelectedClients([])}>
                  Limpar
                </Button>
              </div>
            )}

            {/* Client List */}
            <div className="flex-1 overflow-y-auto min-h-0 space-y-1 border rounded-lg p-2">
              {clientBehavior.isLoading ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <User className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum cliente encontrado.</p>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                    onClick={handleSelectAll}
                  >
                    <Checkbox
                      checked={selectedClients.length === filteredClients.length && filteredClients.length > 0}
                    />
                    <span className="text-sm font-medium">
                      Selecionar todos ({filteredClients.length})
                    </span>
                  </div>

                  {filteredClients.map((client) => (
                    <div 
                      key={client.id} 
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer border-b last:border-0"
                      onClick={() => handleClientToggle(client.id)}
                    >
                      <Checkbox
                        checked={selectedClients.includes(client.id)}
                        onCheckedChange={() => handleClientToggle(client.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{client.client_name || "Cliente"}</p>
                        <p className="text-xs text-muted-foreground">{client.client_phone}</p>
                      </div>
                      <a
                        href={generateWhatsAppLink(client.client_phone!, selectedSlot ? generateMessage(selectedSlot, client.client_name || undefined) : "")}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-full hover:bg-green-100 text-green-600 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MessageCircle className="h-5 w-5" />
                      </a>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
