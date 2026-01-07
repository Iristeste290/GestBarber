import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Coffee, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface BarberBreak {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  break_type: string;
  description: string | null;
}

interface BarberBreaksManagerProps {
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

const BREAK_TYPES = [
  { value: "lunch", label: "Almoço" },
  { value: "break", label: "Intervalo" },
  { value: "other", label: "Outro" },
];

export const BarberBreaksManager = ({ barberId, barberName }: BarberBreaksManagerProps) => {
  const [breaks, setBreaks] = useState<BarberBreak[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeekday, setSelectedWeekday] = useState<number>(1);
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [breakType, setBreakType] = useState("lunch");
  const [description, setDescription] = useState("");

  useEffect(() => {
    loadBreaks();
  }, [barberId]);

  const loadBreaks = async () => {
    try {
      const { data, error } = await supabase
        .from("barber_breaks")
        .select("*")
        .eq("barber_id", barberId)
        .order("weekday");

      if (error) throw error;
      setBreaks(data || []);
    } catch (error) {
      console.error("Erro ao carregar intervalos:", error);
      toast.error("Erro ao carregar intervalos");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBreak = async () => {
    if (!startTime || !endTime) {
      toast.error("Preencha os horários");
      return;
    }

    if (startTime >= endTime) {
      toast.error("Horário de início deve ser antes do horário de término");
      return;
    }

    try {
      const { error } = await supabase
        .from("barber_breaks")
        .insert({
          barber_id: barberId,
          weekday: selectedWeekday,
          start_time: startTime + ":00",
          end_time: endTime + ":00",
          break_type: breakType,
          description: description || null,
        });

      if (error) throw error;

      toast.success("Intervalo adicionado!");
      loadBreaks();
      setStartTime("12:00");
      setEndTime("13:00");
      setDescription("");
    } catch (error: any) {
      toast.error("Erro ao adicionar intervalo: " + error.message);
    }
  };

  const handleDeleteBreak = async (id: string) => {
    try {
      const { error } = await supabase
        .from("barber_breaks")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Intervalo removido!");
      loadBreaks();
    } catch (error: any) {
      toast.error("Erro ao remover intervalo: " + error.message);
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
          <Coffee className="h-5 w-5 text-primary" />
          <CardTitle>Intervalos e Pausas</CardTitle>
        </div>
        <CardDescription>
          Configure horários de almoço e pausas de {barberName}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário para adicionar intervalo */}
        <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label>Tipo de Intervalo</Label>
              <select
                value={breakType}
                onChange={(e) => setBreakType(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              >
                {BREAK_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Início do Intervalo</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Fim do Intervalo</Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Descrição (opcional)</Label>
            <Input
              placeholder="Ex: Horário de almoço"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <Button onClick={handleAddBreak} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Intervalo
          </Button>
        </div>

        {/* Lista de intervalos cadastrados */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">Intervalos Cadastrados</h3>
          {breaks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum intervalo cadastrado ainda
            </p>
          ) : (
            <div className="space-y-2">
              {breaks.map((brk) => (
                <div
                  key={brk.id}
                  className="flex items-center justify-between p-3 border rounded-lg bg-background"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <Badge variant="outline">
                      {WEEKDAYS.find((d) => d.value === brk.weekday)?.label}
                    </Badge>
                    <Badge variant="secondary">
                      {BREAK_TYPES.find((t) => t.value === brk.break_type)?.label}
                    </Badge>
                    <div className="text-sm">
                      {brk.start_time.substring(0, 5)} - {brk.end_time.substring(0, 5)}
                    </div>
                    {brk.description && (
                      <span className="text-xs text-muted-foreground">
                        ({brk.description})
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBreak(brk.id)}
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
