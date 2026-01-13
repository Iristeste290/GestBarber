import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Headphones, 
  AlertTriangle, 
  DollarSign, 
  TrendingUp,
  Clock,
  CheckCircle,
  User,
  Phone,
  Mail,
  Calendar,
  Search,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRequireAdmin } from "@/hooks/useRequireAdmin";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SupportTicket {
  id: string;
  user_id: string;
  nome: string;
  email: string;
  whatsapp: string;
  tipo: string;
  mensagem: string;
  plano: string;
  status: string;
  classification: string | null;
  ai_summary: string | null;
  faturamento_30d: number | null;
  agendamentos_30d: number | null;
  priority_score: number | null;
  assigned_to: string | null;
  resolution_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

const STATUS_COLORS: Record<string, string> = {
  novo: "bg-blue-500",
  pending: "bg-blue-500",
  em_andamento: "bg-yellow-500",
  resolvido: "bg-green-500",
  fechado: "bg-gray-500",
};

const CLASSIFICATION_LABELS: Record<string, { label: string; color: string }> = {
  bug_critical: { label: "Bug Crítico", color: "bg-red-500" },
  high_value_client: { label: "Cliente VIP", color: "bg-purple-500" },
  growth_help: { label: "Crescimento", color: "bg-green-500" },
  configuration: { label: "Configuração", color: "bg-blue-500" },
  basic_question: { label: "Dúvida Básica", color: "bg-gray-500" },
};

export default function AdminSupportQueue() {
  const { loading: adminLoading } = useRequireAdmin();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  // Fetch tickets
  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ["admin-support-tickets", statusFilter],
    queryFn: async () => {
      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("priority_score", { ascending: false, nullsFirst: false })
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as SupportTicket[];
    },
  });

  // Update ticket status
  const updateTicket = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updates: any = { status };
      if (notes) updates.resolution_notes = notes;
      if (status === "resolvido" || status === "fechado") {
        updates.resolved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("support_tickets")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-support-tickets"] });
      toast.success("Ticket atualizado");
      setSelectedTicket(null);
      setResolutionNotes("");
    },
    onError: () => {
      toast.error("Erro ao atualizar ticket");
    },
  });

  // Filter tickets by search
  const filteredTickets = tickets?.filter(ticket => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      ticket.nome.toLowerCase().includes(searchLower) ||
      ticket.email.toLowerCase().includes(searchLower) ||
      ticket.mensagem.toLowerCase().includes(searchLower) ||
      ticket.ai_summary?.toLowerCase().includes(searchLower)
    );
  });

  // Stats
  const stats = {
    total: tickets?.length || 0,
    pending: tickets?.filter(t => t.status === "novo" || t.status === "pending").length || 0,
    critical: tickets?.filter(t => t.classification === "bug_critical").length || 0,
    vip: tickets?.filter(t => t.classification === "high_value_client").length || 0,
  };

  if (adminLoading) {
    return (
      <AppLayout>
        <div className="container max-w-7xl mx-auto py-8 px-4">
          <Skeleton className="h-8 w-64 mb-4" />
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="container max-w-7xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Headphones className="h-6 w-6 text-[#C9B27C]" />
              Fila de Suporte Growth
            </h1>
            <p className="text-muted-foreground">
              Tickets ordenados por prioridade e faturamento
            </p>
          </div>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.critical}</p>
                  <p className="text-xs text-muted-foreground">Críticos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.vip}</p>
                  <p className="text-xs text-muted-foreground">VIPs</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou mensagem..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="novo">Novo</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="em_andamento">Em andamento</SelectItem>
              <SelectItem value="resolvido">Resolvido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tickets List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : filteredTickets?.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Nenhum ticket encontrado
              </div>
            ) : (
              <div className="divide-y">
                {filteredTickets?.map((ticket) => (
                  <div 
                    key={ticket.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium truncate">{ticket.nome}</span>
                          {ticket.classification && CLASSIFICATION_LABELS[ticket.classification] && (
                            <Badge 
                              className={`${CLASSIFICATION_LABELS[ticket.classification].color} text-white text-[10px]`}
                            >
                              {CLASSIFICATION_LABELS[ticket.classification].label}
                            </Badge>
                          )}
                          <Badge 
                            variant="outline"
                            className={`${STATUS_COLORS[ticket.status] || "bg-gray-500"} text-white border-0 text-[10px]`}
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                        
                        {ticket.ai_summary && (
                          <p className="text-sm text-[#C9B27C] mb-1 line-clamp-1">
                            🤖 {ticket.ai_summary}
                          </p>
                        )}
                        
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {ticket.mensagem}
                        </p>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(ticket.created_at), "dd/MM HH:mm", { locale: ptBR })}
                          </span>
                          {ticket.faturamento_30d !== null && ticket.faturamento_30d > 0 && (
                            <span className="flex items-center gap-1 text-green-600">
                              <DollarSign className="h-3 w-3" />
                              R$ {ticket.faturamento_30d.toLocaleString("pt-BR")}
                            </span>
                          )}
                          {ticket.priority_score !== null && ticket.priority_score > 50 && (
                            <span className="flex items-center gap-1 text-amber-600">
                              <TrendingUp className="h-3 w-3" />
                              Score: {ticket.priority_score}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Detail Modal */}
        <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedTicket && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    Ticket: {selectedTicket.nome}
                    {selectedTicket.classification && CLASSIFICATION_LABELS[selectedTicket.classification] && (
                      <Badge 
                        className={`${CLASSIFICATION_LABELS[selectedTicket.classification].color} text-white`}
                      >
                        {CLASSIFICATION_LABELS[selectedTicket.classification].label}
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription>
                    Criado em {format(new Date(selectedTicket.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                  {/* AI Summary */}
                  {selectedTicket.ai_summary && (
                    <div className="p-3 rounded-lg bg-[#C9B27C]/10 border border-[#C9B27C]/30">
                      <p className="text-xs font-medium text-[#C9B27C] mb-1">Resumo IA:</p>
                      <p className="text-sm">{selectedTicket.ai_summary}</p>
                    </div>
                  )}

                  {/* Contact Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <a href={`mailto:${selectedTicket.email}`} className="text-primary hover:underline">
                        {selectedTicket.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <a 
                        href={`https://wa.me/55${selectedTicket.whatsapp.replace(/\D/g, "")}`} 
                        target="_blank"
                        className="text-green-600 hover:underline"
                      >
                        {selectedTicket.whatsapp}
                      </a>
                    </div>
                  </div>

                  {/* Stats */}
                  {(selectedTicket.faturamento_30d || selectedTicket.agendamentos_30d) && (
                    <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          R$ {(selectedTicket.faturamento_30d || 0).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-muted-foreground">Faturamento 30d</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{selectedTicket.agendamentos_30d || 0}</p>
                        <p className="text-xs text-muted-foreground">Agendamentos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{selectedTicket.priority_score || 0}</p>
                        <p className="text-xs text-muted-foreground">Score</p>
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <p className="text-sm font-medium mb-2">Mensagem:</p>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm whitespace-pre-wrap">{selectedTicket.mensagem}</p>
                    </div>
                  </div>

                  {/* Resolution Notes */}
                  <div>
                    <p className="text-sm font-medium mb-2">Notas de resolução:</p>
                    <Textarea
                      value={resolutionNotes || selectedTicket.resolution_notes || ""}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Adicione notas sobre a resolução..."
                      rows={3}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => updateTicket.mutate({ 
                        id: selectedTicket.id, 
                        status: "em_andamento" 
                      })}
                      disabled={updateTicket.isPending}
                    >
                      Em Andamento
                    </Button>
                    <Button
                      onClick={() => updateTicket.mutate({ 
                        id: selectedTicket.id, 
                        status: "resolvido",
                        notes: resolutionNotes
                      })}
                      disabled={updateTicket.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar Resolvido
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
