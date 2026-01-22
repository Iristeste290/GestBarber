import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { TriggerStats } from "@/hooks/useUpgradeTriggerAnalytics";

interface TriggerTypeTableProps {
  data: TriggerStats[];
}

const triggerLabels: Record<string, string> = {
  money_lost: "Dinheiro Perdido",
  empty_slots: "Horários Vazios",
  abandoned_booking: "Reservas Abandonadas",
  manual_time: "Tempo Manual",
  lost_clients: "Clientes Perdidos",
  no_show_prediction: "Previsão No-Show",
  feature_block: "Bloqueio de Recurso",
};

const getTriggerLabel = (type: string) => triggerLabels[type] || type;

export const TriggerTypeTable = ({ data }: TriggerTypeTableProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por Tipo de Gatilho</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Gatilho</TableHead>
              <TableHead className="text-center">Disparados</TableHead>
              <TableHead className="text-center">Convertidos</TableHead>
              <TableHead className="text-center">Dispensados</TableHead>
              <TableHead>Taxa de Conversão</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Nenhum gatilho registrado ainda
                </TableCell>
              </TableRow>
            ) : (
              data.map((trigger) => (
                <TableRow key={trigger.triggerType}>
                  <TableCell className="font-medium">
                    {getTriggerLabel(trigger.triggerType)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{trigger.total}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="default" className="bg-success">
                      {trigger.converted}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{trigger.dismissed}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Progress 
                        value={trigger.conversionRate} 
                        className="h-2 w-20"
                      />
                      <span className="text-sm font-medium w-12">
                        {trigger.conversionRate.toFixed(1)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
