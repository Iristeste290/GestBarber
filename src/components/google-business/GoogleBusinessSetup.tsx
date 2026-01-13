import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ExternalLink,
  RefreshCw,
  Unlink,
  CheckCircle2,
  AlertCircle,
  Building2,
  MapPin,
  Copy,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface GoogleAccount {
  name: string;
  accountName: string;
  type: string;
}

interface GoogleLocation {
  name: string;
  title: string;
  storefrontAddress?: {
    locality?: string;
    addressLines?: string[];
  };
}

export const GoogleBusinessSetup = () => {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<'idle' | 'authenticating' | 'selecting-account' | 'selecting-location' | 'saving' | 'no-account' | 'api-error'>('idle');
  const [apiError, setApiError] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [locations, setLocations] = useState<GoogleLocation[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [tokens, setTokens] = useState<{ access_token: string; refresh_token: string; token_expires_at: string } | null>(null);
  const [pendingAuthUrl, setPendingAuthUrl] = useState<string | null>(null);

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const currentRedirectUri = currentOrigin ? `${currentOrigin}/google-callback` : '';

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copiado!`);
    } catch {
      toast.error('Não foi possível copiar', {
        description: 'Copie manualmente selecionando o texto.',
      });
    }
  };

  // Get current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    },
  });

  // Get connection status
  const { data: connection, isLoading: connectionLoading } = useQuery({
    queryKey: ['google-business-connection'],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('google_business_connection')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user,
  });

  // Check for auth data from callback on mount
  useEffect(() => {
    const authDataStr = sessionStorage.getItem('google-auth-data');
    if (authDataStr) {
      try {
        const authData = JSON.parse(authDataStr);
        sessionStorage.removeItem('google-auth-data');
        setPendingAuthUrl(null);
        
        // Check if there's an API error (quota exceeded, etc.)
        if (authData.error) {
          console.error('Google Business API error:', authData.error);
          const errorMessage = authData.error.message || 'Erro ao acessar a API do Google Business';
          
          if (errorMessage.includes('Quota exceeded') || authData.error.code === 429) {
            setApiError('A API do Google Business está com limite de requisições excedido. Isso pode acontecer se a API ainda não foi habilitada corretamente no Google Cloud Console.');
          } else {
            setApiError(errorMessage);
          }
          setStep('api-error');
          return;
        }
        
        setTokens({
          access_token: authData.access_token,
          refresh_token: authData.refresh_token,
          token_expires_at: authData.token_expires_at,
        });
        setAccounts(authData.accounts || []);
        
        if (authData.accounts?.length > 0) {
          setStep('selecting-account');
        } else {
          setStep('no-account');
        }
      } catch (e) {
        console.error('Error parsing auth data:', e);
      }
    }
  }, []);

  const startAuth = useMutation({
    mutationFn: async () => {
      setPendingAuthUrl(null);
      const redirectUri = `${window.location.origin}/google-callback`;

      const { data, error } = await supabase.functions.invoke('google-business-auth', {
        body: {
          action: 'get-auth-url',
          redirectUri,
        },
      });

      if (error) throw error;

      const authUrl = (data as any)?.authUrl as string | undefined;
      if (!authUrl) throw new Error('URL de autenticação não retornada pelo backend');

      setPendingAuthUrl(authUrl);

      // Google OAuth precisa abrir em contexto top-level.
      // No preview (iframe), navegando dentro do iframe o Chrome bloqueia (ERR_BLOCKED_BY_RESPONSE).
      let isInIframe = false;
      try {
        isInIframe = window.self !== window.top;
      } catch {
        isInIframe = true;
      }

      if (isInIframe) {
        const opened = window.open(authUrl, '_blank', 'noopener,noreferrer');
        if (!opened) {
          toast.error('Pop-up bloqueado', {
            description: 'Clique em “Abrir login do Google” abaixo para continuar.',
          });
        } else {
          toast('Continue na nova aba', {
            description: 'Após autorizar, você volta automaticamente para o app.',
          });
        }
        return;
      }

      window.location.assign(authUrl);
    },
    onError: (error: Error) => {
      toast.error('Erro ao iniciar autenticação', { description: error.message });
    },
  });

  const fetchLocations = useMutation({
    mutationFn: async (accountId: string) => {
      if (!tokens) throw new Error('No tokens');

      const { data, error } = await supabase.functions.invoke('google-business-auth', {
        body: {
          action: 'get-locations',
          accessToken: tokens.access_token,
          accountId,
        },
      });

      if (error) throw error;
      return data.locations as GoogleLocation[];
    },
    onSuccess: (data) => {
      setLocations(data);
      setStep('selecting-location');

      if (data.length === 0) {
        toast.error('Nenhuma localização encontrada nesta conta');
        setStep('selecting-account');
      }
    },
    onError: (error: Error) => {
      toast.error('Erro ao buscar localizações', { description: error.message });
    },
  });

  const saveConnection = useMutation({
    mutationFn: async (locationId: string) => {
      if (!tokens || !user) throw new Error('Missing data');

      const account = accounts.find(a => a.name === selectedAccount);
      const location = locations.find(l => l.name === locationId);

      const { error } = await supabase.functions.invoke('google-business-auth', {
        body: {
          action: 'save-connection',
          userId: user.id,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt: tokens.token_expires_at,
          accountId: selectedAccount,
          accountName: account?.accountName || '',
          locationId,
          locationName: location?.title || '',
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Google Business conectado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['google-business-connection'] });
      setStep('idle');
      setTokens(null);
      setAccounts([]);
      setLocations([]);
    },
    onError: (error: Error) => {
      toast.error('Erro ao salvar conexão', { description: error.message });
    },
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.functions.invoke('google-business-auth', {
        body: {
          action: 'disconnect',
          userId: user.id,
        },
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Google Business desconectado');
      queryClient.invalidateQueries({ queryKey: ['google-business-connection'] });
      queryClient.invalidateQueries({ queryKey: ['google-business-metrics'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao desconectar', { description: error.message });
    },
  });

  const syncMetrics = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.functions.invoke('google-business-metrics', {
        body: {
          action: 'sync-metrics',
          userId: user.id,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success('Métricas atualizadas!', {
        description: `${data.metrics?.views || 0} visualizações sincronizadas`,
      });
      queryClient.invalidateQueries({ queryKey: ['google-business-metrics'] });
    },
    onError: (error: Error) => {
      toast.error('Erro ao sincronizar métricas', { description: error.message });
    },
  });

  if (connectionLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Connected state
  if (connection?.is_connected) {
    return (
      <Card className="border-green-500/30">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/10">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Google Business Conectado</CardTitle>
                <CardDescription>{connection.location_name || connection.account_name}</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="border-green-500/50 text-green-500">
              Ativo
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Última sincronização: {connection.last_sync_at 
              ? new Date(connection.last_sync_at).toLocaleString('pt-BR')
              : 'Nunca'}
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => syncMetrics.mutate()}
              disabled={syncMetrics.isPending}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${syncMetrics.isPending ? 'animate-spin' : ''}`} />
              Atualizar Métricas
            </Button>
            <Button 
              variant="ghost" 
              onClick={() => disconnect.mutate()}
              disabled={disconnect.isPending}
              className="text-destructive hover:text-destructive"
            >
              <Unlink className="mr-2 h-4 w-4" />
              Desconectar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Selection steps
  if (step === 'selecting-account') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Selecione a Conta
          </CardTitle>
          <CardDescription>Escolha qual conta do Google Business deseja conectar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={selectedAccount} onValueChange={setSelectedAccount}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione uma conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((account) => (
                <SelectItem key={account.name} value={account.name}>
                  {account.accountName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              onClick={() => {
                if (selectedAccount) {
                  fetchLocations.mutate(selectedAccount);
                }
              }}
              disabled={!selectedAccount || fetchLocations.isPending}
            >
              {fetchLocations.isPending ? 'Carregando...' : 'Continuar'}
            </Button>
            <Button variant="ghost" onClick={() => setStep('idle')}>
              Cancelar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'selecting-location') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Selecione a Barbearia
          </CardTitle>
          <CardDescription>Escolha qual localização deseja monitorar</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {locations.map((location) => (
              <Button
                key={location.name}
                variant="outline"
                className="w-full justify-start h-auto py-3"
                onClick={() => {
                  setStep('saving');
                  saveConnection.mutate(location.name);
                }}
                disabled={saveConnection.isPending}
              >
                <div className="text-left">
                  <div className="font-medium">{location.title}</div>
                  {location.storefrontAddress?.addressLines?.[0] && (
                    <div className="text-sm text-muted-foreground">
                      {location.storefrontAddress.addressLines[0]}
                    </div>
                  )}
                </div>
              </Button>
            ))}
          </div>

          <Button variant="ghost" onClick={() => setStep('selecting-account')}>
            Voltar
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No Google Business account found
  if (step === 'no-account') {
    return (
      <Card className="border-amber-500/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-500/10">
              <AlertCircle className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Nenhuma conta encontrada</CardTitle>
              <CardDescription>
                Você ainda não tem um Perfil da Empresa no Google
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-amber-500/10 rounded-lg p-4 text-sm space-y-3">
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Para conectar, você precisa ter um Perfil da Empresa no Google (antigo Google Meu Negócio).
            </p>
            <p className="text-muted-foreground">
              É gratuito e permite que sua barbearia apareça no Google Maps e nas buscas locais.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Como criar seu perfil:</p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
              <li>Acesse o Google Business Profile</li>
              <li>Clique em "Gerenciar agora"</li>
              <li>Adicione sua barbearia com endereço</li>
              <li>Aguarde a verificação do Google</li>
              <li>Volte aqui e conecte novamente</li>
            </ol>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild className="w-full">
              <a 
                href="https://business.google.com/create" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Criar Perfil da Empresa no Google
              </a>
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                setStep('idle');
                setTokens(null);
                setAccounts([]);
              }}
              className="w-full"
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // API Error state (quota exceeded, etc.)
  if (step === 'api-error') {
    return (
      <Card className="border-red-500/30">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-red-500/10">
              <AlertCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Erro na API do Google</CardTitle>
              <CardDescription>
                Não foi possível acessar as contas do Google Business
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-red-500/10 rounded-lg p-4 text-sm space-y-3">
            <p className="font-medium text-red-700 dark:text-red-400">
              {apiError || 'Ocorreu um erro ao conectar com a API do Google Business.'}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Possíveis causas:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>A API "My Business Account Management" não está habilitada no Google Cloud Console</li>
              <li>A cota da API foi excedida (muitas requisições)</li>
              <li>O projeto Google Cloud precisa de aprovação para usar a API</li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium">Como resolver:</p>
            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
              <li>Acesse o Google Cloud Console</li>
              <li>Vá em "APIs e Serviços" → "Biblioteca"</li>
              <li>Busque por "My Business Account Management API"</li>
              <li>Clique em "Ativar"</li>
              <li>Aguarde alguns minutos e tente novamente</li>
            </ol>
          </div>

          <div className="flex flex-col gap-2">
            <Button asChild variant="outline" className="w-full">
              <a 
                href="https://console.cloud.google.com/apis/library/mybusinessaccountmanagement.googleapis.com" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir Google Cloud Console
              </a>
            </Button>
            <Button 
              onClick={() => {
                setStep('idle');
                setTokens(null);
                setAccounts([]);
                setApiError(null);
              }}
              className="w-full"
            >
              Tentar novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default state - not connected
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-muted">
            <AlertCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-lg">Google Business Profile</CardTitle>
            <CardDescription>
              Conecte para ver quantas pessoas encontram sua barbearia no Google
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
          <p className="font-medium">Com a conexão você verá:</p>
          <ul className="list-disc list-inside text-muted-foreground space-y-1">
            <li>Quantas pessoas viram sua barbearia</li>
            <li>Quantas ligaram pelo Google</li>
            <li>Quantas pediram rota até você</li>
            <li>Quantas clicaram no seu site</li>
          </ul>
        </div>

        {pendingAuthUrl && (
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm space-y-3">
            <p className="text-muted-foreground">
              Se o navegador bloqueou o pop-up ou você estiver no preview, abra o login do Google em uma nova aba:
            </p>
            <Button asChild variant="outline" className="w-full">
              <a href={pendingAuthUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                Abrir login do Google
              </a>
            </Button>
          </div>
        )}

        <Button
          onClick={() => startAuth.mutate()}
          disabled={startAuth.isPending || step !== 'idle'}
          className="w-full"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          {startAuth.isPending || step === 'authenticating' ? 'Conectando...' : 'Conectar Google Business'}
        </Button>
      </CardContent>
    </Card>
  );
};
