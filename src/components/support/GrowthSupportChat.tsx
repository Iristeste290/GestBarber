import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Sparkles, 
  Send, 
  Trash2, 
  TrendingUp, 
  Calendar,
  DollarSign,
  Users,
  AlertTriangle,
  ArrowLeft,
  Loader2
} from "lucide-react";
import { useGrowthSupport, SupportMessage } from "@/hooks/useGrowthSupport";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import assistantAvatar from "@/assets/assistant-avatar.png";

// Quick action suggestions
const QUICK_SUGGESTIONS = [
  { icon: Calendar, text: "Como preencher horários vazios?", category: "growth" },
  { icon: DollarSign, text: "Como aumentar meu faturamento?", category: "growth" },
  { icon: Users, text: "Como reativar clientes inativos?", category: "growth" },
  { icon: AlertTriangle, text: "Tenho muitos cancelamentos", category: "growth" },
];

interface ChatMessageProps {
  message: SupportMessage;
  isLast: boolean;
}

const ChatMessageItem = ({ message, isLast }: ChatMessageProps) => {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""} ${isLast ? "animate-fade-in" : ""}`}>
      {/* Avatar */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser 
          ? "bg-[#C9B27C] text-black" 
          : "bg-gradient-to-br from-[#C9B27C]/20 to-amber-500/20 border border-[#C9B27C]/30"
      }`}>
        {isUser ? (
          <span className="text-xs font-bold">EU</span>
        ) : (
          <img 
            src={assistantAvatar} 
            alt="Assistente" 
            className="w-6 h-6 rounded-full"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = '<span class="text-xs">🤖</span>';
            }}
          />
        )}
      </div>

      {/* Message content */}
      <div className={`max-w-[80%] ${isUser ? "text-right" : ""}`}>
        <div className={`p-3 rounded-2xl ${
          isUser 
            ? "bg-[#C9B27C] text-black rounded-tr-sm" 
            : "bg-[#1A1A1A] text-[#EDEDED] rounded-tl-sm border border-[#333]"
        }`}>
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-[10px] text-[#EDEDED]/40 mt-1 block">
          {format(new Date(message.created_at), "HH:mm", { locale: ptBR })}
        </span>
      </div>
    </div>
  );
};

interface ContextCardProps {
  barberContext: ReturnType<typeof useGrowthSupport>["barberContext"];
}

