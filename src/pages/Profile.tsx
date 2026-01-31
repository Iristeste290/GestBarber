import { useState, useEffect, useCallback } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Phone, Loader2, MessageSquare, RotateCcw, Bell, Volume2, VolumeX, Store, Trash2 } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { z } from "zod";
import { NotificationStatusCard } from "@/components/agenda/WhatsAppStatusCard";
import { DEFAULT_REMINDER_TEMPLATE } from "@/lib/whatsapp";
import { isNotificationSoundEnabled, setNotificationSoundEnabled, playNotificationSound } from "@/lib/notification-sound";
import { PushNotificationSettings } from "@/components/notifications/PushNotificationSettings";
import { BarbershopLogoUpload } from "@/components/profile/BarbershopLogoUpload";
import SiteGenerator from "@/components/profile/SiteGenerator";
import { GoogleBusinessSetup } from "@/components/google-business/GoogleBusinessSetup";
import { sanitizeName, sanitizePhone, sanitizeText, sanitizeGeneralText, containsDangerousContent } from "@/lib/input-sanitizer";
import { DeleteAccountDialog } from "@/components/profile/DeleteAccountDialog";

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  phone: z.string().trim().regex(/^\d{10,11}$/, "Telefone deve ter 10 ou 11 dígitos (apenas números)").optional().or(z.literal("")),
  reminder_template: z.string().optional(),
  barbershop_name: z.string().optional(),
});

const Profile = () => {
  const { user } = useRequireAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [barbershopName, setBarbershopName] = useState("");
  const [barbershopLogoUrl, setBarbershopLogoUrl] = useState<string | null>(null);
  const [reminderTemplate, setReminderTemplate] = useState(DEFAULT_REMINDER_TEMPLATE);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Load sound preference from localStorage
    setSoundEnabled(isNotificationSoundEnabled());
  }, []);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, phone, reminder_template, barbershop_name, barbershop_logo_url")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data) {
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setBarbershopName(data.barbershop_name || "");
        setBarbershopLogoUrl(data.barbershop_logo_url || null);
        setReminderTemplate(data.reminder_template || DEFAULT_REMINDER_TEMPLATE);
      }
    } catch (error: any) {
      console.error("Erro ao carregar perfil:", error);
      toast.error("Erro ao carregar dados do perfil");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Validar dados
    const validation = profileSchema.safeParse({
      full_name: fullName,
      phone: phone,
      reminder_template: reminderTemplate,
      barbershop_name: barbershopName,
    });

    if (!validation.success) {
      toast.error(validation.error.errors[0].message);
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          phone: phone || null,
          barbershop_name: barbershopName || "",
          reminder_template: reminderTemplate || DEFAULT_REMINDER_TEMPLATE,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      console.error("Erro ao salvar perfil:", error);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Meu Perfil</h1>
          <p className="text-muted-foreground">
            Gerencie suas informações pessoais
          </p>
        </div>

        <NotificationStatusCard />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configurações de alertas e sons
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Push Notifications with PWA detection */}
            <PushNotificationSettings userId={user?.id} />

            <div className="border-t pt-4">
              {/* Sound Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-primary" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="sound-toggle" className="text-base font-medium">
                      Som de notificação
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Tocar som quando app estiver aberto
                    </p>
                  </div>
                </div>
                <Switch
                  id="sound-toggle"
                  checked={soundEnabled}
                  onCheckedChange={(checked) => {
                    setSoundEnabled(checked);
                    setNotificationSoundEnabled(checked);
                    if (checked) {
                      playNotificationSound("gentle");
                      toast.success("Sons de notificação ativados");
                    } else {
                      toast.info("Sons de notificação desativados");
                    }
                  }}
                />
              </div>

              {soundEnabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => playNotificationSound("gentle")}
                  className="gap-2 mt-3"
                >
                  <Volume2 className="h-4 w-4" />
                  Testar Som
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Barbearia
            </CardTitle>
            <CardDescription>
              Informações da sua barbearia
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="barbershop_name">Nome da Barbearia</Label>
              <Input
                id="barbershop_name"
                value={barbershopName}
                onChange={(e) => setBarbershopName(e.target.value)}
                placeholder="Ex: Barbearia do João"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                Este nome será exibido para seus clientes na página de agendamento.
              </p>
            </div>

            {user && (
              <BarbershopLogoUpload
                userId={user.id}
                currentLogoUrl={barbershopLogoUrl}
                barbershopName={barbershopName}
                onLogoChange={setBarbershopLogoUrl}
              />
            )}
          </CardContent>
        </Card>

        {/* Site Generator */}
        <SiteGenerator />

        {/* Google Business Integration */}
        <GoogleBusinessSetup />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Seus dados pessoais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={fullName}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  if (containsDangerousContent(rawValue)) {
                    toast.error("Caracteres não permitidos");
                    return;
                  }
                  setFullName(sanitizeName(rawValue));
                }}
                placeholder="Digite seu nome completo"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Telefone (WhatsApp)
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(sanitizePhone(e.target.value))}
                placeholder="11999999999"
                maxLength={11}
              />
              <p className="text-sm text-muted-foreground">
                Apenas números (DDD + número). Ex: 11999999999
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reminder_template" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Template de Lembrete WhatsApp
              </Label>
              <Textarea
                id="reminder_template"
                value={reminderTemplate}
                onChange={(e) => {
                  const rawValue = e.target.value;
                  if (containsDangerousContent(rawValue)) {
                    toast.error("Caracteres de script não são permitidos");
                    return;
                  }
                  setReminderTemplate(sanitizeGeneralText(rawValue, 1000));
                }}
                placeholder="Digite o template da mensagem..."
                rows={10}
                maxLength={1000}
                className="font-mono text-sm"
              />
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>Variáveis:</span>
                <code className="bg-muted px-1.5 py-0.5 rounded">{"{nome}"}</code>
                <code className="bg-muted px-1.5 py-0.5 rounded">{"{data}"}</code>
                <code className="bg-muted px-1.5 py-0.5 rounded">{"{horario}"}</code>
                <code className="bg-muted px-1.5 py-0.5 rounded">{"{servico}"}</code>
                <code className="bg-muted px-1.5 py-0.5 rounded">{"{barbeiro}"}</code>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setReminderTemplate(DEFAULT_REMINDER_TEMPLATE)}
                className="gap-2"
              >
                <RotateCcw className="h-3 w-3" />
                Restaurar Padrão
              </Button>
            </div>

            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="w-full sm:w-auto"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* LGPD - Delete Account */}
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações irreversíveis relacionadas à sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
              <h4 className="font-medium text-destructive mb-2">
                Excluir Conta (LGPD)
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Conforme a Lei Geral de Proteção de Dados, você pode solicitar a exclusão 
                permanente dos seus dados pessoais. Esta ação é irreversível.
              </p>
              {user && (
                <DeleteAccountDialog 
                  userId={user.id} 
                  userEmail={user.email} 
                />
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </AppLayout>
  );
};

export default Profile;
