import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarOff, Plus, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format, isBefore, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface BarberException {
  id: string;
  date: string;
  is_closed: boolean;
  note: string | null;
}

interface BarberExceptionsManagerProps {
  barberId: string;
  barberName: string;
}

export const BarberExceptionsManager = ({ barberId, barberName }: BarberExceptionsManagerProps) => {
  const [exceptions, setExceptions] = useState<BarberException[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [note, setNote] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  useEffect(() => {
    loadExceptions();
  }, [barberId]);

  const loadExceptions = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from("barber_exceptions")
        .select("*")
        .eq("barber_id", barberId)
        .gte("date", today)
        .order("date");

      if (error) throw error;
      setExceptions(data || []);
    } catch (error) {
      console.error("Erro ao carregar folgas:", error);
      toast.error("Erro ao carregar folgas");
    } finally {
      setLoading(false);
    }
  };

  const handleAddException = async () => {
    if (!selectedDate) {
      toast.error("Selecione uma data");
      return;
    }

    const dateStr = format(selectedDate, "yyyy-MM-dd");
    
    // Check if date already exists
    if (exceptions.some(e => e.date === dateStr)) {
      toast.error("Esta data já está cadastrada como folga");
      return;
    }

    try {
      const { error } = await supabase
        .from("barber_exceptions")
        .insert({
          barber_id: barberId,
          date: dateStr,
          is_closed: true,
          note: note || null,
        });

      if (error) throw error;

      toast.success("Folga adicionada!");
      loadExceptions();
      setSelectedDate(undefined);
      setNote("");
      setIsCalendarOpen(false);
    } catch (error: any) {
      toast.error("Erro ao adicionar folga: " + error.message);
    }
  };

  const handleDeleteException = async (id: string) => {
    try {
      const { error } = await supabase
        .from("barber_exceptions")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Folga removida!");
      loadExceptions();
    } catch (error: any) {
      toast.error("Erro ao remover folga: " + error.message);
    }
  };

  const disabledDays = (date: Date) => {
    return isBefore(date, startOfDay(new Date()));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Carregando...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <CalendarOff className="h-5 w-5 text-primary" />
          <CardTitle>Folgas e Exceções</CardTitle>
        </div>
        <CardDescription>
          Configure dias de folga ou ausências de {barberName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário para adicionar folga */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Data da Folga</Label>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {selectedDate ? (
                      format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    ) : (
                      "Selecione uma data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setIsCalendarOpen(false);
                    }}
                    disabled={disabledDays}
                    locale={ptBR}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Motivo (opcional)</Label>
              <Input
                placeholder="Ex: Consulta médica, Férias, etc."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleAddException} className="w-full" disabled={!selectedDate}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Folga
          </Button>
        </div>

        {/* Lista de folgas cadastradas */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Próximas Folgas</h3>
          {exceptions.length === 0 ? (
            <div className="text-center py-8 border rounded-lg bg-muted/20">
              <CalendarOff className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Nenhuma folga programada
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione dias de folga para que não apareçam na agenda
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {exceptions.map((exception) => {
                const date = new Date(exception.date + 'T12:00:00');
                const isToday = format(new Date(), 'yyyy-MM-dd') === exception.date;
                
                return (
                  <div
                    key={exception.id}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-lg",
                      isToday ? "bg-amber-50 border-amber-200" : "bg-background"
                    )}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <Badge variant={isToday ? "default" : "outline"} className="text-xs">
                            {format(date, "EEEE", { locale: ptBR })}
                          </Badge>
                          <span className="font-medium text-sm">
                            {format(date, "dd/MM/yyyy")}
                          </span>
                        </div>
                        {exception.note && (
                          <span className="text-xs text-muted-foreground mt-1">
                            {exception.note}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteException(exception.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Dica */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-3">
          <p className="text-xs text-blue-800 dark:text-blue-200">
            💡 <strong>Dica:</strong> As folgas cadastradas aqui serão automaticamente 
            bloqueadas na agenda online e o bot do WhatsApp não oferecerá esses dias para agendamento.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};