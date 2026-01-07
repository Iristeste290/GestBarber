import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, CheckCircle2, Copy, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const UltraMsgSetupGuide = () => {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50/50 to-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <img 
                src="https://ultramsg.com/assets/img/logo.png" 
                alt="UltraMsg" 
                className="h-6 w-6"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              Guia de Configuração UltraMsg
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Recomendado
              </Badge>
            </CardTitle>
            <CardDescription>
              Siga o passo a passo para integrar seu WhatsApp em minutos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              1
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Crie sua conta no UltraMsg</h4>
            <p className="text-sm text-muted-foreground">
              Acesse o site do UltraMsg e crie uma conta gratuita. Você terá 3 dias de teste grátis.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open("https://ultramsg.com/whatsapp-api/?ref=gestbarber", "_blank")}
            >
              <ExternalLink className="h-4 w-4" />
              Acessar UltraMsg
            </Button>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              2
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Conecte seu WhatsApp</h4>
            <p className="text-sm text-muted-foreground">
              No painel do UltraMsg, você verá um QR Code. Abra o WhatsApp no seu celular:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Vá em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Clique em <strong>Conectar um aparelho</strong>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Escaneie o QR Code exibido no UltraMsg
              </li>
            </ul>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              3
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Copie suas credenciais</h4>
            <p className="text-sm text-muted-foreground">
              No painel do UltraMsg, você encontrará sua <strong>Instance ID</strong> e <strong>Token</strong>. Copie esses valores.
            </p>
            <div className="bg-muted rounded-lg p-4 space-y-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">URL da API (exemplo):</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-background px-2 py-1 rounded flex-1 overflow-x-auto">
                    https://api.ultramsg.com/instance<span className="text-primary">XXXXX</span>/messages/chat
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => copyToClipboard("https://api.ultramsg.com/instanceXXXXX/messages/chat", "URL")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Substitua <code className="text-primary">XXXXX</code> pelo seu Instance ID
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Token:</p>
                <p className="text-xs text-muted-foreground">
                  Copie o token exibido no painel do UltraMsg
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
              4
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Configure no GestBarber</h4>
            <p className="text-sm text-muted-foreground">
              Preencha os campos acima com as informações copiadas:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <strong>Número do WhatsApp:</strong> Seu número com código do país (ex: 5511999999999)
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <strong>URL da API:</strong> Cole a URL do UltraMsg
              </li>
              <li className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4 text-primary" />
                <strong>Token da API:</strong> Cole o token do UltraMsg
              </li>
            </ul>
          </div>
        </div>

        {/* Step 5 */}
        <div className="flex gap-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-sm">
              ✓
            </div>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold text-green-700">Teste a integração</h4>
            <p className="text-sm text-muted-foreground">
              Após salvar as configurações, clique em <strong>"Testar Envio"</strong> para verificar se tudo está funcionando corretamente. 
              Você receberá uma mensagem de teste no seu WhatsApp!
            </p>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
          <h4 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
            💡 Sobre o UltraMsg
          </h4>
          <ul className="text-sm text-amber-800 space-y-1">
            <li>• <strong>3 dias grátis</strong> para testar</li>
            <li>• Planos a partir de <strong>$39/mês</strong></li>
            <li>• Suporte a <strong>mensagens ilimitadas</strong></li>
            <li>• Configuração em <strong>menos de 5 minutos</strong></li>
            <li>• Sem necessidade de WhatsApp Business API oficial</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
