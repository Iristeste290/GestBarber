import { AlertTriangle, ArrowRight, Calendar, Users, Ban, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionBannerProps {
  emptySlotsCount: number;
  reactivationCount: number;
  blockedCount: number;
  pendingRemindersCount: number;
  onNavigate: (tab: string) => void;
}

export const ActionBanner = ({ 
  emptySlotsCount, 
  reactivationCount, 
  blockedCount,
  pendingRemindersCount,
  onNavigate 
}: ActionBannerProps) => {
  const hasIssues = emptySlotsCount > 0 || reactivationCount > 0 || blockedCount > 0 || pendingRemindersCount > 0;

  if (!hasIssues) return null;

  const issues = [];
  
  // Reminders first - most urgent
  if (pendingRemindersCount > 0) {
    issues.push({ 
      count: pendingRemindersCount, 
      label: "lembrete(s) pendente(s)", 
      tab: "reminders", 
      icon: Bell,
      urgent: true 
    });
  }
  if (emptySlotsCount > 0) issues.push({ count: emptySlotsCount, label: "horário(s) vazio(s)", tab: "empty-slots", icon: Calendar });
  if (reactivationCount > 0) issues.push({ count: reactivationCount, label: "cliente(s) sumido(s)", tab: "reactivation", icon: Users });
  if (blockedCount > 0) issues.push({ count: blockedCount, label: "cliente(s) bloqueado(s)", tab: "problematic", icon: Ban });

  // Show different message if there are pending reminders
  const hasUrgentReminders = pendingRemindersCount > 0;
  const title = hasUrgentReminders 
    ? "⚠️ Você pode perder clientes hoje!" 
    : "🚨 Sua barbearia está perdendo dinheiro agora!";
  const subtitle = hasUrgentReminders
    ? "Envie os lembretes agora para garantir que seus clientes apareçam."
    : "Clique para agir e recuperar receita.";

  return (
    <div className={`bg-gradient-to-r ${hasUrgentReminders ? "from-yellow-500 to-orange-500" : "from-red-500 to-orange-500"} text-white rounded-xl p-4 md:p-6 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-white/20 p-2 mt-0.5">
            {hasUrgentReminders ? <Bell className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <div>
            <h3 className="font-bold text-lg">{title}</h3>
            <p className="text-white/90 text-sm mt-1">
              {subtitle}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {issues.map((issue) => (
            <Button
              key={issue.tab}
              variant="secondary"
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-0 gap-2"
              onClick={() => onNavigate(issue.tab)}
            >
              <issue.icon className="h-4 w-4" />
              {issue.count} {issue.label}
              <ArrowRight className="h-3 w-3" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};
