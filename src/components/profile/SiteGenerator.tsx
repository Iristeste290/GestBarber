import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Globe, Copy, ExternalLink, Sparkles, Check, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useBarberSite, useCreateBarberSite } from "@/hooks/useBarberSite";

const SiteGenerator = () => {
  const { data: site, isLoading } = useBarberSite();
  const createSite = useCreateBarberSite();
  
  const [showForm, setShowForm] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    phone: '',
    address: '',
    city: '',
    theme: 'moderna',
  });

  const handleCreate = () => {
    if (!formData.title.trim()) {
      toast.error('Digite o nome da barbearia');
      return;
    }
    if (!formData.phone.trim()) {
      toast.error('Digite o WhatsApp');
      return;
    }

    createSite.mutate({
      title: formData.title,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      theme: formData.theme,
    });
  };

  const siteUrl = site ? `${window.location.origin}/b/${site.slug}` : null;

  const copyUrl = async () => {
    if (!siteUrl) return;
    
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Erro ao copiar link');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Show existing site info
  if (site && !showForm) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            Seu Site
          </CardTitle>
          <CardDescription>
            Seu site está publicado e disponível para seus clientes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <Label className="text-sm text-muted-foreground">Link do site</Label>
            <div className="flex items-center gap-2 mt-1">
              <code className="flex-1 text-sm bg-background px-3 py-2 rounded border truncate">
                {siteUrl}
              </code>
              <Button size="icon" variant="outline" onClick={copyUrl}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button size="icon" variant="outline" asChild>
                <a href={siteUrl || '#'} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Nome:</span>
              <p className="font-medium">{site.title}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Tema:</span>
              <p className="font-medium capitalize">{site.theme}</p>
            </div>
            <div>
              <span className="text-muted-foreground">WhatsApp:</span>
              <p className="font-medium">{site.phone || '-'}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Status:</span>
              <p className="font-medium text-green-600">
                {site.published ? '✓ Publicado' : 'Não publicado'}
              </p>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => {
              setFormData({
                title: site.title,
                phone: site.phone || '',
                address: site.address || '',
                city: site.city || '',
                theme: site.theme || 'moderna',
              });
              setShowForm(true);
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Recriar Site
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Show creation form
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {site ? 'Recriar Site' : 'Criar Meu Site'}
        </CardTitle>
        <CardDescription>
          Crie um site profissional para sua barbearia em segundos com IA
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="site-title">Nome da Barbearia *</Label>
          <Input
            id="site-title"
            placeholder="Ex: Barbearia do João"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="site-phone">WhatsApp *</Label>
          <Input
            id="site-phone"
            placeholder="Ex: 11999999999"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="site-address">Endereço</Label>
          <Input
            id="site-address"
            placeholder="Ex: Rua das Flores, 123"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="site-city">Cidade</Label>
          <Input
            id="site-city"
            placeholder="Ex: São Paulo"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="site-theme">Estilo do Site</Label>
          <Select 
            value={formData.theme} 
            onValueChange={(value) => setFormData({ ...formData, theme: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="moderna">🎨 Moderna</SelectItem>
              <SelectItem value="classica">🪵 Clássica</SelectItem>
              <SelectItem value="premium">✨ Premium</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            className="flex-1"
            onClick={handleCreate}
            disabled={createSite.isPending}
          >
            {createSite.isPending ? (
              <>
                <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
                Criando com IA...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Criar Site com IA
              </>
            )}
          </Button>
          {site && (
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SiteGenerator;
