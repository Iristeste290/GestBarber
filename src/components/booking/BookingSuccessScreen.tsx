import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Calendar, MessageCircle, Copy, CheckCircle2, Sparkles } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

interface Service {
  name: string;
  price: number;
  duration_minutes: number;
}

interface BookingSuccessScreenProps {
  barberName: string;
  service: Service;
  date: Date;
  time: string;
  customerPhone?: string;
  onNewBooking: () => void;
}

export const BookingSuccessScreen = ({
  barberName,
  service,
  date,
  time,
  customerPhone,
  onNewBooking,
}: BookingSuccessScreenProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const formattedDate = format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const shortDate = format(date, "dd/MM/yyyy");

  // Generate Google Calendar URL
  const getGoogleCalendarUrl = () => {
    const startDate = new Date(date);
    const [hours, minutes] = time.split(":").map(Number);
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + service.duration_minutes);

    const formatGoogleDate = (d: Date) => d.toISOString().replace(/-|:|\.\d{3}/g, "");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: `${service.name} - ${barberName}`,
      dates: `${formatGoogleDate(startDate)}/${formatGoogleDate(endDate)}`,
      details: `Agendamento de ${service.name} com ${barberName}.\nValor: R$ ${service.price.toFixed(2)}`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  // Generate WhatsApp message
  const getWhatsAppUrl = () => {
    const message = encodeURIComponent(
      `🗓️ *Lembrete de Agendamento*\n\n` +
      `📍 Barbeiro: ${barberName}\n` +
      `✂️ Serviço: ${service.name}\n` +
      `📅 Data: ${shortDate}\n` +
      `⏰ Horário: ${time}\n` +
      `💰 Valor: R$ ${service.price.toFixed(2)}\n\n` +
      `Não se esqueça do seu horário! 💈`
    );

    // If customer phone is available, send to them
    const phone = customerPhone ? `55${customerPhone.replace(/\D/g, "")}` : "";
    return phone ? `https://wa.me/${phone}?text=${message}` : `https://wa.me/?text=${message}`;
  };

  const copyToClipboard = () => {
    const text = `${service.name} com ${barberName}\nData: ${shortDate} às ${time}\nValor: R$ ${service.price.toFixed(2)}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Informações copiadas!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-md w-full overflow-hidden">
        {/* Success Header */}
        <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-8 text-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMiIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9zdmc+')] opacity-50" />
          <div className="relative">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-white/20 p-4 backdrop-blur-sm animate-scale-in">
                <Check className="h-12 w-12 text-white" />
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="h-5 w-5 text-yellow-200" />
              <h2 className="text-2xl font-bold text-white">Agendamento Confirmado!</h2>
              <Sparkles className="h-5 w-5 text-yellow-200" />
            </div>
            <p className="text-white/90 text-sm">
              Você receberá uma confirmação caso a barbearia tenha WhatsApp configurado.
            </p>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          {/* Booking Details */}
          <div className="space-y-3 bg-muted/50 p-4 rounded-xl">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Barbeiro</span>
              <span className="font-semibold text-foreground">{barberName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Serviço</span>
              <span className="font-semibold text-foreground">{service.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Data</span>
              <span className="font-semibold text-foreground">{shortDate}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Horário</span>
              <span className="font-semibold text-foreground">{time}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-border">
              <span className="text-muted-foreground">Valor</span>
              <span className="font-bold text-lg text-primary">R$ {service.price.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Add to Google Calendar */}
            <Button
              asChild
              size="lg"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <a href={getGoogleCalendarUrl()} target="_blank" rel="noopener noreferrer">
                <Calendar className="mr-2 h-5 w-5" />
                Adicionar ao Google Agenda
              </a>
            </Button>

            {/* Send WhatsApp Reminder */}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
            >
              <a href={getWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="mr-2 h-5 w-5" />
                Enviar Lembrete via WhatsApp
              </a>
            </Button>

            {/* Copy Details */}
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-muted-foreground"
              onClick={copyToClipboard}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar informações
                </>
              )}
            </Button>
          </div>

          {/* New Booking */}
          <Button
            variant="secondary"
            size="lg"
            className="w-full"
            onClick={onNewBooking}
          >
            Fazer Outro Agendamento
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
