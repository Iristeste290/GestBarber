import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * This page handles the Google OAuth callback.
 * It processes the authorization code directly and redirects back to profile.
 */
const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const processCallback = async () => {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error) {
        setStatus('error');
        setErrorMessage(error === 'access_denied' ? 'Acesso negado pelo usuário' : error);
        toast.error('Erro na autenticação', { description: error });
        setTimeout(() => navigate("/perfil"), 2000);
        return;
      }

      if (!code) {
        setStatus('error');
        setErrorMessage('Código de autorização não encontrado');
        setTimeout(() => navigate("/perfil"), 2000);
        return;
      }

      try {
        const redirectUri = `${window.location.origin}/google-callback`;

        // Exchange code for tokens
        const { data, error: exchangeError } = await supabase.functions.invoke('google-business-auth', {
          body: {
            action: 'exchange-code',
            code,
            redirectUri,
          },
        });

        if (exchangeError) throw exchangeError;

        // Store tokens and accounts in sessionStorage for the profile page to use
        sessionStorage.setItem('google-auth-data', JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          token_expires_at: data.token_expires_at,
          accounts: data.accounts || [],
        }));

        setStatus('success');
        toast.success('Autenticação concluída!', { description: 'Selecione sua conta do Google Business' });
        
        // Redirect back to profile
        setTimeout(() => navigate("/perfil", { state: { googleAuthComplete: true } }), 500);
      } catch (err: unknown) {
        console.error('Google auth callback error:', err);
        const message = err instanceof Error ? err.message : 'Erro desconhecido';
        setStatus('error');
        setErrorMessage(message);
        toast.error('Erro ao conectar', { description: message });
        setTimeout(() => navigate("/perfil"), 2000);
      }
    };

    processCallback();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center max-w-md p-6">
        {status === 'processing' && (
          <>
            <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Conectando ao Google Business...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-foreground font-medium">Autenticação concluída!</p>
            <p className="text-muted-foreground text-sm mt-2">Redirecionando...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <div className="w-10 h-10 bg-destructive rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-destructive-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-destructive font-medium">Erro na autenticação</p>
            <p className="text-muted-foreground text-sm mt-2">{errorMessage}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
