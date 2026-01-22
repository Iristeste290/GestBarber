import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useManualProcessTracker } from "@/hooks/useManualProcessTracker";

interface NewPaymentFormProps {
  onPaymentCreated: () => void;
}

export const NewPaymentForm = ({ onPaymentCreated }: NewPaymentFormProps) => {
  const [clientName, setClientName] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card" | "cash">("pix");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  
  // 📊 Rastreamento de tempo manual
  const { startManualProcess, endManualProcess } = useManualProcessTracker();
  const trackingStarted = useRef(false);

  // Iniciar rastreamento quando usuário começa a preencher
  useEffect(() => {
    if ((clientName || serviceName || amount) && !trackingStarted.current) {
      startManualProcess("manual_payment");
      trackingStarted.current = true;
    }
  }, [clientName, serviceName, amount, startManualProcess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!clientName || !serviceName || !amount) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const numericAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(numericAmount) || numericAmount <= 0) {
      toast.error("Informe um valor válido");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { error } = await supabase.from("payments").insert({
        user_id: user.id,
        client_name: clientName,
        service_name: serviceName,
        amount: numericAmount,
        payment_method: paymentMethod,
        notes: notes || null,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Cobrança criada com sucesso!");
      
      // ✅ Finalizar rastreamento de tempo manual
      await endManualProcess();
      trackingStarted.current = false;
      
      // Reset form
      setClientName("");
      setServiceName("");
      setAmount("");
      setPaymentMethod("pix");
      setNotes("");
      
      onPaymentCreated();
    } catch (error) {
      console.error("Erro ao criar cobrança:", error);
      toast.error("Erro ao criar cobrança");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nova Cobrança</CardTitle>
        <CardDescription>Crie uma nova cobrança para seus clientes</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Nome do Cliente *</Label>
            <Input
              id="client"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Ex: João Silva"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="service">Serviço *</Label>
            <Input
              id="service"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="Ex: Corte + Barba"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (R$) *</Label>
            <Input
              id="amount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Ex: 45.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="method">Método de Pagamento</Label>
            <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pix">Pix</SelectItem>
                <SelectItem value="card">Cartão</SelectItem>
                <SelectItem value="cash">Dinheiro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informações adicionais..."
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Criando..." : "Criar Cobrança"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
