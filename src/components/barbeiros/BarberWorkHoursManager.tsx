import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface WorkHour {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
}

interface BarberWorkHoursManagerProps {
  barberId: string;
  barberName: string;
}

const WEEKDAYS = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

export const BarberWorkHoursManager = ({ barberId, barberName }: BarberWorkHoursManagerProps) => {
  const [workHours, setWorkHours] = useState<WorkHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");

  useEffect(() => {
    loadWorkHours();
  }, [barberId]);

  const loadWorkHours = async () => {
    try {
      const { data, error } = await supabase
        .from("barber_work_hours")
        .select("*")
        .eq("barber_id", barberId)
        .order("weekday");

      if (error) throw error;
      setWorkHours(data || []);
    } catch (error) {
      console.error("Erro ao carregar horários:", error);
      toast.error("Erro ao carregar horários de trabalho");
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkHour = async () => {
    if (!startTime || !endTime) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (startTime >= endTime) {
      toast.error("Horário de início deve ser antes do horário de término");
      return;
    }

    try {
      const { error } = await supabase
        .from("barber_work_hours")
        .insert({
          barber_id: barberId,
          weekday: selectedWeekday,
          start_time: startTime + ":00",
          end_time: endTime + ":00",
        });

      if (error) throw error;

      toast.success("Horário de trabalho adicionado!");
      loadWorkHours();
      setStartTime("09:00");
      setEndTime("18:00");
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Já existe horário cadastrado para este dia");
      } else {
        toast.error("Erro ao adicionar horário: " + error.message);
      }
    }
  };

  const handleDeleteWorkHour = async (id: string) => {
    try {
      const { error } = await supabase
        .from("barber_work_hours")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Horário removido!");
      loadWorkHours();
    } catch (error: any) {
      toast.error("Erro ao remover horário: " + error.message);
    }
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
          <Clock className="h-5 w-5 text-primary" />
          <CardTitle>Horários de Trabalho</CardTitle>
        </div>
        <CardDescription>
          Configure os horários de trabalho de {barberName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário para adicionar horário */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="space-y-2">
            <Label>Dia da Semana</Label>
            <select
              value={selectedWeekday}
              onChange={(e) => setSelectedWeekday(Number(e.target.value))}
              className="w-full px-3 py-2 border rounded-md bg-background"
            >
              {WEEKDAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário de Início</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Horário de Término</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleAddWorkHour} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Horário
          </Button>
        </div>

        {/* Lista de horários cadastrados */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Horários Cadastrados</h3>
          {workHours.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum horário cadastrado ainda
            </p>
          ) : (
            <div className="space-y-2">
              {workHours.map((wh) => (
                <div
                  key={wh.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">
                      {WEEKDAYS.find((d) => d.value === wh.weekday)?.label}
                    </Badge>
                    <div className="text-sm">
                      {wh.start_time.substring(0, 5)} - {wh.end_time.substring(0, 5)}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteWorkHour(wh.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
