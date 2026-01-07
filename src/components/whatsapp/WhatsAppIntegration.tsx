import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MessageSquare, Copy, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { UltraMsgSetupGuide } from "./UltraMsgSetupGuide";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export const WhatsAppIntegration = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [showGuide, setShowGuide] = useState(true);

  const businessPhone = phoneNumber || "5511999999999";
  const welcomeMessage = encodeURIComponent(
    "Olá! Gostaria de agendar um horário na GestBarber 💈"
  );

  const whatsappLink = `https://wa.me/${businessPhone}?text=${welcomeMessage}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(whatsappLink);
    setCopied(true);
    toast.success("Link copiado para a área de transferência!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    window.open(whatsappLink, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Guia de Configuração UltraMsg */}
      <Collapsible open={showGuide} onOpenChange={setShowGuide}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-full justify-between mb-2">
            <span className="flex items-center gap-2">
              📖 Guia de Configuração UltraMsg
            </span>
            {showGuide ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <UltraMsgSetupGuide />
        </CollapsibleContent>
      </Collapsible>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-green-600" />
            Agendamento via WhatsApp com IA
          </CardTitle>
          <CardDescription>
            Configure e compartilhe o link de agendamento automático via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="business-phone">Número do WhatsApp Business</Label>
              <Input
                id="business-phone"
                type="tel"
                placeholder="5511999999999"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="mt-2"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Formato: código do país + DDD + número (apenas números)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Link de Agendamento Direto</Label>
              <div className="flex gap-2">
                <Input
                  value={whatsappLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                  className="shrink-0"
                >
                  {copied ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleOpenWhatsApp} className="flex-1">
                <MessageSquare className="w-4 h-4 mr-2" />
                Testar Agendamento
              </Button>
            </div>
          </div>

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-3">Como funciona:</h3>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <p>Cliente acessa o link e inicia conversa no WhatsApp</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <p>IA apresenta serviços, preços e horários disponíveis</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <p>Cliente escolhe serviço, barbeiro e horário preferido</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  4
                </div>
                <p>IA confirma o agendamento automaticamente no sistema</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
