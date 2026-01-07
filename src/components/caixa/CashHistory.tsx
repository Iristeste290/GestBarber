import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format, subDays, subMonths, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Eye, Calendar, Filter } from "lucide-react";
import { useState } from "react";
import { CashSessionDetails } from "./CashSessionDetails";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";

type PeriodFilter = "all" | "week" | "month" | "custom";

interface CashHistoryProps {
  userId: string;
}

export const CashHistory = ({ userId }: CashHistoryProps) => {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const getDateRange = () => {
    const now = new Date();
    switch (periodFilter) {
      case "week":
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case "month":
        return { start: startOfDay(subMonths(now, 1)), end: endOfDay(now) };
      case "custom":
        if (dateRange?.from && dateRange?.to) {
          return { start: startOfDay(dateRange.from), end: endOfDay(dateRange.to) };
        }
        return null;
      default:
        return null;
    }
  };

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["cash-history", userId, periodFilter, dateRange?.from, dateRange?.to],
    queryFn: async () => {
      let query = supabase
        .from("cash_register_sessions")
        .select("*")
        .eq("user_id", userId)
        .order("opened_at", { ascending: false });

      const range = getDateRange();
      if (range) {
        query = query
          .gte("opened_at", range.start.toISOString())
          .lte("opened_at", range.end.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
  });

  const getPeriodLabel = () => {
    switch (periodFilter) {
      case "week":
        return "Última semana";
      case "month":
        return "Último mês";
      case "custom":
        if (dateRange?.from && dateRange?.to) {
          return `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`;
        }
        return "Período personalizado";
      default:
        return "Todo período";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Caixa</CardTitle>
          <CardDescription>Carregando registros...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Carregando...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Caixa</CardTitle>
          <CardDescription>Todos os registros de abertura e fechamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Nenhum registro encontrado
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Histórico de Caixa</CardTitle>
              <CardDescription>
                {sessions.length} registro(s) - {getPeriodLabel()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={periodFilter} onValueChange={(value: PeriodFilter) => setPeriodFilter(value)}>
                <SelectTrigger className="w-[160px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todo período</SelectItem>
                  <SelectItem value="week">Última semana</SelectItem>
                  <SelectItem value="month">Último mês</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>

              {periodFilter === "custom" && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Calendar className="w-4 h-4 mr-2" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`
                        ) : (
                          format(dateRange.from, "dd/MM/yyyy")
                        )
                      ) : (
                        "Selecionar"
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={setDateRange}
                      numberOfMonths={2}
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data de Abertura</TableHead>
                  <TableHead className="text-right">Abertura</TableHead>
                  <TableHead className="text-right hidden md:table-cell">Fechamento</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell>
                      {format(new Date(session.opened_at), "dd/MM/yyyy 'às' HH:mm", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {Number(session.opening_amount).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-medium hidden md:table-cell">
                      {session.closing_amount
                        ? `R$ ${Number(session.closing_amount).toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={session.is_open ? "default" : "secondary"}>
                        {session.is_open ? "Aberto" : "Fechado"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedSessionId(session.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CashSessionDetails
        sessionId={selectedSessionId}
        open={!!selectedSessionId}
        onOpenChange={(open) => !open && setSelectedSessionId(null)}
      />
    </>
  );
};
