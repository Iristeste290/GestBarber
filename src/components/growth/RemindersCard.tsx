import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, MessageCircle, Mail, Check, Clock, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export interface PendingReminder {
  id: string;
  appointment_id: string;
  client_name: string | null;
  client_phone: string | null;
  client_email?: string | null;
  appointment_date: string;
  appointment_time: string;
  barber_name: string | null;
  barbershop_name: string;
  reminder_sent: boolean;
}

interface RemindersCardProps {
  reminders: PendingReminder[];
  isLoading: boolean;
  onMarkAsSent: (id: string) => void;
}

export const RemindersCard = ({ reminders, isLoading, onMarkAsSent }: RemindersCardProps) => {
  const [sentReminders, setSentReminders] = useState<Set<string>>(new Set());

  const generateWhatsAppLink = (reminder: PendingReminder) => {
    if (!reminder.client_phone) return null;
    
    const cleanPhone = reminder.client_phone.replace(/\D/g, "");
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
    
    const formattedDate = format(new Date(reminder.appointment_date), "dd/MM", { locale: ptBR });
    const message = `Oi ${reminder.client_name || "cliente"}, lembrando do seu horário em ${formattedDate} às ${reminder.appointment_time} na ${reminder.barbershop_name}. Te esperamos!`;
    
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
  };

  const generateEmailLink = (reminder: PendingReminder) => {
    if (!reminder.client_email) return null;
    
    const formattedDate = format(new Date(reminder.appointment_date), "dd/MM", { locale: ptBR });
    const subject = `Lembrete do seu horário - ${reminder.barbershop_name}`;
    const body = `Oi ${reminder.client_name || "cliente"}, lembrando do seu horário em ${formattedDate} às ${reminder.appointment_time} na ${reminder.barbershop_name}. Te esperamos!`;
    
    return `mailto:${reminder.client_email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleSendReminder = (reminder: PendingReminder, type: "whatsapp" | "email") => {
    const link = type === "whatsapp" 
      ? generateWhatsAppLink(reminder) 
      : generateEmailLink(reminder);
    
    if (link) {
      window.open(link, "_blank");
      setSentReminders(prev => new Set(prev).add(reminder.id));
      onMarkAsSent(reminder.id);
      toast.success("Lembrete marcado como enviado");
    }
  };

  const pendingCount = reminders.filter(r => !r.reminder_sent && !sentReminders.has(r.id)).length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-500" />
            <CardTitle>Lembretes Pendentes</CardTitle>
            {pendingCount > 0 && (
              <Badge variant="destructive" className="bg-yellow-500">
                {pendingCount} pendente{pendingCount !== 1 ? "s" : ""}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Clientes com agendamento nas próximas 24h que precisam de lembrete
        </CardDescription>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-green-100 p-4 mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg">Tudo em dia!</h3>
            <p className="text-muted-foreground">
              Todos os clientes já foram lembrados ou não há agendamentos próximos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Hora</TableHead>
                  <TableHead>Barbeiro</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reminders.map((reminder) => {
                  const isSent = reminder.reminder_sent || sentReminders.has(reminder.id);
                  const formattedDate = format(new Date(reminder.appointment_date), "dd/MM/yyyy", { locale: ptBR });
                  
                  return (
                    <TableRow key={reminder.id} className={isSent ? "opacity-60" : ""}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="rounded-full bg-muted p-1.5">
                            <User className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{reminder.client_name || "Cliente"}</p>
                            <p className="text-xs text-muted-foreground">{reminder.client_phone}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{formattedDate}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {reminder.appointment_time}
                        </div>
                      </TableCell>
                      <TableCell>{reminder.barber_name || "-"}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={isSent ? "secondary" : "destructive"}
                          className={isSent ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
                        >
                          {isSent ? "Enviado" : "Não enviado"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {reminder.client_phone && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleSendReminder(reminder, "whatsapp")}
                              disabled={isSent}
                            >
                              <MessageCircle className="h-4 w-4" />
                              WhatsApp
                            </Button>
                          )}
                          {reminder.client_email && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={() => handleSendReminder(reminder, "email")}
                              disabled={isSent}
                            >
                              <Mail className="h-4 w-4" />
                              E-mail
                            </Button>
                          )}
                          {!reminder.client_phone && !reminder.client_email && (
                            <span className="text-xs text-muted-foreground">Sem contato</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
