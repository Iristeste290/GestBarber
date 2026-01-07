import { FraudLog } from "@/hooks/useFraudLogs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Shield, ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";

interface FraudLogsTableProps {
  logs: FraudLog[];
  isLoading: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "allowed":
      return (
        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
          <ShieldCheck className="w-3 h-3 mr-1" />
          Permitido
        </Badge>
      );
    case "blocked":
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
          <ShieldAlert className="w-3 h-3 mr-1" />
          Bloqueado
        </Badge>
      );
    case "warning":
      return (
        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/30">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Alerta
        </Badge>
      );
    default:
      return (
        <Badge variant="outline">
          <Shield className="w-3 h-3 mr-1" />
          {status}
        </Badge>
      );
  }
};

export const FraudLogsTable = ({ logs, isLoading }: FraudLogsTableProps) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!logs?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <Shield className="w-12 h-12 mb-4 opacity-50" />
        <p>Nenhum log de fraude encontrado</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data/Hora</TableHead>
            <TableHead>IP</TableHead>
            <TableHead className="hidden lg:table-cell">Device ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead className="hidden md:table-cell">User Agent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-sm">
                {format(new Date(log.attempt_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </TableCell>
              <TableCell className="font-mono text-sm">{log.ip_address}</TableCell>
              <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">
                {log.device_id ? `${log.device_id.substring(0, 8)}...` : "-"}
              </TableCell>
              <TableCell>{getStatusBadge(log.status)}</TableCell>
              <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                {log.reason || "-"}
              </TableCell>
              <TableCell className="hidden md:table-cell max-w-[200px] truncate text-xs text-muted-foreground">
                {log.user_agent || "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
