import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share, Plus, Monitor, Smartphone, Scissors } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { usePWAAnalytics } from "@/hooks/usePWAAnalytics";
import { toast } from "@/hooks/use-toast";
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "android" | "ios" | "desktop" | "unknown";

const STORAGE_KEYS = {
  INSTALLED: "gestbarber_pwa_installed",
  DISMISSED: "gestbarber_pwa_dismissed",
  REMIND_LATER: "gestbarber_pwa_remind_later",
};

const REMIND_DAYS = 3;

// Global variable to store the deferred prompt
declare global {
  interface Window {
    deferredPWAInstallPrompt: BeforeInstallPromptEvent | null;
  }
}

export const PWAInstallPrompt = () => {
  const [showToast, setShowToast] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [promptAvailable, setPromptAvailable] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const hasTrackedShow = useRef(false);
  const { trackEvent } = usePWAAnalytics();

  // Detect keyboard open/close for mobile
  useEffect(() => {
    const initialHeight = window.innerHeight;
    
    const handleResize = () => {
      // If viewport height decreased significantly, keyboard is likely open
      const isOpen = window.innerHeight < initialHeight * 0.75;
      setIsKeyboardOpen(isOpen);
    };

    // Also listen for focus on inputs
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      // Small delay to check if focus moved to another input
      setTimeout(() => {
        const activeElement = document.activeElement as HTMLElement;
        if (activeElement?.tagName !== 'INPUT' && activeElement?.tagName !== 'TEXTAREA') {
          setIsKeyboardOpen(false);
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const checkAndShowPrompt = useCallback(() => {
    // Check if already installed or dismissed
    const isInstalled = localStorage.getItem(STORAGE_KEYS.INSTALLED) === "true";
    const isDismissed = localStorage.getItem(STORAGE_KEYS.DISMISSED) === "true";
    const remindLaterTimestamp = localStorage.getItem(STORAGE_KEYS.REMIND_LATER);

    // Check if remind later period has passed
    if (remindLaterTimestamp) {
      const remindDate = new Date(parseInt(remindLaterTimestamp, 10));
      const now = new Date();
      const daysPassed = (now.getTime() - remindDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysPassed < REMIND_DAYS) {
        setShowToast(false);
        return;
      } else {
        // Clear remind later if time has passed
        localStorage.removeItem(STORAGE_KEYS.REMIND_LATER);
      }
    }

    if (isInstalled || isDismissed) {
      setShowToast(false);
      return;
    }

    // Check if running as standalone (already installed)
    const isStandalone = 
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
      setShowToast(false);
      return;
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    let detectedPlatform: Platform = "unknown";

    if (/iphone|ipad|ipod/.test(userAgent)) {
      detectedPlatform = "ios";
    } else if (/android/.test(userAgent)) {
      detectedPlatform = "android";
    } else if (/windows|macintosh|linux/.test(userAgent)) {
      detectedPlatform = "desktop";
    }

    setPlatform(detectedPlatform);

    // For iOS, always show the toast with instructions
    if (detectedPlatform === "ios") {
      const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
      if (isSafari) {
        setShowToast(true);
        setTimeout(() => setIsVisible(true), 50);
        if (!hasTrackedShow.current) {
          hasTrackedShow.current = true;
          trackEvent('prompt_shown');
        }
      }
      return;
    }

    // For Android/Desktop, check if prompt is available
    if (window.deferredPWAInstallPrompt) {
      setPromptAvailable(true);
      setShowToast(true);
      setTimeout(() => setIsVisible(true), 50);
      if (!hasTrackedShow.current) {
        hasTrackedShow.current = true;
        trackEvent('prompt_shown');
      }
    } else {
      // Show toast anyway for supported browsers (will show instructions)
      const isChrome = /chrome/.test(userAgent) && !/edge|edg/.test(userAgent);
      const isEdge = /edge|edg/.test(userAgent);
      if (isChrome || isEdge || detectedPlatform === "android") {
        setShowToast(true);
        setTimeout(() => setIsVisible(true), 50);
        if (!hasTrackedShow.current) {
          hasTrackedShow.current = true;
          trackEvent('prompt_shown');
        }
      }
    }
  }, [trackEvent]);

  useEffect(() => {
    // Initialize global prompt variable
    if (typeof window.deferredPWAInstallPrompt === "undefined") {
      window.deferredPWAInstallPrompt = null;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.deferredPWAInstallPrompt = e as BeforeInstallPromptEvent;
      setPromptAvailable(true);
      checkAndShowPrompt();
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
      setShowToast(false);
      setIsVisible(false);
      window.deferredPWAInstallPrompt = null;
      setPromptAvailable(false);
      
      // Show toast about update instructions
      toast({
        title: "🎉 App instalado com sucesso!",
        description: "Para receber atualizações, desinstale e reinstale o app. Ou acesse pelo navegador para ter as novidades imediatamente.",
        duration: 12000,
      });
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check on mount
    checkAndShowPrompt();

    // Also check after a small delay (in case event was already captured)
    const timer = setTimeout(checkAndShowPrompt, 500);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      clearTimeout(timer);
    };
  }, [checkAndShowPrompt]);

  const handleInstallClick = async () => {
    trackEvent('install_clicked');
    
    if (platform === "ios") {
      setShowIOSModal(true);
      return;
    }

    const deferredPrompt = window.deferredPWAInstallPrompt;

    if (!deferredPrompt) {
      // Show instructions if prompt is not available
      setShowIOSModal(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        localStorage.setItem(STORAGE_KEYS.INSTALLED, "true");
        trackEvent('install_success');
      } else {
        trackEvent('dismissed');
      }

      window.deferredPWAInstallPrompt = null;
      setPromptAvailable(false);
      setShowToast(false);
      setIsVisible(false);
    } catch (error) {
      console.error("Error showing install prompt:", error);
    }
  };

  const handleDismiss = () => {
    trackEvent('dismissed');
    setIsVisible(false);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.DISMISSED, "true");
      setShowToast(false);
    }, 300);
  };

  const handleRemindLater = () => {
    trackEvent('remind_later');
    setIsVisible(false);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEYS.REMIND_LATER, Date.now().toString());
      setShowToast(false);
    }, 300);
  };

  // Hide toast when keyboard is open
  if (!showToast || isKeyboardOpen) {
    return null;
  }

  const isMobile = platform === "ios" || platform === "android";

  return (
    <>
      {/* Fixed Toast - Fully Responsive */}
      <div 
        className={`
          fixed z-50 transition-all duration-300 ease-out
          ${isVisible 
            ? "opacity-100 translate-y-0" 
            : "opacity-0 translate-y-4"
          }
          ${isMobile 
            ? "left-4 right-4 max-w-[calc(100%-2rem)]" 
            : "right-6 w-[380px] max-w-[calc(100vw-3rem)]"
          }
        `}
        style={{
          bottom: isMobile 
            ? 'max(16px, env(safe-area-inset-bottom, 16px))' 
            : '24px',
        }}
      >
        <div 
          className="relative bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
          style={{
            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.3), 0 4px 20px -5px rgba(0, 0, 0, 0.2)',
          }}
        >
          {/* Gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-accent" />
          
          <div className="p-4">
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
              style={{ minWidth: '44px', minHeight: '44px' }}
              aria-label="Fechar"
            >
              <X className="w-4 h-4 m-auto" />
            </button>

            {/* Mobile Layout - Optimized */}
            {isMobile ? (
              <div className="flex items-start gap-3 pr-10">
                {/* App Icon */}
                <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-primary to-accent rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md">
                  <Scissors className="w-6 h-6 sm:w-7 sm:h-7 text-primary-foreground" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h3 className="font-bold text-foreground text-sm sm:text-base leading-tight">
                      GestBarber
                    </h3>
                    <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] sm:text-xs font-medium rounded-full whitespace-nowrap">
                      APP
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-snug">
                    Adicione à tela inicial para acesso rápido
                  </p>
                  
                  <div className="flex gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRemindLater}
                      className="flex-1 h-11 sm:h-10 px-3 text-xs sm:text-sm touch-manipulation"
                      style={{ minHeight: '44px' }}
                    >
                      Depois
                    </Button>
                    <Button
                      onClick={handleInstallClick}
                      size="sm"
                      className="flex-1 h-11 sm:h-10 px-3 text-xs sm:text-sm gap-2 touch-manipulation font-medium"
                      style={{ minHeight: '44px' }}
                    >
                      {platform === "ios" ? (
                        <>
                          <Share className="w-4 h-4" />
                          Instruções
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          Instalar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Desktop Layout */
              <div className="pr-8">
                <div className="flex items-start gap-4">
                  {/* App Icon */}
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center shadow-md">
                    <Scissors className="w-7 h-7 text-primary-foreground" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-foreground text-base">
                        GestBarber
                      </h3>
                      <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                        APP
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Instale para acesso rápido
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-0.5 flex items-center gap-1">
                      <Monitor className="w-3 h-3" />
                      Funciona como app nativo
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRemindLater}
                    className="flex-1 h-10 text-sm"
                  >
                    Lembrar depois
                  </Button>
                  <Button
                    onClick={handleInstallClick}
                    size="sm"
                    className="flex-1 h-10 text-sm gap-1.5"
                  >
                    <Download className="w-4 h-4" />
                    Instalar
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions Modal - Mobile Optimized */}
      <Dialog open={showIOSModal} onOpenChange={setShowIOSModal}>
        <DialogContent 
          className="max-w-sm w-[calc(100%-2rem)] mx-auto rounded-2xl"
          style={{
            maxHeight: 'calc(100vh - 2rem)',
            marginTop: 'env(safe-area-inset-top, 0px)',
            marginBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
        >
          <DialogHeader className="text-left">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-accent rounded-xl sm:rounded-2xl flex items-center justify-center shadow-md flex-shrink-0">
                <Scissors className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <span className="block text-base sm:text-lg">Instalar GestBarber</span>
                <span className="text-xs font-normal text-muted-foreground">
                  {platform === "ios" ? "iPhone / iPad" : platform === "android" ? "Android" : "Desktop"}
                </span>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">
              Instruções para instalar o aplicativo
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-2 overflow-y-auto">
            {platform === "ios" ? (
              <>
                <StepItem 
                  number={1} 
                  title="Toque em Compartilhar" 
                  description={
                    <span className="flex items-center gap-1 flex-wrap">
                      Procure o ícone <Share className="w-4 h-4 inline text-primary flex-shrink-0" /> na barra do Safari
                    </span>
                  } 
                />
                <StepItem 
                  number={2} 
                  title="Adicionar à Tela de Início" 
                  description={
                    <span className="flex items-center gap-1 flex-wrap">
                      Role e toque em <Plus className="w-4 h-4 inline text-primary flex-shrink-0" /> "Adicionar à Tela de Início"
                    </span>
                  } 
                />
                <StepItem 
                  number={3} 
                  title="Confirmar instalação" 
                  description="Toque em 'Adicionar' no canto superior direito" 
                />
              </>
            ) : platform === "android" ? (
              <>
                <StepItem 
                  number={1} 
                  title="Menu do Chrome" 
                  description="Toque nos três pontos (⋮) no canto superior direito" 
                />
                <StepItem 
                  number={2} 
                  title="Adicionar à tela inicial" 
                  description="Selecione 'Adicionar à tela inicial' ou 'Instalar aplicativo'" 
                />
                <StepItem 
                  number={3} 
                  title="Confirmar" 
                  description="Toque em 'Adicionar' para confirmar" 
                />
              </>
            ) : (
              <>
                <StepItem 
                  number={1} 
                  title="Menu do navegador" 
                  description="Clique no ícone (⊕) na barra de endereços ou no menu (⋮)" 
                />
                <StepItem 
                  number={2} 
                  title="Instalar aplicativo" 
                  description="Selecione 'Instalar GestBarber'" 
                />
                <StepItem 
                  number={3} 
                  title="Confirmar" 
                  description="Clique em 'Instalar' para adicionar" 
                />
              </>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => setShowIOSModal(false)} 
              className="flex-1 h-11 touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              Fechar
            </Button>
            <Button 
              onClick={() => setShowIOSModal(false)} 
              className="flex-1 h-11 touch-manipulation"
              style={{ minHeight: '44px' }}
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

// Step item component for instructions
const StepItem = ({ 
  number, 
  title, 
  description 
}: { 
  number: number; 
  title: string; 
  description: React.ReactNode;
}) => (
  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-xl">
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
      {number}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-medium text-sm text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{description}</p>
    </div>
  </div>
);