import { auditLog } from "./audit-logger";

type ExportType = "clients" | "payments" | "appointments" | "financial" | "general";

interface ExportOptions {
  type?: ExportType;
  dateRange?: { start: string; end: string };
  filters?: Record<string, unknown>;
}

export const exportToCSV = async (
  data: any[], 
  filename: string,
  options: ExportOptions = {}
) => {
  if (!data || data.length === 0) return;

  // Log the export for audit purposes
  const { type = "general", dateRange, filters } = options;
  
  switch (type) {
    case "clients":
      await auditLog.exportClients(data.length, filters);
      break;
    case "payments":
      await auditLog.exportPayments(data.length, dateRange);
      break;
    case "appointments":
      await auditLog.exportAppointments(data.length, dateRange);
      break;
    case "financial":
      await auditLog.exportFinancialReport({ 
        recordCount: data.length, 
        dateRange, 
        filters,
        exportFormat: "csv" 
      });
      break;
  }

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value ?? '');
        return stringValue.includes(',') || stringValue.includes('"') 
          ? `"${stringValue.replace(/"/g, '""')}"` 
          : stringValue;
      }).join(',')
    )
  ].join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('pt-BR', {
    timeZone: 'America/Sao_Paulo'
  });
};

export const formatPercentage = (value: number) => {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
};
