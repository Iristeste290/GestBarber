import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { TypingIndicator } from "./TypingIndicator";
import { ChatSuggestions } from "./ChatSuggestions";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/hooks/useUserProfile";
import { MessageCircle, X, Minimize2, Maximize2, History, Plus, ArrowLeft, Headphones } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ConversationGroup {
  date: string;
  messages: Message[];
  firstMessage: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-assistant`;

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "Olá! 👋 Sou o assistente virtual do GestBarber. Como posso te ajudar hoje?"
};

export function ChatBot() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showTooltip, setShowTooltip] = useState(true);
  const [showSupportButton, setShowSupportButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { profile } = useUserProfile(user);
  const queryClient = useQueryClient();

  // Get subscription info for context
  const { data: subscription } = useQuery({
    queryKey: ["subscription", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch conversation history
  const { data: conversationHistory } = useQuery({
    queryKey: ["chat-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && showHistory
  });

  // Group conversations by date
  const groupedConversations = useCallback((): ConversationGroup[] => {
    if (!conversationHistory?.length) return [];
    
    const groups: { [key: string]: ConversationGroup } = {};
    
    conversationHistory.forEach((msg) => {
      const date = format(new Date(msg.created_at), "yyyy-MM-dd");
      const displayDate = format(new Date(msg.created_at), "dd 'de' MMMM", { locale: ptBR });
      
      if (!groups[date]) {
        groups[date] = {
          date: displayDate,
          messages: [],
          firstMessage: ""
        };
      }
      
      groups[date].messages.push({
        id: msg.id,
        role: msg.role as "user" | "assistant",
        content: msg.content
      });
      
      // Set first user message as preview
      if (msg.role === "user" && !groups[date].firstMessage) {
        groups[date].firstMessage = msg.content.slice(0, 50) + (msg.content.length > 50 ? "..." : "");
      }
    });
    
    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([_, group]) => group);
  }, [conversationHistory]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => authSub.unsubscribe();
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current && !showHistory) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, showHistory]);

  // Hide tooltip after 5 seconds
  useEffect(() => {
    if (!isOpen && showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, showTooltip]);

  // Calculate days remaining for free plan
  const getDaysRemaining = useCallback(() => {
    if (!subscription) return undefined;
    if (subscription.plan_type !== "freemium") return undefined;
    const endDate = new Date(subscription.end_date);
    const now = new Date();
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [subscription]);

  const loadConversation = (group: ConversationGroup) => {
    setMessages([WELCOME_MESSAGE, ...group.messages]);
    setShowHistory(false);
  };

  const startNewConversation = () => {
    setMessages([WELCOME_MESSAGE]);
    setShowHistory(false);
    queryClient.invalidateQueries({ queryKey: ["chat-history", user?.id] });
  };

  const sendMessage = async (content: string) => {
    if (!user) {
      toast.error("Você precisa estar logado para usar o chat");
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Save user message to database
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "user",
      content
    });

    try {
      // Prepare conversation history (last 10 messages for context)
      const conversationHistory = messages
        .filter(m => m.id !== "welcome")
        .slice(-10)
        .map(m => ({ role: m.role, content: m.content }));
      
      conversationHistory.push({ role: "user", content });

      // Prepare user context
      const userContext = {
        activationCompleted: profile?.activation_completed,
        barbershopName: profile?.barbershop_name,
        daysRemaining: getDaysRemaining()
      };

      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          messages: conversationHistory,
          userContext 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao enviar mensagem");
      }

      // Stream the response
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let assistantContent = "";
      const assistantMessageId = crypto.randomUUID();

      // Add empty assistant message
      setMessages(prev => [...prev, { id: assistantMessageId, role: "assistant", content: "" }]);
      setIsLoading(false);

      let buffer = "";
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process line by line
        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const deltaContent = parsed.choices?.[0]?.delta?.content;
            if (deltaContent) {
              assistantContent += deltaContent;
              setMessages(prev => 
                prev.map(m => 
                  m.id === assistantMessageId 
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            // Incomplete JSON, put back in buffer
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Save assistant message to database
      if (assistantContent) {
        await supabase.from("chat_messages").insert({
          user_id: user.id,
          role: "assistant",
          content: assistantContent
        });
      }

    } catch (error) {
      console.error("Chat error:", error);
      setIsLoading(false);
      setShowSupportButton(true);
      
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Desculpe, tive um problema ao processar sua mensagem. Se precisar de ajuda urgente, entre em contato com nosso suporte. 🙏"
      };
      setMessages(prev => [...prev, errorMessage]);
      
      toast.error(error instanceof Error ? error.message : "Erro ao enviar mensagem");
    }
  };

  if (!user) return null;

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 animate-fade-in">
          {/* Tooltip hint - auto-hides after 5 seconds */}
          {showTooltip && (
            <div className="bg-card border shadow-lg rounded-full px-4 py-2 text-sm font-medium animate-bounce flex items-center gap-2">
              <span>Precisa de ajuda?</span>
              <span className="text-lg">👋</span>
            </div>
          )}
          
          <Button
            onClick={() => setIsOpen(true)}
            className="h-16 w-16 rounded-full shadow-xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-110 active:scale-95 relative group"
          >
            {/* Pulse ring animation */}
            <span className="absolute inset-0 rounded-full bg-primary/40 animate-ping opacity-75" />
            <span className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
            
            <MessageCircle className="h-7 w-7 relative z-10" />
            
            {/* Online indicator */}
            <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full bg-green-400 border-2 border-white z-10" />
          </Button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={`fixed z-50 shadow-2xl transition-all duration-200 ${
          isMinimized 
            ? "bottom-6 right-6 w-72 h-14" 
            : "bottom-6 right-6 w-[360px] sm:w-[400px] h-[500px] sm:h-[550px]"
        }`}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              {showHistory ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowHistory(false)}
                  className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              ) : (
                <div className="relative">
                  <MessageCircle className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-primary" />
                </div>
              )}
              <div>
                <p className="font-medium text-sm">
                  {showHistory ? "Histórico" : "Assistente Virtual"}
                </p>
                {!isMinimized && !showHistory && (
                  <p className="text-xs opacity-80">Online</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!showHistory && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHistory(true)}
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    title="Histórico de conversas"
                  >
                    <History className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={startNewConversation}
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    title="Nova conversa"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMinimized(!isMinimized)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              >
                {isMinimized ? (
                  <Maximize2 className="h-4 w-4" />
                ) : (
                  <Minimize2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Chat Content */}
          {!isMinimized && (
            <>
              {showHistory ? (
                <ScrollArea className="flex-1 h-[calc(100%-60px)] p-4">
                  <div className="space-y-3">
                    {groupedConversations().length === 0 ? (
                      <p className="text-center text-muted-foreground text-sm py-8">
                        Nenhuma conversa anterior
                      </p>
                    ) : (
                      groupedConversations().map((group, index) => (
                        <button
                          key={index}
                          onClick={() => loadConversation(group)}
                          className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                        >
                          <p className="text-xs text-muted-foreground mb-1">
                            {group.date}
                          </p>
                          <p className="text-sm font-medium truncate">
                            {group.firstMessage || "Conversa"}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {group.messages.length} mensagens
                          </p>
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              ) : (
                <>
                  <ScrollArea 
                    className="flex-1 h-[calc(100%-120px)] p-4"
                    ref={scrollRef}
                  >
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <ChatMessage
                          key={message.id}
                          role={message.role}
                          content={message.content}
                        />
                      ))}
                      {isLoading && <TypingIndicator />}
                      
                      {/* Quick suggestions - show only when just welcome message */}
                      {messages.length === 1 && messages[0].id === "welcome" && !isLoading && (
                        <ChatSuggestions
                          isActivated={!!profile?.activation_completed}
                          daysRemaining={getDaysRemaining()}
                          onSuggestionClick={sendMessage}
                        />
                      )}
                      
                      {/* Support button - show after errors or when AI can't help */}
                      {showSupportButton && messages.length > 1 && (
                        <div className="pt-2 animate-fade-in">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2"
                            onClick={() => {
                              setIsOpen(false);
                              navigate("/suporte");
                            }}
                          >
                            <Headphones className="h-4 w-4" />
                            Falar com o Suporte
                          </Button>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  <ChatInput 
                    onSend={sendMessage}
                    isLoading={isLoading}
                  />
                </>
              )}
            </>
          )}
        </Card>
      )}
    </>
  );
}
