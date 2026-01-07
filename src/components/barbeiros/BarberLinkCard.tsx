import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, Check, Edit2, QrCode, Download } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface BarberLinkCardProps {
  barberId: string;
  barberName: string;
  barberSlug?: string;
}

const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 30);
};

export const BarberLinkCard = ({ barberId, barberName, barberSlug }: BarberLinkCardProps) => {
  const [slug, setSlug] = useState(barberSlug || generateSlug(barberName));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!barberSlug) {
      saveSlug(generateSlug(barberName));
    }
  }, [barberSlug, barberName, barberId]);

  const agendaUrl = `${window.location.origin}/b/${slug}`;

  const saveSlug = async (newSlug: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('barbers')
        .update({ slug: newSlug })
        .eq('id', barberId);

      if (error) {
        if (error.code === '23505') {
          toast.error("Este link já está em uso. Escolha outro nome.");
          return false;
        }
        throw error;
      }
      
      setSlug(newSlug);
      return true;
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveSlug = async () => {
    if (!slug.trim()) {
      toast.error("O link não pode estar vazio");
      return;
    }
    
    const success = await saveSlug(slug);
    if (success) {
      setIsEditing(false);
      toast.success("Link atualizado!");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(agendaUrl);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const generateQRCode = (size: number = 200) => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(agendaUrl)}&bgcolor=ffffff&color=000000&margin=10`;
  };

  const downloadQRCode = async () => {
    try {
      const response = await fetch(generateQRCode(400));
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qrcode-${slug}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("QR Code baixado!");
    } catch {
      toast.error("Erro ao baixar QR Code");
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-lg">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-primary-foreground">
        <p className="text-sm opacity-90 mb-1">Link de Agendamento</p>
        <h3 className="text-2xl font-bold">{barberName}</h3>
      </div>

      <CardContent className="p-5 space-y-4">
        {/* Slug editável */}
        <div className="bg-muted/50 rounded-xl p-4">
          {isEditing ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-background rounded-lg border px-3">
                <span className="text-muted-foreground text-sm">/b/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="border-0 bg-transparent focus-visible:ring-0 px-1 font-medium"
                  placeholder="nome"
                  autoFocus
                />
              </div>
              <Button size="sm" onClick={handleSaveSlug} disabled={isSaving}>
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Seu link personalizado</p>
                <p className="font-semibold text-lg">{slug}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Botões de ação */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={copyToClipboard}
            variant={copied ? "default" : "outline"}
            className="h-12"
          >
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copiado!" : "Copiar Link"}
          </Button>
          <Button
            onClick={() => setShowQR(!showQR)}
            variant={showQR ? "secondary" : "outline"}
            className="h-12"
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
        </div>

        {/* QR Code */}
        {showQR && (
          <div className="flex flex-col items-center p-6 bg-white rounded-xl border">
            <img
              src={generateQRCode()}
              alt="QR Code"
              className="w-40 h-40 mb-4"
            />
            <Button variant="outline" size="sm" onClick={downloadQRCode}>
              <Download className="h-4 w-4 mr-2" />
              Baixar QR Code
            </Button>
          </div>
        )}

        {/* Link completo */}
        <p className="text-xs text-center text-muted-foreground truncate px-2">
          {agendaUrl}
        </p>
      </CardContent>
    </Card>
  );
};
