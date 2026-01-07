import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToCSV } from "@/lib/exportUtils";
import { toast } from "sonner";

interface ExportButtonsProps {
  monthlyData: any;
  weeklyData: any;
  peakHours: any;
}

export const ExportButtons = ({ monthlyData, weeklyData, peakHours }: ExportButtonsProps) => {
  const exportMonthlyReport = () => {
    if (!monthlyData) return;
    
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
  };

  const exportWeeklyReport = () => {
    if (!weeklyData) return;
    
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
  };

  const exportPeakHours = () => {
    if (!peakHours) return;
    
    const data = peakHours.map((item: any) => ({
      horario: `${item.hour}:00`,
      agendamentos: item.count,
      receita: item.revenue,
    }));

    exportToCSV(data, 'horarios_pico');
    toast.success('Análise de horários exportada com sucesso!');
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
