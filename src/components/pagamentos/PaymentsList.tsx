import { memo, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { useFormatters } from "@/hooks/usePerformance";
import { useLazyList, InfiniteScrollTrigger } from "@/components/ui/virtualized-list";

interface Payment {
  id: string;
  client_name: string;
  service_name: string;
  amount: number;
  status: string;
  payment_method: string | null;
  created_at: string;
  paid_at: string | null;
}

interface PaymentsListProps {
  payments: Payment[];
  title: string;
  description: string;
  showActions?: boolean;
  onPaymentUpdated: () => void;
}

// Status badge configurations - memoized outside component
const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive"> = {
  pending: "secondary",
  completed: "default",
  cancelled: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  completed: "Concluído",
  cancelled: "Cancelado",
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  pix: "Pix",
  card: "Cartão",
  cash: "Dinheiro",
};

// Memoized payment item component
const PaymentItem = memo(function PaymentItem({
  payment,
  showActions,
  formatCurrency,
  formatDateTime,
  onComplete,
  onCancel
}: {
  payment: Payment;
  showActions: boolean;
  formatCurrency: (value: number) => string;
  formatDateTime: (date: string) => string;
  onComplete: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const handleComplete = useCallback(() => {
    onComplete(payment.id);
  }, [onComplete, payment.id]);

  const handleCancel = useCallback(() => {
    onCancel(payment.id);
  }, [onCancel, payment.id]);

  const paymentMethodLabel = payment.payment_method 
    ? PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method 
    : "-";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg gap-4 transition-colors-fast hover:bg-accent/30">
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-medium">{payment.client_name}</p>
          <Badge variant={STATUS_VARIANTS[payment.status] || "default"}>
            {STATUS_LABELS[payment.status] || payment.status}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{payment.service_name}</p>
        <p className="text-sm text-muted-foreground">
          {formatDateTime(payment.created_at)} • {paymentMethodLabel}
        </p>
      </div>
      
      <div className="flex items-center gap-4">
        <p className="text-lg font-bold">{formatCurrency(payment.amount)}</p>
        
        {showActions && payment.status === "pending" && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={handleComplete}
              className="transition-gpu"
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              Confirmar
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleCancel}
              className="transition-gpu"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

export const PaymentsList = memo(function PaymentsList({
  payments,
  title,
  description,
  showActions = false,
  onPaymentUpdated,
}: PaymentsListProps) {
  const { formatCurrency, formatDateTime } = useFormatters();
  const { visibleItems, hasMore, loadMore } = useLazyList(payments, 15, 10);

  const handleCompletePayment = useCallback(async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "completed",
          paid_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (error) throw error;

      toast.success("Pagamento confirmado!");
      onPaymentUpdated();
    } catch (error) {
      console.error("Erro ao confirmar pagamento:", error);
      toast.error("Erro ao confirmar pagamento");
    }
  }, [onPaymentUpdated]);

  const handleCancelPayment = useCallback(async (paymentId: string) => {
    try {
      const { error } = await supabase
        .from("payments")
        .update({ status: "cancelled" })
        .eq("id", paymentId);

      if (error) throw error;

      toast.success("Pagamento cancelado");
      onPaymentUpdated();
    } catch (error) {
      console.error("Erro ao cancelar pagamento:", error);
      toast.error("Erro ao cancelar pagamento");
    }
  }, [onPaymentUpdated]);

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            Nenhuma cobrança registrada
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 contain-layout">
          {visibleItems.map((payment) => (
            <PaymentItem
              key={payment.id}
              payment={payment}
              showActions={showActions}
              formatCurrency={formatCurrency}
              formatDateTime={formatDateTime}
              onComplete={handleCompletePayment}
              onCancel={handleCancelPayment}
            />
          ))}
          <InfiniteScrollTrigger onLoadMore={loadMore} hasMore={hasMore} />
        </div>
      </CardContent>
    </Card>
  );
});
