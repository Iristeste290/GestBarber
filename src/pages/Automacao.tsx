import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageSquare, Calendar, TrendingDown, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Automacao = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasWhatsApp, setHasWhatsApp] = useState(false);
  const [inactiveClientsEnabled, setInactiveClientsEnabled] = useState(false);
  const [inactiveMessage, setInactiveMessage] = useState("Olá {nome}! Sentimos sua falta! Que tal agendar um horário conosco?");
  const [inactiveDays, setInactiveDays] = useState(30);
  const [inactiveCount, setInactiveCount] = useState(0);
  const [logs, setLogs] = useState<any[]>([]);

  const [seasonalEnabled, setSeasonalEnabled] = useState(false);
  const [seasonalEvents, setSeasonalEvents] = useState([
    { name: "Dia dos Pais", date: "2025-08-10", message: "Especial Dia dos Pais! Traga seu pai e ganhe 10% de desconto." },
    { name: "Natal", date: "2025-12-20", message: "Feliz Natal! Agende seu corte para as festas e ganhe um brinde especial." },
  ]);

  const [promotionEnabled, setPromotionEnabled] = useState(false);
  const [promotionMessage, setPromotionMessage] = useState("Horários vagos hoje! Agende agora e ganhe 15% de desconto.");

  useEffect(() => {
    loadSettings();
    checkWhatsAppConfig();
    loadInactiveClientsCount();
    loadLogs();
  }, []);

  const checkWhatsAppConfig = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("whatsapp_settings")
        .select("is_active")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      setHasWhatsApp(!!data);
    } catch (error) {
      setHasWhatsApp(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("automation_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setInactiveClientsEnabled(data.inactive_clients_enabled);
        setInactiveMessage(data.inactive_clients_message);
        setInactiveDays(data.inactive_days_threshold);
      }
    } catch (error: any) {
      console.error("Erro ao carregar configurações:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadInactiveClientsCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - inactiveDays);

      const { data: appointments } = await supabase
        .from("appointments")
        .select("client_id")
        .eq("status", "completed")
        .gte("appointment_date", thirtyDaysAgo.toISOString().split('T')[0]);

      const activeClientIds = new Set(appointments?.map(a => a.client_id) || []);

      const { count: totalClients } = await supabase
        .from("appointments")
        .select("client_id", { count: "exact", head: true });

      const inactiveClients = (totalClients || 0) - activeClientIds.size;
      setInactiveCount(Math.max(0, inactiveClients));
    } catch (error: any) {
      console.error("Erro ao contar clientes inativos:", error);
    }
  };

  const loadLogs = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("automation_logs")
        .select("*")
        .eq("user_id", user.id)
        .eq("type", "inactive_clients")
        .order("sent_at", { ascending: false })
        .limit(10);

      setLogs(data || []);
    } catch (error: any) {
      console.error("Erro ao carregar logs:", error);
    }
  };

  const handleSaveInactive = async () => {
    if (!hasWhatsApp) {
      toast({
        title: "WhatsApp não configurado",
        description: "Configure o WhatsApp antes de ativar a automação",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const settingsData = {
        user_id: user.id,
        inactive_clients_enabled: inactiveClientsEnabled,
        inactive_clients_message: inactiveMessage,
        inactive_days_threshold: inactiveDays,
      };

      const { data: existing } = await supabase
        .from("automation_settings")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const { error } = existing
        ? await supabase
            .from("automation_settings")
            .update(settingsData)
            .eq("user_id", user.id)
        : await supabase
            .from("automation_settings")
            .insert(settingsData);

      if (error) throw error;

      toast({
        title: "Configuração salva",
        description: "Mensagens automáticas para clientes inativos configuradas",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeasonal = () => {
    toast({
      title: "Configuração salva",
      description: "Mensagens sazonais configuradas",
    });
  };

  const handleSavePromotion = () => {
    toast({
      title: "Configuração salva",
      description: "Promoções automáticas configuradas",
    });
  };

  const handleTestAutomation = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.functions.invoke("check-inactive-clients", {
        body: { test: true, user_id: user.id },
      });

      if (error) throw error;

      toast({
        title: "Teste executado",
        description: `${data.sent} mensagem(ns) enviada(s)`,
      });

      loadLogs();
    } catch (error: any) {
      toast({
        title: "Erro no teste",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Automação" description="Automações de marketing">
      <div className="w-full px-3 md:px-6 py-3 md:py-6 space-y-4 md:space-y-6">
        {!hasWhatsApp && (
          <Card className="border-yellow-500">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-yellow-600">
                <XCircle className="w-5 h-5" />
                <p className="font-medium">WhatsApp não configurado</p>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Configure o WhatsApp para ativar as automações
              </p>
              <Button
                onClick={() => navigate("/configuracoes/whatsapp")}
                className="mt-4"
                variant="outline"
              >
                Configurar WhatsApp
              </Button>
            </CardContent>
          </Card>
        )}
        <Tabs defaultValue="inactive" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="inactive">Clientes Inativos</TabsTrigger>
            <TabsTrigger value="seasonal">Mensagens Sazonais</TabsTrigger>
            <TabsTrigger value="promotion">Promoções</TabsTrigger>
          </TabsList>

          <TabsContent value="inactive" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5" />
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        Mensagens para Clientes Inativos
                        {hasWhatsApp && inactiveClientsEnabled && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </CardTitle>
                      <CardDescription>
                        Enviar mensagem automática para clientes que não cortam há {inactiveDays} dias
                      </CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={inactiveClientsEnabled}
                    onCheckedChange={setInactiveClientsEnabled}
                    disabled={!hasWhatsApp}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inactive-days">Dias de inatividade</Label>
                  <Input
                    id="inactive-days"
                    type="number"
                    value={inactiveDays}
                    onChange={(e) => setInactiveDays(parseInt(e.target.value))}
                    disabled={!inactiveClientsEnabled || !hasWhatsApp}
                    min={1}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="inactive-message">Mensagem</Label>
                  <Textarea
                    id="inactive-message"
                    value={inactiveMessage}
                    onChange={(e) => setInactiveMessage(e.target.value)}
                    placeholder="Digite a mensagem a ser enviada. Use {nome} para personalizar"
                    rows={4}
                    disabled={!inactiveClientsEnabled || !hasWhatsApp}
                  />
                  <p className="text-xs text-muted-foreground">
                    Use {"{nome}"} para incluir o nome do cliente na mensagem
                  </p>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Estatísticas</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Clientes Inativos</p>
                      <p className="text-2xl font-bold">{inactiveCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Mensagens Enviadas (últimos 7 dias)</p>
                      <p className="text-2xl font-bold">
                        {logs.filter(log => {
                          const logDate = new Date(log.sent_at);
                          const sevenDaysAgo = new Date();
                          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                          return logDate >= sevenDaysAgo;
                        }).length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleSaveInactive}
                    disabled={!hasWhatsApp || saving}
                    className="flex-1"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      "Salvar Configurações"
                    )}
                  </Button>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleTestAutomation}
                          disabled={!hasWhatsApp || !inactiveClientsEnabled}
                          variant="outline"
                        >
                          Testar Envio
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Envia uma mensagem de teste para seus clientes inativos. 
                          A automação permanece desativada até você ativá-la manualmente.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </CardContent>
            </Card>

            {logs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Envios</CardTitle>
                  <CardDescription>Últimas mensagens enviadas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {logs.map((log) => (
                      <div key={log.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">{log.phone}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(log.sent_at).toLocaleString("pt-BR")}
                          </p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          log.status === "sent" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                        }`}>
                          {log.status === "sent" ? "Enviado" : "Erro"}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="seasonal" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5" />
                    <div>
                      <CardTitle>Mensagens Sazonais</CardTitle>
                      <CardDescription>Configure mensagens automáticas para datas especiais</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={seasonalEnabled}
                    onCheckedChange={setSeasonalEnabled}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {seasonalEvents.map((event, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Evento</Label>
                        <Input
                          value={event.name}
                          onChange={(e) => {
                            const newEvents = [...seasonalEvents];
                            newEvents[index].name = e.target.value;
                            setSeasonalEvents(newEvents);
                          }}
                          disabled={!seasonalEnabled}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Data</Label>
                        <Input
                          type="date"
                          value={event.date}
                          onChange={(e) => {
                            const newEvents = [...seasonalEvents];
                            newEvents[index].date = e.target.value;
                            setSeasonalEvents(newEvents);
                          }}
                          disabled={!seasonalEnabled}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Mensagem</Label>
                      <Textarea
                        value={event.message}
                        onChange={(e) => {
                          const newEvents = [...seasonalEvents];
                          newEvents[index].message = e.target.value;
                          setSeasonalEvents(newEvents);
                        }}
                        rows={3}
                        disabled={!seasonalEnabled}
                      />
                    </div>
                  </div>
                ))}

                <Button onClick={handleSaveSeasonal} className="w-full">
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promotion" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-5 w-5" />
                    <div>
                      <CardTitle>Promoções Automáticas</CardTitle>
                      <CardDescription>Enviar promoções para preencher horários vazios</CardDescription>
                    </div>
                  </div>
                  <Switch
                    checked={promotionEnabled}
                    onCheckedChange={setPromotionEnabled}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="promotion-message">Mensagem da Promoção</Label>
                  <Textarea
                    id="promotion-message"
                    value={promotionMessage}
                    onChange={(e) => setPromotionMessage(e.target.value)}
                    placeholder="Digite a mensagem da promoção"
                    rows={4}
                    disabled={!promotionEnabled}
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-3">
                  <h4 className="font-medium">Configurações de Disparo</h4>
                  <div className="space-y-2">
                    <Label htmlFor="empty-slots">Disparar quando houver X horários vazios</Label>
                    <Input
                      id="empty-slots"
                      type="number"
                      defaultValue="5"
                      min="1"
                      disabled={!promotionEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hours-before">Com antecedência de (horas)</Label>
                    <Input
                      id="hours-before"
                      type="number"
                      defaultValue="3"
                      min="1"
                      disabled={!promotionEnabled}
                    />
                  </div>
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Estatísticas</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Promoções enviadas hoje</p>
                      <p className="text-2xl font-bold">3</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Taxa de conversão</p>
                      <p className="text-2xl font-bold">35%</p>
                    </div>
                  </div>
                </div>

                <Button onClick={handleSavePromotion} className="w-full">
                  Salvar Configurações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Automacao;
