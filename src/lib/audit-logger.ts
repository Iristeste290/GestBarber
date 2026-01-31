import { supabase } from "@/integrations/supabase/client";

type AuditAction = 
  | "export_clients"
  | "export_payments"
  | "export_appointments"
  | "export_financial_report"
  | "bulk_view_clients"
  | "bulk_view_payments"
  | "bulk_view_financial"
  | "access_admin_panel"
  | "view_sensitive_data";

interface AuditMetadata {
  recordCount?: number;
  filters?: Record<string, unknown>;
  exportFormat?: "csv" | "xlsx" | "pdf";
  dateRange?: { start: string; end: string };
  [key: string]: unknown;
}

export async function logAuditEvent(
  action: AuditAction,
  tableName?: string,
  recordId?: string,
  metadata?: AuditMetadata
): Promise<void> {
  try {
    const { error } = await supabase.rpc("log_audit_event", {
      p_action: action,
      p_table_name: tableName || null,
      p_record_id: recordId || null,
      p_metadata: metadata ? JSON.stringify(metadata) : null,
    });

    if (error) {
      console.error("Failed to log audit event:", error);
    }
  } catch (err) {
    // Silently fail - audit logging should never break the app
    console.error("Audit logging error:", err);
  }
}

// Convenience functions for common audit events
export const auditLog = {
  exportClients: (count: number, filters?: Record<string, unknown>) =>
    logAuditEvent("export_clients", "client_behavior", undefined, { 
      recordCount: count, 
      filters,
      exportFormat: "csv" 
    }),

  exportPayments: (count: number, dateRange?: { start: string; end: string }) =>
    logAuditEvent("export_payments", "payments", undefined, { 
      recordCount: count, 
      dateRange,
      exportFormat: "csv" 
    }),

  exportAppointments: (count: number, dateRange?: { start: string; end: string }) =>
    logAuditEvent("export_appointments", "appointments", undefined, { 
      recordCount: count, 
      dateRange,
      exportFormat: "csv" 
    }),

  exportFinancialReport: (metadata: AuditMetadata) =>
    logAuditEvent("export_financial_report", "financial", undefined, metadata),

  bulkViewClients: (count: number) =>
    logAuditEvent("bulk_view_clients", "client_behavior", undefined, { recordCount: count }),

  bulkViewPayments: (count: number) =>
    logAuditEvent("bulk_view_payments", "payments", undefined, { recordCount: count }),

  bulkViewFinancial: (metadata?: AuditMetadata) =>
    logAuditEvent("bulk_view_financial", "financial", undefined, metadata),

  accessAdminPanel: (section: string) =>
    logAuditEvent("access_admin_panel", undefined, undefined, { section }),

  viewSensitiveData: (tableName: string, recordId?: string) =>
    logAuditEvent("view_sensitive_data", tableName, recordId, undefined),
};
