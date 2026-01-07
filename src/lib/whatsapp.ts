// Utilitário para abrir conversa no WhatsApp do próprio usuário (app instalado),
// com fallback para WhatsApp Web.

export const DEFAULT_REMINDER_TEMPLATE = `Olá {nome}! 👋

Lembrete do seu agendamento:

📅 *{data}*
🕐 *{horario}*
✂️ *{servico}*
💈 com *{barbeiro}*

Te esperamos! 😊`;

export interface ReminderMessageParams {
  customerName: string;
  formattedDate: string;
  time: string;
  serviceName: string;
  barberName: string;
}

export function formatReminderMessage(template: string | null, params: ReminderMessageParams): string {
  const t = template || DEFAULT_REMINDER_TEMPLATE;
  return t
    .replace(/{nome}/g, params.customerName)
    .replace(/{data}/g, params.formattedDate)
    .replace(/{horario}/g, params.time)
    .replace(/{servico}/g, params.serviceName)
    .replace(/{barbeiro}/g, params.barberName);
}

export function openWhatsAppChat(params: {
  /** Telefone em formato numérico com DDI (ex: 5511999999999) */
  phoneE164Digits: string;
  message: string;
  /** Por padrão abre em nova aba (evita sair do app). */
  newTab?: boolean;
}) {
  const phone = params.phoneE164Digits.replace(/\D/g, "");
  const encoded = encodeURIComponent(params.message);
  const newTab = params.newTab ?? true;

  // Deep link (tenta abrir o WhatsApp "normal" do usuário)
  const appLink = `whatsapp://send?phone=${phone}&text=${encoded}`;
  // Fallback (WhatsApp Web / página de abertura)
  const webLink = `https://wa.me/${phone}?text=${encoded}`;

  const open = (url: string) => {
    if (newTab) {
      window.open(url, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = url;
  };

  // 1) Tenta abrir o app instalado
  open(appLink);

  // 2) Se não houver app/protocolo, cai no web
  setTimeout(() => {
    try {
      open(webLink);
    } catch {
      // ignore
    }
  }, 900);
}

