import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { PaymentStats } from "@/components/pagamentos/PaymentStats";
import { NewPaymentForm } from "@/components/pagamentos/NewPaymentForm";
import { PaymentsList } from "@/components/pagamentos/PaymentsList";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useQuery } from "@tanstack/react-query";
import { handleError } from "@/lib/error-handler";
import { PaymentsPageSkeleton } from "@/components/skeletons/PageSkeletons";

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

const Pagamentos = () => {
  const { user, loading: authLoading } = useRequireAuth();

  const { data: payments = [], isLoading: paymentsLoading, refetch } = useQuery<Payment[]>({
    queryKey: ["payments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        handleError(error, { title: "Erro ao carregar pagamentos" });
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
  });

  const pendingPayments = payments.filter((p) => p.status === "pending");
  const todayPayments = payments.filter((p) => {
    if (p.status !== "completed" || !p.paid_at) return false;
    const today = new Date().toDateString();
    const paidDate = new Date(p.paid_at).toDateString();
    return today === paidDate;
  });
  const completedPayments = payments.filter((p) => p.status === "completed");

  const pendingAmount = pendingPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const todayAmount = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  
  const totalPayments = payments.filter((p) => p.status !== "cancelled").length;
  const conversionRate = totalPayments > 0 
    ? Math.round((completedPayments.length / totalPayments) * 100) 
    : 0;

  return (
    <AppLayout title="Pagamentos" description="Gerencie cobranças e pagamentos">
      {authLoading || paymentsLoading ? (
        <div className="w-full px-3 md:px-6 py-3 md:py-6">
          <PaymentsPageSkeleton />
        </div>
      ) : (
        <div className="w-full px-3 md:px-6 py-3 md:py-6 space-y-4 md:space-y-6">
        <PaymentStats
          pendingAmount={pendingAmount}
          todayAmount={todayAmount}
          conversionRate={conversionRate}
          pendingCount={pendingPayments.length}
          todayCount={todayPayments.length}
        />

        <Tabs defaultValue="cobranca" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="cobranca">Nova Cobrança</TabsTrigger>
            <TabsTrigger value="pendentes">Pendentes</TabsTrigger>
            <TabsTrigger value="historico">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="cobranca" className="mt-6">
            <NewPaymentForm onPaymentCreated={refetch} />
          </TabsContent>

          <TabsContent value="pendentes" className="mt-6">
            <PaymentsList
              payments={pendingPayments}
              title="Pagamentos Pendentes"
              description="Cobranças aguardando confirmação"
              showActions
              onPaymentUpdated={refetch}
            />
          </TabsContent>

          <TabsContent value="historico" className="mt-6">
            <PaymentsList
              payments={payments.filter((p) => p.status !== "pending")}
              title="Histórico de Pagamentos"
              description="Todos os pagamentos concluídos e cancelados"
              showActions={false}
              onPaymentUpdated={refetch}
            />
          </TabsContent>
        </Tabs>
        </div>
      )}
    </AppLayout>
  );
};

export default Pagamentos;
