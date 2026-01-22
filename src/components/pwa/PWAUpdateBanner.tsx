import { useState, useEffect, useCallback } from "react";
import { X, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LatestUpdate {
  title: string;
  description: string;
  emoji: string;
  created_at: string;
}

export const PWAUpdateBanner = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [latestUpdate, setLatestUpdate] = useState<LatestUpdate | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLatestUpdate = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("app_updates")
        .select("title, description, emoji, created_at")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        setLatestUpdate(data);
      }
    } catch (error) {
      console.error("Erro ao buscar atualização:", error);
    }
  }, []);

  useEffect(() => {
    // Só ativar para PWA instalado ou desktop
    if (!("serviceWorker" in navigator)) return;

    const handleSWUpdate = () => {
      navigator.serviceWorker.ready.then((registration) => {
        // Verificar se há um SW em espera
        if (registration.waiting) {
          setWaitingWorker(registration.waiting);
          fetchLatestUpdate();
          setShowBanner(true);
        }

        // Escutar atualizações futuras
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener("statechange", () => {
              if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                setWaitingWorker(newWorker);
                fetchLatestUpdate();
                setShowBanner(true);
              }
            });
          }
        });
      });
    };

    // Verificar na montagem
    handleSWUpdate();

    // Verificar periodicamente (a cada 5 minutos)
    const interval = setInterval(() => {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchLatestUpdate]);

  const handleUpdate = useCallback(() => {
    if (!waitingWorker) return;

    setIsRefreshing(true);

    // Enviar mensagem para o SW ativar imediatamente
    waitingWorker.postMessage({ type: "SKIP_WAITING" });

    // Recarregar quando o novo SW tomar controle
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      window.location.reload();
    });

    // Fallback: recarregar após 2 segundos se o evento não disparar
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  }, [waitingWorker]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-[400px] z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-card border rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-primary/10 p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold">Nova versão disponível</span>
              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-xs">
                Nova
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {latestUpdate ? (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{latestUpdate.emoji}</span>
                <h4 className="font-medium text-sm">{latestUpdate.title}</h4>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {latestUpdate.description}
              </p>
              <span className="text-xs text-muted-foreground mt-2 block">
                {format(new Date(latestUpdate.created_at), "d 'de' MMMM", { locale: ptBR })}
              </span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">
              Uma nova versão do app está disponível com melhorias e correções.
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDismiss}
              className="flex-1"
            >
              Depois
            </Button>
            <Button
              size="sm"
              onClick={handleUpdate}
              disabled={isRefreshing}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 gap-2"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Atualizar agora
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
