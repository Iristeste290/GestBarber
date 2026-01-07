import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UltraMsgSetupGuide } from "@/components/whatsapp/UltraMsgSetupGuide";
const whatsappConfigSchema = z.object({
  whatsappNumber: z
    .string()
    .min(1, "Número do WhatsApp é obrigatório")
    .regex(/^\d+$/, "Número deve conter apenas dígitos")
    .min(10, "Número deve ter no mínimo 10 dígitos")
    .max(13, "Número deve ter no máximo 13 dígitos")
    .refine(
      (val) => val.startsWith("55"),
      "Número deve começar com código do país 55 (Brasil)"
    ),
  apiUrl: z
    .string()
    .min(1, "URL da API é obrigatória")
    .max(500, "URL muito longa (máximo 500 caracteres)")
    .url("URL inválida. Use formato: https://api.exemplo.com/...")
    .refine(
      (val) => val.startsWith("https://"),
      "URL deve usar HTTPS para segurança"
    ),
  apiToken: z
    .string()
    .min(1, "Token da API é obrigatório")
    .min(10, "Token deve ter no mínimo 10 caracteres")
    .max(500, "Token muito longo (máximo 500 caracteres)")
    .regex(
      /^[A-Za-z0-9_\-\.]+$/,
      "Token contém caracteres inválidos. Use apenas letras, números, _, - e ."
    ),
  messageTemplate: z
    .string()
    .min(20, "Template muito curto. Mínimo 20 caracteres")
    .max(2000, "Template muito longo. Máximo 2000 caracteres")
    .refine(
      (val) => val.includes("{nome}"),
      "Template deve conter a variável {nome}"
    )
    .refine(
      (val) => val.includes("{barbeiro}"),
      "Template deve conter a variável {barbeiro}"
    )
    .refine(
      (val) => val.includes("{servico}"),
      "Template deve conter a variável {servico}"
    ),
  isActive: z.boolean(),
});

type WhatsAppConfigForm = z.infer<typeof whatsappConfigSchema>;

