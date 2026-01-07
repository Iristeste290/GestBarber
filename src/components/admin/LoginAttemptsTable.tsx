import { LoginAttempt } from "@/hooks/useLoginAttempts";
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
import { CheckCircle, XCircle, Globe, Mail } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoginAttemptsTableProps {
  attempts: LoginAttempt[];
  isLoading: boolean;
}

export function LoginAttemptsTable({ attempts, isLoading }: LoginAttemptsTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma tentativa de login registrada.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>IP</TableHead>
            <TableHead>Data/Hora</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attempts.map((attempt) => (
            <TableRow key={attempt.id}>
              <TableCell>
                {attempt.success ? (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Sucesso
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20">
                    <XCircle className="w-3 h-3 mr-1" />
                    Falha
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{attempt.email}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <span className="font-mono text-sm">{attempt.ip_address || "N/A"}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {format(new Date(attempt.attempted_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
