import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Globe, Sparkles, ExternalLink, Copy, Check, Loader2 } from "lucide-react";
import { useBarbershopWebsite, useGenerateWebsite } from "@/hooks/useBarbershopWebsite";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

export const WebsiteGenerator = () => {
  const { user } = useRequireAuth();
  const { profile } = useUserProfile(user);
  const { data: website, isLoading } = useBarbershopWebsite();
  const { mutate: generateWebsite, isPending } = useGenerateWebsite();
  
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    site_name: profile?.barbershop_name || '',
    site_style: 'moderna' as 'classica' | 'moderna' | 'premium',
    whatsapp: profile?.phone || '',
    address: '',
    services_highlight: [] as string[],
  });

  const handleGenerate = () => {
    if (!formData.site_name || !formData.whatsapp) {
      toast.error('Preencha o nome e WhatsApp');
      return;
    }
    
    generateWebsite(formData, {
      onSuccess: () => {
        setShowForm(false);
      },
    });
  };

  const copyUrl = () => {
    if (website?.site_url) {
      navigator.clipboard.writeText(website.site_url);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  // If website exists and is published
  if (website?.is_published && !showForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Seu Site
          </CardTitle>
          <CardDescription>
            Seu site está ativo e recebendo visitantes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">URL do seu site:</p>
                <p className="font-medium truncate">{website.site_url}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={copyUrl}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => window.open(website.site_url!, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Abrir
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Estilo</p>
              <p className="font-medium capitalize">{website.site_style}</p>
            </div>
            <div>
              <p className="text-muted-foreground">WhatsApp</p>
              <p className="font-medium">{website.whatsapp || '-'}</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => setShowForm(true)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Regenerar Site
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Form to create/update website
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Criar Meu Site
        </CardTitle>
        <CardDescription>
          Gere um site profissional para sua barbearia em segundos com IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Nome da Barbearia</Label>
          <Input
            placeholder="Nome que aparecerá no site"
            value={formData.site_name}
            onChange={(e) => setFormData({ ...formData, site_name: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Estilo do Site</Label>
          <RadioGroup
            value={formData.site_style}
            onValueChange={(value) => setFormData({ ...formData, site_style: value as any })}
            className="grid grid-cols-3 gap-4"
          >
            <div>
              <RadioGroupItem value="classica" id="classica" className="peer sr-only" />
              <Label
                htmlFor="classica"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <span className="text-2xl">🎩</span>
                <span className="text-sm font-medium">Clássica</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="moderna" id="moderna" className="peer sr-only" />
              <Label
                htmlFor="moderna"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <span className="text-2xl">✂️</span>
                <span className="text-sm font-medium">Moderna</span>
              </Label>
            </div>
            <div>
              <RadioGroupItem value="premium" id="premium" className="peer sr-only" />
              <Label
                htmlFor="premium"
                className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <span className="text-2xl">👑</span>
                <span className="text-sm font-medium">Premium</span>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>WhatsApp para Agendamentos</Label>
          <Input
            placeholder="(11) 99999-9999"
            value={formData.whatsapp}
            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Endereço (opcional)</Label>
          <Input
            placeholder="Rua, número, bairro, cidade"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <Button 
          className="w-full" 
          onClick={handleGenerate}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando com IA...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Criar Site com IA
            </>
          )}
        </Button>

        {showForm && website && (
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => setShowForm(false)}
          >
            Cancelar
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
