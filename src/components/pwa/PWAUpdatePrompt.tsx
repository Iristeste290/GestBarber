import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Sparkles, 
  CheckCircle2,
  Smartphone,
  ArrowDown,
  RotateCcw
} from "lucide-react";

interface UpdateStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export const PWAUpdatePrompt = () => {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATED") {
        console.log("[PWA] Nova versão disponível:", event.data.version);
        setShowUpdateModal(true);
      }
    };

    // Escuta mensagens do service worker
    navigator.serviceWorker.addEventListener("message", handleMessage);

    // Verifica se há um service worker esperando
    navigator.serviceWorker.ready.then((registration) => {
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setShowUpdateModal(true);
      }

      // Detecta quando um novo SW está instalado e esperando
      registration.addEventListener("updatefound", () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setWaitingWorker(newWorker);
              setShowUpdateModal(true);
            }
          });
        }
      });
    });

    // Verifica atualizações periodicamente (a cada 30 minutos)
    const checkInterval = setInterval(() => {
      navigator.serviceWorker.ready.then((registration) => {
        registration.update();
      });
    }, 30 * 60 * 1000);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
      clearInterval(checkInterval);
    };
  }, []);

  const handleUpdate = async () => {
    setIsUpdating(true);
    
    // Escuta a mudança de controller para garantir que o novo SW está ativo
    const controllerChanged = new Promise<void>((resolve) => {
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        resolve();
      }, { once: true });
    });
    
    if (waitingWorker) {
      waitingWorker.postMessage({ type: "SKIP_WAITING" });
    }
    
    // Aguarda a mudança de controller (com timeout de segurança de 3s)
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 3000));
    
    await Promise.race([controllerChanged, timeout]);
    
    // Recarrega com a nova versão
    window.location.reload();
  };

  const handleLater = () => {
    setShowUpdateModal(false);
    // Salva que o usuário adiou para não mostrar novamente na mesma sessão
    sessionStorage.setItem("pwa-update-dismissed", "true");
  };

  const steps: UpdateStep[] = [
    {
      icon: <ArrowDown className="w-5 h-5 text-primary" />,
      title: "Baixando atualização",
      description: "A nova versão já foi baixada automaticamente"
    },
    {
      icon: <RotateCcw className="w-5 h-5 text-primary" />,
      title: "Aplicar atualização",
      description: "Clique no botão abaixo para aplicar as mudanças"
    },
    {
      icon: <CheckCircle2 className="w-5 h-5 text-primary" />,
      title: "Pronto!",
      description: "O app será recarregado com as novidades"
    }
  ];

  // Não mostra se o usuário já adiou nesta sessão
  if (sessionStorage.getItem("pwa-update-dismissed") === "true") {
    return null;
  }

  return (
    <Dialog open={showUpdateModal} onOpenChange={setShowUpdateModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-3">
            <Badge className="bg-gradient-to-r from-primary to-primary/80">
              <Sparkles className="w-3 h-3 mr-1" />
              Nova Versão
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Atualização Disponível!
              </DialogTitle>
              <DialogDescription className="text-sm mt-0.5">
                Há melhorias e correções esperando por você
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Steps */}
        <div className="mt-4 space-y-3">
          {steps.map((step, index) => (
            <div 
              key={index}
              className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
            >
              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center shrink-0 border">
                {step.icon}
              </div>
              <div>
                <p className="font-medium text-sm">{step.title}</p>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleLater}
            disabled={isUpdating}
          >
            Depois
          </Button>
          <Button 
            className="flex-1 gap-2"
            onClick={handleUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Atualizando...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Atualizar Agora
              </>
            )}
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-2">
          O app será recarregado rapidamente
        </p>
      </DialogContent>
    </Dialog>
  );
};
