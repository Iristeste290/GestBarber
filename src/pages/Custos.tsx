import { AppLayout } from "@/components/AppLayout";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpenseForm } from "@/components/custos/ExpenseForm";
import { ExpensesList } from "@/components/custos/ExpensesList";
import { ExpensesSummary } from "@/components/custos/ExpensesSummary";
import { CostsPageSkeleton } from "@/components/skeletons/PageSkeletons";

const Custos = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const {
    expenses,
    loadingExpenses,
    totalRevenue,
    loadingRevenue,
    totalExpenses,
    netProfit,
    profitMargin,
    expensesByCategory,
    addExpense,
    deleteExpense,
    isAddingExpense,
    isDeletingExpense,
  } = useExpenses(user?.id);

  return (
    <AppLayout title="Controle de Custos" description="Gerencie despesas e receitas">
      {authLoading || loadingExpenses || loadingRevenue ? (
        <div className="px-3 md:px-0">
          <CostsPageSkeleton />
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6 px-3 md:px-0">
          <ExpensesSummary
            totalRevenue={totalRevenue}
            totalExpenses={totalExpenses}
            netProfit={netProfit}
            profitMargin={profitMargin}
            expensesByCategory={expensesByCategory}
          />

          <ExpenseForm onAddExpense={addExpense} isAdding={isAddingExpense} />

          <ExpensesList
            expenses={expenses}
            onDeleteExpense={deleteExpense}
            isDeleting={isDeletingExpense}
          />
        </div>
      )}
    </AppLayout>
  );
};

export default Custos;
