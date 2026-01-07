import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Expense } from "@/hooks/useExpenses";

interface ExpensesListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
  isDeleting: boolean;
}

export const ExpensesList = ({ expenses, onDeleteExpense, isDeleting }: ExpensesListProps) => {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));

  // Gerar últimos 12 meses para o seletor
  const monthOptions = useMemo(() => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = subMonths(new Date(), i);
      options.push({
        value: format(date, "yyyy-MM"),
        label: format(date, "MMMM 'de' yyyy", { locale: ptBR })
      });
    }
    return options;
  }, []);

  // Filtrar despesas pelo mês selecionado
  const filteredExpenses = useMemo(() => {
    if (selectedMonth === "all") return expenses;
    
    const [year, month] = selectedMonth.split("-").map(Number);
    const monthStart = startOfMonth(new Date(year, month - 1));
    const monthEnd = endOfMonth(new Date(year, month - 1));

    return expenses.filter((expense) => {
      const expenseDate = new Date(expense.expense_date + "T00:00:00");
      return expenseDate >= monthStart && expenseDate <= monthEnd;
    });
  }, [expenses, selectedMonth]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      aluguel: "Aluguel",
      energia: "Energia",
      agua: "Água",
      produtos: "Produtos",
      salarios: "Salários",
      marketing: "Marketing",
      outros: "Outros",
    };
    return labels[category] || category;
  };

  // Total do mês filtrado
  const monthTotal = filteredExpenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base md:text-lg">Histórico de Despesas</CardTitle>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os meses</SelectItem>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[120px]">Data</TableHead>
                  <TableHead className="min-w-[150px]">Descrição</TableHead>
                  <TableHead className="min-w-[100px]">Categoria</TableHead>
                  <TableHead className="text-right min-w-[100px]">Valor</TableHead>
                  <TableHead className="w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhuma despesa neste período
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredExpenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="whitespace-nowrap">{formatDate(expense.expense_date)}</TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>{getCategoryLabel(expense.category)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDeleteExpense(expense.id)}
                          disabled={isDeleting}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        {filteredExpenses.length > 0 && (
          <div className="mt-4 pt-4 border-t flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              {filteredExpenses.length} despesa{filteredExpenses.length !== 1 ? "s" : ""} no período
            </span>
            <span className="font-semibold">
              Total: {formatCurrency(monthTotal)}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};