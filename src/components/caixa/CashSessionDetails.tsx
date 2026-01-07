import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface CashSessionDetailsProps {
  sessionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CashSessionDetails = ({
  sessionId,
  open,
  onOpenChange,
}: CashSessionDetailsProps) => {
  const { data: session } = useQuery({
    queryKey: ["cash-session-details", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;

      const { data, error } = await supabase
        .from("cash_register_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && open,
  });

  const { data: transactions } = useQuery({
    queryKey: ["cash-transactions", sessionId],
    queryFn: async () => {
      if (!sessionId) return [];

      const { data, error } = await supabase
        .from("cash_transactions")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!sessionId && open,
  });

  const { data: appointments } = useQuery({
    queryKey: ["session-appointments", sessionId, session?.opened_at],
    queryFn: async () => {
      if (!session) return [];

      const sessionDate = format(new Date(session.opened_at), "yyyy-MM-dd");

      const { data, error } = await supabase
        .from("appointments")
        .select(`
          *,
          services (price, name)
        `)
        .eq("status", "completed")
        .eq("appointment_date", sessionDate);

      if (error) throw error;
      return data || [];
    },
    enabled: !!session && open,
  });

  if (!session) return null;

  const totalEntries = appointments?.reduce((sum, apt) => {
    return sum + (Number(apt.services?.price) || 0);
  }, 0) || 0;

  const totalExits = transactions?.reduce((sum, tx) => {
    return tx.transaction_type === "exit" ? sum + Number(tx.amount) : sum;
  }, 0) || 0;

  const finalBalance = Number(session.opening_amount) + totalEntries - totalExits;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Sessão de Caixa</DialogTitle>
          <DialogDescription>
            {format(new Date(session.opened_at), "dd 'de' MMMM 'de' yyyy", {
              locale: ptBR,
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Informações Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Abertura</p>
              <p className="text-lg font-bold">
                {format(new Date(session.opened_at), "HH:mm", { locale: ptBR })}
              </p>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">Fechamento</p>
              <p className="text-lg font-bold">
                {session.closed_at
                  ? format(new Date(session.closed_at), "HH:mm", { locale: ptBR })
                  : "Em aberto"}
              </p>
            </div>
          </div>

          <Separator />

          {/* Resumo Financeiro */}
          <div className="space-y-3">
            <h3 className="font-semibold">Resumo Financeiro</h3>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center p-3 bg-muted/50 rounded">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Valor de Abertura:</span>
                </div>
                <span className="font-medium">R$ {Number(session.opening_amount).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center p-3 bg-green-500/5 rounded">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-muted-foreground">+ Entradas:</span>
                </div>
                <span className="font-medium text-green-600">
                  R$ {totalEntries.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center p-3 bg-red-500/5 rounded">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-600" />
                  <span className="text-muted-foreground">- Saídas:</span>
                </div>
                <span className="font-medium text-red-600">
                  R$ {totalExits.toFixed(2)}
                </span>
              </div>

              <Separator />

              <div className="flex justify-between items-center p-3 bg-primary/10 rounded">
                <span className="font-semibold">Saldo Final:</span>
                <span className="text-lg font-bold text-primary">
                  R$ {finalBalance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Movimentações */}
          <div className="space-y-3">
            <h3 className="font-semibold">Movimentações do Dia</h3>
            
            {appointments && appointments.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">
                  Agendamentos Concluídos ({appointments.length})
                </p>
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    className="flex justify-between items-center p-2 bg-green-500/5 rounded text-sm"
                  >
                    <span className="text-muted-foreground">
                      {apt.services?.name || "Serviço"} - {apt.appointment_time}
                    </span>
                    <span className="font-medium text-green-600">
                      + R$ {Number(apt.services?.price || 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {transactions && transactions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">
                  Outras Transações ({transactions.length})
                </p>
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className={`flex justify-between items-center p-2 rounded text-sm ${
                      tx.transaction_type === "exit"
                        ? "bg-red-500/5"
                        : "bg-green-500/5"
                    }`}
                  >
                    <span className="text-muted-foreground">{tx.description}</span>
                    <span
                      className={`font-medium ${
                        tx.transaction_type === "exit"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {tx.transaction_type === "exit" ? "-" : "+"} R${" "}
                      {Number(tx.amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {(!appointments || appointments.length === 0) &&
              (!transactions || transactions.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma movimentação registrada
                </p>
              )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
