import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface TransactionFormProps {
  onAddTransaction: (type: string, amount: number, description: string) => Promise<boolean>;
}

export const TransactionForm = ({ onAddTransaction }: TransactionFormProps) => {
  const [transactionType, setTransactionType] = useState("entrada");
  const [transactionAmount, setTransactionAmount] = useState("");
  const [transactionDescription, setTransactionDescription] = useState("");

  const handleAddTransaction = async () => {
    if (!transactionAmount || !transactionDescription) return;

    const success = await onAddTransaction(
      transactionType,
      parseFloat(transactionAmount),
      transactionDescription
    );

    if (success) {
      setTransactionAmount("");
      setTransactionDescription("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base md:text-lg">Adicionar Movimentação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <div className="space-y-2">
            <Label htmlFor="transaction-type">Tipo</Label>
            <Select value={transactionType} onValueChange={setTransactionType}>
              <SelectTrigger id="transaction-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="entrada">Entrada</SelectItem>
                <SelectItem value="saida">Saída</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="transaction-amount">Valor (R$)</Label>
            <Input
              id="transaction-amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={transactionAmount}
              onChange={(e) => setTransactionAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2 sm:col-span-1">
            <Label htmlFor="transaction-description">Descrição</Label>
            <Input
              id="transaction-description"
              placeholder="Ex: Venda de produto"
              value={transactionDescription}
              onChange={(e) => setTransactionDescription(e.target.value)}
            />
          </div>
        </div>

        <Button 
          onClick={handleAddTransaction} 
          className="w-full sm:w-auto"
          disabled={!transactionAmount || !transactionDescription}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar
        </Button>
      </CardContent>
    </Card>
  );
};