const ContextCard = ({ barberContext }: ContextCardProps) => {
  if (!barberContext) return null;

  const hasWarnings = 
    barberContext.horarios_vazios_proximos_7_dias > 10 ||
    barberContext.clientes_risco > 5 ||
    barberContext.dias_desde_ultimo_agendamento > 3;

  return (
    <div className="p-3 bg-[#1A1A1A] rounded-lg border border-[#333] mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[#C9B27C]">
          {barberContext.barbershop_name}
        </span>
        {hasWarnings && (
          <Badge variant="destructive" className="text-[10px] h-5">
            Atenção
          </Badge>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-[#EDEDED]">
            R$ {barberContext.faturamento_30d.toLocaleString("pt-BR")}
          </p>
          <p className="text-[10px] text-[#EDEDED]/50">30 dias</p>
        </div>
        <div>
          <p className="text-lg font-bold text-[#EDEDED]">
            {barberContext.agendamentos_30d}
          </p>
          <p className="text-[10px] text-[#EDEDED]/50">agendamentos</p>
        </div>
        <div>
          <p className={`text-lg font-bold ${
            barberContext.horarios_vazios_proximos_7_dias > 10 
              ? "text-red-400" 
              : "text-[#EDEDED]"
          }`}>
            {barberContext.horarios_vazios_proximos_7_dias}
          </p>
          <p className="text-[10px] text-[#EDEDED]/50">vazios (7d)</p>
        </div>
      </div>
    </div>
  );
};

export const GrowthSupportChat = () => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { 
    barberContext, 
    chatHistory, 
    isLoading, 
    sendMessage, 
    clearHistory 
  } = useGrowthSupport();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, sendMessage.isPending]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sendMessage.isPending) return;

    const message = input.trim();
    setInput("");

    try {
      await sendMessage.mutateAsync(message);
    } catch (error) {
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    }
  }, [input, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickSuggestion = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };

  const handleClearHistory = async () => {
    if (window.confirm("Limpar todo o histórico de conversas?")) {
      await clearHistory.mutateAsync();
      toast.success("Histórico limpo");
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-4 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full flex-1" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const welcomeMessage: SupportMessage = {
    id: "welcome",
    role: "assistant",
    content: barberContext 
      ? `Olá! 👋 Sou seu Assistente de Crescimento. Analisei sua barbearia "${barberContext.barbershop_name}" e estou pronto para ajudar você a faturar mais.\n\n${
        barberContext.horarios_vazios_proximos_7_dias > 10 
          ? `📊 Notei que você tem ${barberContext.horarios_vazios_proximos_7_dias} horários vazios nos próximos 7 dias. Posso sugerir estratégias para preencher sua agenda!` 
          : "Sua agenda está com boa ocupação. Como posso ajudar você hoje?"
      }`
      : "Olá! 👋 Sou seu Assistente de Crescimento. Como posso ajudar você a crescer sua barbearia hoje?",
    created_at: new Date().toISOString(),
  };

  const allMessages = chatHistory.length === 0 
    ? [welcomeMessage] 
    : chatHistory;

  return (
    <div className="flex flex-col h-full bg-[#0A0A0A]">
      {/* Header */}
      <CardHeader className="flex-shrink-0 p-4 border-b border-[#333] bg-gradient-to-r from-[#111] to-[#0A0A0A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => navigate(-1)}
              className="h-8 w-8 text-[#EDEDED]/70 hover:text-[#EDEDED]"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C9B27C] to-amber-600 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-black" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0A0A0A] rounded-full" />
              </div>
              <div>
                <h2 className="font-semibold text-[#EDEDED]">Assistente GestBarber</h2>
                <p className="text-xs text-[#C9B27C]">Especialista em crescimento</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {chatHistory.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClearHistory}
                className="h-8 w-8 text-[#EDEDED]/50 hover:text-red-400"
                title="Limpar histórico"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Context Card */}
      <div className="px-4 pt-4">
        <ContextCard barberContext={barberContext} />
      </div>

      {/* Messages */}
      <ScrollArea 
        className="flex-1 px-4" 
        ref={scrollRef}
      >
        <div className="space-y-4 py-4">
          {allMessages.map((msg, idx) => (
            <ChatMessageItem 
              key={msg.id} 
              message={msg} 
              isLast={idx === allMessages.length - 1}
            />
          ))}
          
          {/* Typing indicator */}
          {sendMessage.isPending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C9B27C]/20 to-amber-500/20 border border-[#C9B27C]/30 flex items-center justify-center">
                <Loader2 className="h-4 w-4 text-[#C9B27C] animate-spin" />
              </div>
              <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl rounded-tl-sm p-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-[#C9B27C] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-[#C9B27C] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-[#C9B27C] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick Suggestions - Only show when no messages */}
      {chatHistory.length === 0 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-[#EDEDED]/50 mb-2">Sugestões rápidas:</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_SUGGESTIONS.map((suggestion, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => handleQuickSuggestion(suggestion.text)}
                className="h-8 text-xs bg-[#1A1A1A] border-[#333] text-[#EDEDED]/80 hover:bg-[#C9B27C]/10 hover:border-[#C9B27C]/50"
              >
                <suggestion.icon className="h-3 w-3 mr-1.5 text-[#C9B27C]" />
                {suggestion.text}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 p-4 border-t border-[#333] bg-[#111]">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua dúvida ou peça ajuda..."
            className="flex-1 bg-[#1A1A1A] border-[#333] text-[#EDEDED] placeholder:text-[#EDEDED]/40 focus-visible:ring-[#C9B27C]"
            disabled={sendMessage.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            className="bg-[#C9B27C] hover:bg-[#D4BD87] text-black"
          >
            {sendMessage.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-[#EDEDED]/30 text-center mt-2">
          Respostas baseadas nos dados da sua barbearia
        </p>
      </div>
    </div>
  );
};