export default function WhatsAppConfig() {
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  const form = useForm<WhatsAppConfigForm>({
    resolver: zodResolver(whatsappConfigSchema),
    defaultValues: {
      whatsappNumber: "",
      apiUrl: "",
      apiToken: "",
      messageTemplate: `✅ *Agendamento Confirmado!*

Olá *{nome}*!

Seu agendamento foi realizado com sucesso:

👤 Barbeiro: {barbeiro}
✂️ Serviço: {servico}
📅 Data: {data}
⏰ Horário: {horario}
💰 Valor: R$ {preco}

Aguardamos você! 😊`,
      isActive: true,
    },
  });

  useEffect(() => {
    loadWhatsAppSettings();
  }, []);

  const loadWhatsAppSettings = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("whatsapp_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setHasConfig(true);
        form.reset({
          whatsappNumber: data.whatsapp_number || "",
          apiToken: data.api_token || "",
          apiUrl: data.api_url || "",
          isActive: data.is_active,
          messageTemplate: data.appointment_message_template || form.getValues("messageTemplate"),
        });
      }
    } catch (error: any) {
      toast.error("Erro ao carregar configurações");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (values: WhatsAppConfigForm) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const settingsData = {
        user_id: user.id,
        whatsapp_number: values.whatsappNumber as string,
        api_token: values.apiToken as string,
        api_url: values.apiUrl as string,
        is_active: values.isActive as boolean,
        appointment_message_template: values.messageTemplate as string,
      };

      const { error } = hasConfig
        ? await supabase
            .from("whatsapp_settings")
            .update(settingsData)
            .eq("user_id", user.id)
        : await supabase
            .from("whatsapp_settings")
            .insert(settingsData);

      if (error) throw error;

      setHasConfig(true);
      toast.success("✅ Configurações salvas e validadas com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    }
  };

  const handleTest = async () => {
    const values = form.getValues();
    
    // Validate before testing
    const result = await form.trigger();
    if (!result) {
      toast.error("Corrija os erros no formulário antes de testar");
      return;
    }

    if (!hasConfig) {
      toast.error("Salve as configurações antes de testar");
      return;
    }

    try {
      setTesting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Usuário não autenticado");
        return;
      }

      const testMessage = `🧪 *Teste de Integração WhatsApp*\n\n✅ Sua configuração está funcionando perfeitamente!\n\nSistema GestBarber pronto para enviar confirmações automáticas aos seus clientes.`;

      const { data, error } = await supabase.functions.invoke(
        'send-whatsapp-message',
        {
          body: {
            userId: user.id,
            phone: values.whatsappNumber,
            message: testMessage,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast.success("✅ Teste enviado! Verifique seu WhatsApp");
      } else {
        throw new Error(data?.error || "Erro ao enviar teste");
      }
    } catch (error: any) {
      console.error("Erro no teste:", error);
      toast.error(error.message || "Não foi possível enviar a mensagem de teste");
    } finally {
      setTesting(false);
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
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configurações do WhatsApp</h1>
          <p className="text-muted-foreground">
            Configure seu WhatsApp Business para envio automático de notificações
          </p>
        </div>

        <Alert>
          <MessageSquare className="h-4 w-4" />
          <AlertDescription>
            Configure seu número do WhatsApp Business e um token de API para enviar confirmações automáticas aos clientes.
            Suportamos serviços como UltraMsg, Evolution API, Baileys e similares.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Status da Integração
                  {hasConfig && form.watch("isActive") ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </CardTitle>
                <CardDescription>
                  {hasConfig && form.watch("isActive")
                    ? "WhatsApp configurado e ativo"
                    : "WhatsApp não configurado ou inativo"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="whatsappNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do WhatsApp Business *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="5511999999999"
                          {...field}
                          onChange={(e) => {
                            const clean = e.target.value.replace(/\D/g, "");
                            field.onChange(clean);
                          }}
                          maxLength={13}
                        />
                      </FormControl>
                      <FormDescription>
                        Apenas números com código do país 55 e DDD. Ex: 5511999999999
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apiUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da API de Envio *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://api.ultramsg.com/instance123456/messages/chat"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        URL completa HTTPS da API fornecida pelo seu serviço
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="apiToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token da API de Envio *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="seu_token_aqui"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Token seguro fornecido pelo seu serviço (min. 10 caracteres)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="messageTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Template da Mensagem de Agendamento *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Digite o template da mensagem..."
                          {...field}
                          rows={12}
                          className="font-mono text-sm"
                        />
                      </FormControl>
                      <FormDescription>
                        <div className="space-y-1">
                          <p className="font-semibold">Variáveis obrigatórias:</p>
                          <p>• <code className="bg-muted px-1 rounded">{"{nome}"}</code> - Nome do cliente</p>
                          <p>• <code className="bg-muted px-1 rounded">{"{barbeiro}"}</code> - Nome do barbeiro</p>
                          <p>• <code className="bg-muted px-1 rounded">{"{servico}"}</code> - Nome do serviço</p>
                          <p className="mt-2 text-xs">Opcionais: {"{data}"}, {"{horario}"}, {"{preco}"}</p>
                        </div>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-0.5">
                        <FormLabel>Integração Ativa</FormLabel>
                        <FormDescription>
                          Ativar/desativar o envio automático de mensagens
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={form.formState.isSubmitting || testing} 
                    className="flex-1"
                  >
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Validando e Salvando...
                      </>
                    ) : (
                      "Salvar Configurações"
                    )}
                  </Button>
                  
                  {hasConfig && (
                    <Button 
                      type="button"
                      onClick={handleTest} 
                      disabled={testing || form.formState.isSubmitting || !form.watch("isActive")} 
                      variant="outline"
                      className="flex-1"
                    >
                      {testing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Testando...
                        </>
                      ) : (
                        <>
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Testar Envio
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {hasConfig && (
                  <p className="text-xs text-muted-foreground text-center">
                    💡 Clique em "Testar Envio" para receber uma mensagem de teste no seu WhatsApp
                  </p>
                )}
              </CardContent>
            </Card>
          </form>
        </Form>

        <UltraMsgSetupGuide />

        <Card>
          <CardHeader>
            <CardTitle>Outras Opções Compatíveis</CardTitle>
            <CardDescription>
              Caso prefira outro serviço, também suportamos:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold">Evolution API</p>
              <p className="text-muted-foreground">API open-source para WhatsApp (requer servidor próprio)</p>
              <a href="https://evolution-api.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                evolution-api.com
              </a>
            </div>
            <div>
              <p className="font-semibold">Z-API</p>
              <p className="text-muted-foreground">Alternativa brasileira ao UltraMsg</p>
              <a href="https://z-api.io" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                z-api.io
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
