import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Check, Clock, Calendar as CalendarIcon } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
}

interface AppointmentBookingFormProps {
  barberId: string;
  barberName: string;
  service: Service;
  date: Date;
  time: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AppointmentBookingForm = ({
  barberId,
  barberName,
  service,
  date,
  time,
  onSuccess,
  onCancel,
}: AppointmentBookingFormProps) => {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Por favor, informe seu nome");
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      toast.error("Por favor, informe um telefone válido");
      return;
    }

    setLoading(true);

    try {
      const dateStr = format(date, "yyyy-MM-dd");
      
      // Criar agendamento usando a função RPC segura
      const { data: appointmentId, error: rpcError } = await supabase.rpc(
        "create_appointment_safe",
        {
          p_barber_id: barberId,
          p_service_id: service.id,
          p_customer_name: customerName.trim(),
          p_customer_phone: cleanPhone,
          p_appointment_date: dateStr,
          p_appointment_time: time + ":00",
          p_duration_minutes: service.duration_minutes,
        }
      );

      if (rpcError) {
        throw rpcError;
      }

      // Enviar confirmação via Push Notification e Email
      try {
        const { data: notificationResponse, error: notificationError } = await supabase.functions.invoke(
          'send-appointment-confirmation',
          {
            body: {
              barberId: barberId,
              appointmentId: appointmentId,
              phone: cleanPhone,
              customerName: customerName.trim(),
              barberName: barberName,
              serviceName: service.name,
              date: format(date, "dd/MM/yyyy", { locale: ptBR }),
              time: time,
              price: service.price.toFixed(2)
            },
          }
        );

        if (notificationError) {
          console.error("Erro ao enviar notificação:", notificationError);
        } else if (notificationResponse?.success) {
          console.log("Notificação enviada com sucesso:", notificationResponse);
        }
      } catch (notificationError) {
        console.error("Erro ao enviar notificação:", notificationError);
        // Não falhar o agendamento se a notificação falhar
      }

      setSuccess(true);
      toast.success("Agendamento realizado com sucesso!");

      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (error: any) {
      console.error("Erro ao criar agendamento:", error);
      if (error.message?.includes("não disponível")) {
        toast.error("Este horário não está mais disponível. Por favor, escolha outro horário.");
      } else {
        toast.error("Erro ao criar agendamento. Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-green-100 p-4">
                <Check className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Agendamento Confirmado!
            </h2>
            <p className="text-muted-foreground mb-6">
              Você pode receber uma confirmação via WhatsApp caso a barbearia tenha configurado.
            </p>
            <div className="space-y-2 text-sm text-left bg-muted p-4 rounded-lg mb-6">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Barbeiro:</span>
                <span className="font-semibold">{barberName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Serviço:</span>
                <span className="font-semibold">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data:</span>
                <span className="font-semibold">
                  {format(date, "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horário:</span>
                <span className="font-semibold">{time}</span>
              </div>
            </div>
            <Button onClick={() => navigate("/agenda")} className="w-full">
              Fazer Outro Agendamento
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto max-w-2xl">
        <Button variant="ghost" onClick={onCancel} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Confirmar Agendamento</CardTitle>
            <CardDescription>
              Preencha seus dados para finalizar o agendamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Barbeiro:</span>
                <span className="font-semibold">{barberName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Serviço:</span>
                <span className="font-semibold">{service.name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">
                  {format(date, "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold">{time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Valor:</span>
                <span className="font-bold text-lg text-primary">
                  R$ {service.price.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Seu nome completo"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="(11) 99999-9999"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Você pode receber a confirmação por WhatsApp se a barbearia tiver configurado
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1"
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Agendando..." : "Confirmar Agendamento"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
