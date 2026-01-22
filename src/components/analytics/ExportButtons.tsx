import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";
import { useManualProcessTracker } from "@/hooks/useManualProcessTracker";

interface ExportButtonsProps {
  monthlyData: any;
  weeklyData: any;
  peakHours: any;
}

export const ExportButtons = ({ monthlyData, weeklyData, peakHours }: ExportButtonsProps) => {
  // 📊 Rastreamento de tempo manual para relatórios
  const { logManualProcess } = useManualProcessTracker();
  const exportStartTime = useRef<number>(0);

  const exportMonthlyReport = async () => {
    if (!monthlyData) return;
    exportStartTime.current = Date.now();
    
    const data = [
      {
        periodo: 'Mês Atual',
        receita: monthlyData.current.revenue,
        despesas: monthlyData.current.expenses,
        lucro: monthlyData.current.profit,
        agendamentos: monthlyData.current.appointmentsCount,
        vendas: monthlyData.current.salesCount,
      },
      {
        periodo: 'Mês Anterior',
        receita: monthlyData.previous.revenue,
        despesas: monthlyData.previous.expenses,
        lucro: monthlyData.previous.profit,
        agendamentos: monthlyData.previous.appointmentsCount,
        vendas: monthlyData.previous.salesCount,
      }
    ];

    exportToCSV(data, 'relatorio_mensal');
    toast.success('Relatório mensal exportado com sucesso!');
    
    // 📊 Registrar tempo de geração de relatório
    const duration = Math.round((Date.now() - exportStartTime.current) / 1000);
    await logManualProcess("manual_report", Math.max(duration, 5));
  };

  const exportWeeklyReport = async () => {
    if (!weeklyData) return;
    exportStartTime.current = Date.now();
    
    const data = [
      {
        periodo: 'Semana Atual',
        receita: weeklyData.current.revenue,
        despesas: weeklyData.current.expenses,
        lucro: weeklyData.current.profit,
        agendamentos: weeklyData.current.appointmentsCount,
        vendas: weeklyData.current.salesCount,
      },
      {
        periodo: 'Semana Anterior',
        receita: weeklyData.previous.revenue,
        despesas: weeklyData.previous.expenses,
        lucro: weeklyData.previous.profit,
        agendamentos: weeklyData.previous.appointmentsCount,
        vendas: weeklyData.previous.salesCount,
      }
    ];

    exportToCSV(data, 'relatorio_semanal');
    toast.success('Relatório semanal exportado com sucesso!');
    
    // 📊 Registrar tempo de geração de relatório
    const duration = Math.round((Date.now() - exportStartTime.current) / 1000);
    await logManualProcess("manual_report", Math.max(duration, 5));
  };

  const exportPeakHours = async () => {
    if (!peakHours) return;
    exportStartTime.current = Date.now();
    
    const data = peakHours.map((item: any) => ({
      horario: `${item.hour}:00`,
      agendamentos: item.count,
      receita: item.revenue,
    }));

    exportToCSV(data, 'horarios_pico');
    toast.success('Análise de horários exportada com sucesso!');
    
    // 📊 Registrar tempo de geração de relatório
    const duration = Math.round((Date.now() - exportStartTime.current) / 1000);
    await logManualProcess("manual_report", Math.max(duration, 5));
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={exportMonthlyReport} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Exportar Mensal
      </Button>
      <Button onClick={exportWeeklyReport} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Exportar Semanal
      </Button>
      <Button onClick={exportPeakHours} variant="outline" size="sm">
        <Download className="h-4 w-4 mr-2" />
        Exportar Horários
      </Button>
    </div>
  );
};
