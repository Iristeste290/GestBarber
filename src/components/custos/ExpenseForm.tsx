import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface ExpenseFormProps {
  onAddExpense: (expense: {
    description: string;
    category: string;
    amount: number;
    expense_date: string;
  }) => void;
  isAdding: boolean;
}

export const ExpenseForm = ({ onAddExpense, isAdding }: ExpenseFormProps) => {
  const [newExpense, setNewExpense] = useState({
    description: "",
    category: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = () => {
    if (!newExpense.description || !newExpense.category || !newExpense.amount) {
      return;
    }

    onAddExpense({
      description: newExpense.description,
      category: newExpense.category,
      amount: parseFloat(newExpense.amount),
      expense_date: newExpense.date,
    });

    setNewExpense({
      description: "",
      category: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Adicionar Despesa</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Aluguel"
              value={newExpense.description}
              onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={newExpense.category}
              onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="aluguel">Aluguel</SelectItem>
                <SelectItem value="energia">Energia</SelectItem>
                <SelectItem value="agua">Água</SelectItem>
                <SelectItem value="produtos">Produtos</SelectItem>
                <SelectItem value="salarios">Salários</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="outros">Outros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={newExpense.amount}
              onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full sm:w-auto"
          disabled={isAdding || !newExpense.description || !newExpense.category || !newExpense.amount}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Despesa
        </Button>
      </CardContent>
    </Card>
  );
};