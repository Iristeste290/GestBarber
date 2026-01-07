import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface BarberAppointmentsProps {
  appointments: any[];
}

export const BarberAppointments = ({ appointments }: BarberAppointmentsProps) => {
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      confirmed: "secondary",
      completed: "default",
      cancelled: "destructive",
    };

    const labels: Record<string, string> = {
      pending: "Pendente",
      confirmed: "Confirmado",
      completed: "Concluído",
      cancelled: "Cancelado",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agendamentos de Hoje ({appointments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum agendamento para hoje</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {appointments.map((appointment: any) => (
                <div
                  key={appointment.id}
                  className="flex flex-col gap-2 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {appointment.profiles?.full_name || 'Cliente'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {appointment.services?.name}
                      </p>
                    </div>
                    {getStatusBadge(appointment.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {appointment.appointment_time}
                    </div>
                    <div className="flex items-center gap-1">
                      💰 R$ {appointment.services?.price?.toFixed(2)}
                    </div>
                  </div>
                  {appointment.notes && (
                    <p className="text-xs text-muted-foreground mt-2 p-2 bg-muted rounded">
                      📝 {appointment.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
