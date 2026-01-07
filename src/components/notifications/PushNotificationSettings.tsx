import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  BellRing,
  BellOff,
  Download,
  Smartphone,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Share,
  PlusSquare,
  MoreVertical,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { usePushNotifications } from "@/hooks/usePushNotifications";

interface PushNotificationSettingsProps {
  userId?: string;
}

// Inline PWA install state hook
function usePwaInstallState() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  useEffect(() => {
    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const canPromptInstall = !!deferredPrompt;

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  };

  return { isInstalled, isIOS, isAndroid, canPromptInstall, promptInstall };
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PushNotificationSettings({ userId }: PushNotificationSettingsProps) {
  const [guideOpen, setGuideOpen] = useState(true);

  const {
    isSupported: pushSupported,
    isSubscribed: pushSubscribed,
    isLoading: pushLoading,
    permission: pushPermission,
    subscribe: subscribePush,
    unsubscribe: unsubscribePush,
    testPush,
  } = usePushNotifications(userId);

  const {
    isInstalled,
    isIOS,
    isAndroid,
    canPromptInstall,
    promptInstall,
  } = usePwaInstallState();

  // If not supported at all
  if (!pushSupported) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between opacity-50">
          <div className="flex items-center gap-3">
            <BellOff className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label className="text-base font-medium">Notificações Push</Label>
              <p className="text-sm text-muted-foreground">
                Não suportado neste navegador
              </p>
            </div>
          </div>
          <Switch disabled checked={false} />
        </div>
      </div>
    );
  }

  // If PWA is installed → show the toggle
  if (isInstalled) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {pushSubscribed ? (
              <BellRing className="h-5 w-5 text-primary" />
            ) : (
              <BellOff className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <Label htmlFor="push-toggle" className="text-base font-medium">
                Notificações Push
              </Label>
              <p className="text-sm text-muted-foreground">
                Receber alertas mesmo com o app fechado
              </p>
            </div>
          </div>
          <Switch
            id="push-toggle"
            checked={pushSubscribed}
            disabled={pushLoading}
            onCheckedChange={async (checked) => {
              if (checked) {
                await subscribePush();
              } else {
                await unsubscribePush();
              }
            }}
          />
        </div>

        {pushPermission === "denied" && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Permissão bloqueada. Acesse as configurações do navegador para permitir notificações.
          </p>
        )}

        {pushSubscribed && (
          <Button
            variant="outline"
            size="sm"
            onClick={testPush}
            className="gap-2"
            disabled={pushLoading}
          >
            <BellRing className="h-4 w-4" />
            Testar Push
          </Button>
        )}

        <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
          <CheckCircle2 className="h-4 w-4" />
          App instalado na tela inicial
        </div>
      </div>
    );
  }

  // PWA NOT installed → show installation guide
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between opacity-60">
        <div className="flex items-center gap-3">
          <BellOff className="h-5 w-5 text-muted-foreground" />
          <div>
            <Label className="text-base font-medium">Notificações Push</Label>
            <p className="text-sm text-muted-foreground">
              Requer instalação do app
            </p>
          </div>
        </div>
        <Switch disabled checked={false} />
      </div>

      {/* Installation Guide */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex items-start gap-3 mb-3">
          <Smartphone className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Instale o app para receber notificações
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Push notifications só funcionam quando o app está instalado na tela inicial.
            </p>
          </div>
        </div>

        {/* Android/Desktop - can use the install prompt */}
        {canPromptInstall && (
          <Button
            onClick={promptInstall}
            className="w-full gap-2"
            size="sm"
          >
            <Download className="h-4 w-4" />
            Instalar App
          </Button>
        )}

        {/* iOS or when prompt is not available - show manual guide */}
        {(isIOS || (!canPromptInstall && !isInstalled)) && (
          <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-between text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50"
              >
                <span>Como instalar</span>
                {guideOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 pt-3">
              {isIOS ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    No iPhone/iPad (Safari):
                  </p>
                  <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      <div className="flex items-center gap-2">
                        <span>Toque no botão</span>
                        <Share className="h-4 w-4" />
                        <span>(Compartilhar)</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <div className="flex items-center gap-2">
                        <span>Selecione</span>
                        <PlusSquare className="h-4 w-4" />
                        <strong>"Adicionar à Tela de Início"</strong>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      <span>Toque em <strong>"Adicionar"</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">
                        4
                      </span>
                      <span>Abra o app pela tela inicial e ative as notificações</span>
                    </li>
                  </ol>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                    ⚠️ Requer iOS 16.4 ou superior
                  </p>
                </div>
              ) : isAndroid ? (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    No Android (Chrome):
                  </p>
                  <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      <div className="flex items-center gap-2">
                        <span>Toque no menu</span>
                        <MoreVertical className="h-4 w-4" />
                        <span>(três pontos)</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <span>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      <span>Confirme a instalação</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">
                        4
                      </span>
                      <span>Abra o app e ative as notificações</span>
                    </li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-blue-800 dark:text-blue-200">
                    No computador (Chrome/Edge):
                  </p>
                  <ol className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">
                        1
                      </span>
                      <span>Clique no ícone de instalação na barra de endereço</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">
                        2
                      </span>
                      <span>Clique em <strong>"Instalar"</strong></span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 flex items-center justify-center text-xs font-bold">
                        3
                      </span>
                      <span>Abra o app instalado e ative as notificações</span>
                    </li>
                  </ol>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </div>
  );
}
