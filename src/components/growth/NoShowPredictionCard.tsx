import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  MessageCircle, 
  Sparkles,
  TrendingUp,
  XCircle,
  ShieldAlert,
  Send,
  Zap
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GrowthFeatureGate } from "./GrowthFeatureGate";
import { openWhatsAppChat, formatReminderMessage } from "@/lib/whatsapp";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Prediction {
  probability: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  factors: string[];
  recommendation: string;
  suggestedActions: string[];
}

interface AppointmentPrediction {
  appointmentId: string;
  customerName: string;
  appointmentDate: string;
  appointmentTime: string;
  prediction: Prediction;
  stats: {
    totalAppointments: number;
    noShows: number;
    cancellations: number;
    completed: number;
  };
}

interface Appointment {
  id: string;
  customer_name: string;
  customer_phone?: string;
  appointment_date: string;
  appointment_time: string;
  status: string;
  barber_name?: string;
  service_name?: string;
}

interface NoShowPredictionCardProps {
  appointments: Appointment[];
  isLoading?: boolean;
  reminderTemplate?: string | null;
}

export const NoShowPredictionCard = ({ appointments, isLoading, reminderTemplate }: NoShowPredictionCardProps) => {
  const [predictions, setPredictions] = useState<Record<string, AppointmentPrediction>>({});
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [bulkSending, setBulkSending] = useState(false);

  const pendingAppointments = appointments.filter(
    apt => apt.status === "pending" || apt.status === "confirmed"
  );

  const highRiskAppointments = pendingAppointments.filter(apt => {
    const prediction = predictions[apt.id];
    return prediction && (prediction.prediction.riskLevel === "high" || prediction.prediction.riskLevel === "critical");
  });

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "critical":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Crítico</Badge>;
      case "high":
        return <Badge className="bg-orange-500 gap-1"><AlertTriangle className="h-3 w-3" />Alto</Badge>;
      case "medium":
        return <Badge className="bg-yellow-500 text-black gap-1"><Clock className="h-3 w-3" />Médio</Badge>;
      default:
        return <Badge className="bg-green-500 gap-1"><CheckCircle className="h-3 w-3" />Baixo</Badge>;
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 60) return "text-red-500";
    if (probability >= 40) return "text-orange-500";
    if (probability >= 20) return "text-yellow-500";
    return "text-green-500";
  };

  const analyzePrediction = async (appointmentId: string) => {
    setLoadingId(appointmentId);
    try {
      const { data, error } = await supabase.functions.invoke("predict-no-show", {
        body: { appointmentId }
      });

      if (error) throw error;

      setPredictions(prev => ({
        ...prev,
        [appointmentId]: data
      }));

      const riskLevel = data.prediction.riskLevel;
      if (riskLevel === "critical" || riskLevel === "high") {
        toast.warning("Atenção!", {
          description: `${data.customerName} tem ${data.prediction.probability}% de chance de não comparecer.`
        });
      } else {
        toast.success("Análise concluída", {
          description: `Risco de no-show: ${data.prediction.probability}%`
        });
      }
    } catch (error: any) {
      toast.error("Erro ao analisar", {
        description: error.message
      });
    } finally {
      setLoadingId(null);
    }
  };

  const analyzeAllAppointments = async () => {
    for (const apt of pendingAppointments) {
      if (!predictions[apt.id]) {
        await analyzePrediction(apt.id);
      }
    }
  };

  const sendWhatsAppReminder = async (appointment: Appointment) => {
    if (!appointment.customer_phone) {
      toast.error("Sem telefone", {
        description: "Cliente não possui telefone cadastrado"
      });
      return;
    }

    setSendingReminder(appointment.id);

    try {
      const formattedDate = format(
        new Date(appointment.appointment_date + "T00:00:00"),
        "EEEE, dd 'de' MMMM",
        { locale: ptBR }
      );

      const message = formatReminderMessage(reminderTemplate || null, {
        customerName: appointment.customer_name,
        formattedDate,
        time: appointment.appointment_time.substring(0, 5),
        serviceName: appointment.service_name || "Serviço",
        barberName: appointment.barber_name || "Profissional"
      });

      // Clean phone number
      const phoneDigits = appointment.customer_phone.replace(/\D/g, "");
      const phoneE164 = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`;

      // Open WhatsApp chat
      openWhatsAppChat({
        phoneE164Digits: phoneE164,
        message,
        newTab: true
      });

      toast.success("WhatsApp aberto!", {
        description: `Lembrete preparado para ${appointment.customer_name}`
      });
    } catch (error: any) {
      toast.error("Erro ao enviar", {
        description: error.message
      });
    } finally {
      setSendingReminder(null);
    }
  };

  const sendBulkReminders = async () => {
    if (highRiskAppointments.length === 0) {
      toast.info("Nenhum cliente de alto risco", {
        description: "Analise os agendamentos primeiro para identificar clientes de risco"
      });
      return;
    }

    setBulkSending(true);

    const appointmentsWithPhone = highRiskAppointments.filter(apt => apt.customer_phone);
    
    if (appointmentsWithPhone.length === 0) {
      toast.error("Sem telefones", {
        description: "Nenhum cliente de alto risco possui telefone cadastrado"
      });
      setBulkSending(false);
      return;
    }

    // Open WhatsApp for each high-risk client with a small delay
    for (let i = 0; i < appointmentsWithPhone.length; i++) {
      const apt = appointmentsWithPhone[i];
      
      const formattedDate = format(
        new Date(apt.appointment_date + "T00:00:00"),
        "EEEE, dd 'de' MMMM",
        { locale: ptBR }
      );

      const message = formatReminderMessage(reminderTemplate || null, {
        customerName: apt.customer_name,
        formattedDate,
        time: apt.appointment_time.substring(0, 5),
        serviceName: apt.service_name || "Serviço",
        barberName: apt.barber_name || "Profissional"
      });

      const phoneDigits = apt.customer_phone!.replace(/\D/g, "");
      const phoneE164 = phoneDigits.startsWith("55") ? phoneDigits : `55${phoneDigits}`;

      // Small delay between opening tabs to avoid browser blocking
      await new Promise(resolve => setTimeout(resolve, i * 500));

      openWhatsAppChat({
        phoneE164Digits: phoneE164,
        message,
        newTab: true
      });
    }

    toast.success(`${appointmentsWithPhone.length} lembretes preparados!`, {
      description: "Abas do WhatsApp abertas para cada cliente de alto risco"
    });

    setBulkSending(false);
  };

  const content = (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Previsão de No-Show (IA)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Analise a probabilidade de não comparecimento e envie lembretes automáticos
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bulk Actions */}
        {pendingAppointments.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <Button
              size="sm"
              variant="outline"
              onClick={analyzeAllAppointments}
              disabled={loadingId !== null}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Analisar Todos ({pendingAppointments.length})
            </Button>
            
            {highRiskAppointments.length > 0 && (
              <Button
                size="sm"
                variant="default"
                onClick={sendBulkReminders}
                disabled={bulkSending}
                className="gap-2 bg-green-600 hover:bg-green-700"
              >
                <Zap className="h-4 w-4" />
                {bulkSending ? "Enviando..." : `Lembrete para ${highRiskAppointments.length} Alto Risco`}
              </Button>
            )}
          </div>
        )}

        {/* Stats Summary */}
        {Object.keys(predictions).length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2 rounded bg-green-500/10 text-center">
              <div className="text-lg font-bold text-green-600">
                {Object.values(predictions).filter(p => p.prediction.riskLevel === "low").length}
              </div>
              <div className="text-xs text-muted-foreground">Baixo Risco</div>
            </div>
            <div className="p-2 rounded bg-yellow-500/10 text-center">
              <div className="text-lg font-bold text-yellow-600">
                {Object.values(predictions).filter(p => p.prediction.riskLevel === "medium").length}
              </div>
              <div className="text-xs text-muted-foreground">Médio Risco</div>
            </div>
            <div className="p-2 rounded bg-orange-500/10 text-center">
              <div className="text-lg font-bold text-orange-600">
                {Object.values(predictions).filter(p => p.prediction.riskLevel === "high").length}
              </div>
              <div className="text-xs text-muted-foreground">Alto Risco</div>
            </div>
            <div className="p-2 rounded bg-red-500/10 text-center">
              <div className="text-lg font-bold text-red-600">
                {Object.values(predictions).filter(p => p.prediction.riskLevel === "critical").length}
              </div>
              <div className="text-xs text-muted-foreground">Crítico</div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : pendingAppointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum agendamento pendente para analisar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingAppointments.slice(0, 10).map(apt => {
              const prediction = predictions[apt.id];
              
              return (
                <div 
                  key={apt.id}
                  className="p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{apt.customer_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(apt.appointment_date + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })} às {apt.appointment_time.substring(0, 5)}
                      </p>
                      {apt.customer_phone && (
                        <p className="text-xs text-muted-foreground mt-1">
                          📱 {apt.customer_phone}
                        </p>
                      )}
                    </div>
                    
                    {prediction ? (
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getProbabilityColor(prediction.prediction.probability)}`}>
                          {prediction.prediction.probability}%
                        </div>
                        {getRiskBadge(prediction.prediction.riskLevel)}
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => analyzePrediction(apt.id)}
                        disabled={loadingId === apt.id}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        {loadingId === apt.id ? "Analisando..." : "Analisar"}
                      </Button>
                    )}
                  </div>

                  {prediction && (
                    <div className="mt-4 space-y-3 pt-3 border-t">
                      {/* Factors */}
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Fatores de risco:</p>
                        <div className="flex flex-wrap gap-1">
                          {prediction.prediction.factors.map((factor, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Recommendation */}
                      <div className="p-2 rounded bg-primary/5 border border-primary/10">
                        <p className="text-sm">
                          <span className="font-medium text-primary">💡 Recomendação:</span>{" "}
                          {prediction.prediction.recommendation}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => sendWhatsAppReminder(apt)}
                          disabled={sendingReminder === apt.id || !apt.customer_phone}
                          className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <Send className="h-4 w-4" />
                          {sendingReminder === apt.id ? "Abrindo..." : "Enviar WhatsApp"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => analyzePrediction(apt.id)}
                          className="gap-2"
                        >
                          <TrendingUp className="h-4 w-4" />
                          Reanalisar
                        </Button>
                      </div>

                      {!apt.customer_phone && (
                        <p className="text-xs text-amber-600">
                          ⚠️ Cliente sem telefone cadastrado
                        </p>
                      )}

                      {/* Stats */}
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>✅ {prediction.stats.completed} comparecimentos</span>
                        <span>❌ {prediction.stats.noShows} faltas</span>
                        <span>🔄 {prediction.stats.cancellations} cancelamentos</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <GrowthFeatureGate 
      featureName="Previsão de No-Show"
      featureDescription="Use IA para prever quais clientes têm maior probabilidade de faltar e tome ações preventivas."
    >
      {content}
    </GrowthFeatureGate>
  );
};
