import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingDown, MessageCircle, User, AlertTriangle } from "lucide-react";
import { useLostRevenueSummary, useLostRevenue } from "@/hooks/useLostRevenue";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const generateWhatsAppLink = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const formattedPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
};

export const LostRevenueCard = () => {
  const { summary, isLoading: summaryLoading } = useLostRevenueSummary();
  const { data: items, isLoading: itemsLoading } = useLostRevenue();

  const isLoading = summaryLoading || itemsLoading;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getReasonBadge = (reason: string) => {
    switch (reason) {
      case 'no_show':
        return <Badge variant="destructive">Faltou</Badge>;
      case 'late_cancel':
        return <Badge variant="outline" className="border-orange-500 text-orange-500">Cancelou tarde</Badge>;
      case 'empty_slot':
        return <Badge variant="secondary">Horário vazio</Badge>;
      case 'cancelled':
        return <Badge variant="outline">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{reason}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-destructive" />
          <span>Dinheiro Perdido Este Mês</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-center shadow-lg">
            <p className="text-2xl font-bold text-destructive">{formatCurrency(summary.total_lost)}</p>
            <p className="text-sm text-muted-foreground">Total Perdido</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary border border-border text-center">
            <p className="text-xl font-semibold text-foreground">{summary.no_show_count}</p>
            <p className="text-xs text-muted-foreground">Faltas</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary border border-border text-center">
            <p className="text-xl font-semibold text-foreground">{summary.late_cancel_count}</p>
            <p className="text-xs text-muted-foreground">Cancelamentos Tardios</p>
          </div>
          <div className="p-3 rounded-xl bg-secondary border border-border text-center">
            <p className="text-xl font-semibold text-foreground">{summary.cancelled_count}</p>
            <p className="text-xs text-muted-foreground">Cancelamentos</p>
          </div>
        </div>

        {/* Top Offenders */}
        {summary.top_offenders.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              Clientes que mais causaram prejuízo
            </h4>
            <div className="space-y-2">
              {summary.top_offenders.map((offender, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                      <User className="h-4 w-4 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium">{offender.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {offender.incidents} incidente(s)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-destructive">
                      {formatCurrency(offender.total_lost)}
                    </span>
                    {offender.customer_phone && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const message = `Olá ${offender.customer_name}! Notamos que você teve algumas dificuldades recentes com seus agendamentos. Gostaríamos de entender melhor e ajudá-lo a manter seus horários. Podemos conversar?`;
                          window.open(generateWhatsAppLink(offender.customer_phone!, message), '_blank');
                        }}
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Items */}
        {items && items.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3">Histórico Recente</h4>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.slice(0, 10).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {format(new Date(item.lost_date), "dd/MM", { locale: ptBR })}
                      </TableCell>
                      <TableCell>{item.customer_name || '-'}</TableCell>
                      <TableCell>{getReasonBadge(item.reason)}</TableCell>
                      <TableCell className="text-right font-medium text-destructive">
                        {formatCurrency(item.value_lost)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {(!items || items.length === 0) && summary.total_lost === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <TrendingDown className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Nenhuma perda registrada este mês!</p>
            <p className="text-sm">Continue assim! 🎉</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
