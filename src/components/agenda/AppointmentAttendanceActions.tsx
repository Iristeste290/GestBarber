import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  UserCheck,
  CreditCard,
  Banknote,
  Smartphone,
  CheckCircle2,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AppointmentAttendanceActionsProps {
  appointmentId: string;
  status: string;
  checkedInAt: string | null;
  paymentStatus: string | null;
  paymentMethod: string | null;
  servicePrice: number;
  onUpdate?: () => void;
}

const paymentMethods = [
  { id: "cash", label: "Dinheiro", icon: Banknote, color: "text-green-600" },
  { id: "credit_card", label: "Cartão Crédito", icon: CreditCard, color: "text-blue-600" },
  { id: "debit_card", label: "Cartão Débito", icon: CreditCard, color: "text-purple-600" },
  { id: "pix", label: "PIX", icon: Smartphone, color: "text-teal-600" },
];

export const AppointmentAttendanceActions = ({
  appointmentId,
  status,
  checkedInAt,
  paymentStatus,
  paymentMethod,
  servicePrice,
  onUpdate,
}: AppointmentAttendanceActionsProps) => {
  const [loading, setLoading] = useState<string | null>(null);

  const isCheckedIn = !!checkedInAt;
  const isPaid = paymentStatus === "paid";
  const isCompleted = status === "completed";
  const isCancelled = status === "cancelled";

  const handleCheckIn = async () => {
    setLoading("checkin");
    try {
      const { error } = await supabase.rpc("appointment_check_in", {
        p_appointment_id: appointmentId,
      });

      if (error) throw error;

      toast.success("Check-in realizado! Cliente chegou.");
      onUpdate?.();
    } catch (err: any) {
      console.error("Check-in error:", err);
      toast.error(err.message || "Erro ao fazer check-in");
    } finally {
      setLoading(null);
    }
  };

  const handlePayment = async (method: string) => {
    setLoading("payment");
    try {
      const { error } = await supabase.rpc("appointment_register_payment", {
        p_appointment_id: appointmentId,
        p_payment_method: method,
        p_amount: servicePrice,
      });

      if (error) throw error;

      const methodLabel = paymentMethods.find((m) => m.id === method)?.label || method;
      toast.success(`Pagamento registrado: ${methodLabel}`);
      onUpdate?.();
    } catch (err: any) {
      console.error("Payment error:", err);
      toast.error(err.message || "Erro ao registrar pagamento");
    } finally {
      setLoading(null);
    }
  };

  const getPaymentMethodLabel = () => {
    const method = paymentMethods.find((m) => m.id === paymentMethod);
    return method?.label || paymentMethod;
  };

  const getPaymentMethodIcon = () => {
    const method = paymentMethods.find((m) => m.id === paymentMethod);
    return method ? <method.icon className={cn("h-3 w-3", method.color)} /> : null;
  };

  // Se está cancelado ou já concluído com pagamento, mostra apenas badges
  if (isCancelled) {
    return null;
  }

  if (isCompleted && isPaid) {
    return (
      <div className="flex items-center gap-2 mt-2">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800 gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Pago
        </Badge>
        <Badge variant="outline" className="gap-1">
          {getPaymentMethodIcon()}
          {getPaymentMethodLabel()}
        </Badge>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mt-3">
      {/* Step 1: Check-in */}
      {!isCheckedIn && !isCompleted && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleCheckIn}
          disabled={loading === "checkin"}
          className="h-8 text-xs gap-1.5 border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950"
        >
          {loading === "checkin" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <UserCheck className="h-3.5 w-3.5" />
          )}
          Chegou
        </Button>
      )}

      {/* Mostrar badge de check-in se já fez */}
      {isCheckedIn && !isCompleted && (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-800 gap-1 h-7">
          <UserCheck className="h-3 w-3" />
          Presente
        </Badge>
      )}

      {/* Step 2: Pagamento (só aparece após check-in ou para status confirmed) */}
      {(isCheckedIn || status === "confirmed") && !isPaid && !isCompleted && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="default"
              size="sm"
              disabled={loading === "payment"}
              className="h-8 text-xs gap-1.5 bg-green-600 hover:bg-green-700"
            >
              {loading === "payment" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CreditCard className="h-3.5 w-3.5" />
              )}
              Receber R$ {servicePrice.toFixed(2)}
              <ChevronDown className="h-3 w-3 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Forma de pagamento
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {paymentMethods.map((method) => (
              <DropdownMenuItem
                key={method.id}
                onClick={() => handlePayment(method.id)}
                className="gap-2 cursor-pointer"
              >
                <method.icon className={cn("h-4 w-4", method.color)} />
                {method.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Mostrar badge de pagamento se já pagou */}
      {isPaid && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800 gap-1 h-7">
          {getPaymentMethodIcon()}
          {getPaymentMethodLabel()}
        </Badge>
      )}
    </div>
  );
};
