import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Scissors, Eye, EyeOff, KeyRound, Lock } from "lucide-react";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { z } from "zod";
import { ForgotPasswordDialog } from "@/components/auth/ForgotPasswordDialog";
import { PasswordStrengthIndicator, validatePasswordStrength } from "@/components/auth/PasswordStrengthIndicator";
import { getDeviceId } from "@/lib/device-id";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
  fullName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").optional(),
  barbershopName: z.string().min(3, "Nome da barbearia deve ter no mínimo 3 caracteres").optional(),
  telefone: z.string().min(8, "Digite um telefone válido").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isResetMode = searchParams.get("reset") === "true";
  
  const [isLoading, setIsLoading] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ email: "", password: "", fullName: "", barbershopName: "", telefone: "" });
  const [resetData, setResetData] = useState({ password: "", confirmPassword: "" });
  const [isPasswordBreached, setIsPasswordBreached] = useState(false);
  const [isResetPasswordBreached, setIsResetPasswordBreached] = useState(false);
  const [lockoutInfo, setLockoutInfo] = useState<{ lockedUntil: Date | null; remainingAttempts: number }>({
    lockedUntil: null,
    remainingAttempts: 5
  });

  // Format remaining lockout time
  const formatLockoutTime = (lockedUntil: Date): string => {
    const now = new Date();
    const diff = lockedUntil.getTime() - now.getTime();
    if (diff <= 0) return "";
    const minutes = Math.ceil(diff / 60000);
    return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = authSchema.pick({ email: true, password: true }).safeParse(loginData);
      
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      // Check if login is allowed (not locked out)
      const { data: lockCheck, error: lockError } = await supabase.rpc('check_login_allowed', {
        p_email: loginData.email,
        p_ip: null
      });

      if (lockError) {
        console.warn("Error checking login status:", lockError);
        // Continue on error (fail-open)
      } else if (lockCheck && lockCheck.length > 0 && !lockCheck[0].allowed) {
        const lockedUntil = new Date(lockCheck[0].locked_until);
        setLockoutInfo({ lockedUntil, remainingAttempts: 0 });
        toast.error(`Conta bloqueada. Tente novamente em ${formatLockoutTime(lockedUntil)}.`, {
          duration: 5000,
        });
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        // Record failed attempt
        await supabase.rpc('record_login_attempt', {
          p_email: loginData.email,
          p_success: false,
          p_ip: null
        });

        // Update remaining attempts
        const { data: newLockCheck } = await supabase.rpc('check_login_allowed', {
          p_email: loginData.email,
          p_ip: null
        });

        if (newLockCheck && newLockCheck.length > 0) {
          const remaining = newLockCheck[0].remaining_attempts;
          setLockoutInfo({
            lockedUntil: newLockCheck[0].locked_until ? new Date(newLockCheck[0].locked_until) : null,
            remainingAttempts: remaining
          });

          if (!newLockCheck[0].allowed) {
            toast.error(`Conta bloqueada por 15 minutos após múltiplas tentativas.`, {
              duration: 5000,
            });
          } else if (remaining <= 2 && remaining > 0) {
            toast.error(`Email ou senha incorretos. ${remaining} tentativa${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''}.`);
          } else {
            toast.error("Email ou senha incorretos");
          }
        } else {
          toast.error("Email ou senha incorretos");
        }
        return;
      }

      // Record successful attempt
      await supabase.rpc('record_login_attempt', {
        p_email: loginData.email,
        p_success: true,
        p_ip: null
      });

      // Reset lockout info
      setLockoutInfo({ lockedUntil: null, remainingAttempts: 5 });

      if (data?.user) {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (roleData?.role === "barber") {
          navigate("/barbeiro-painel");
        } else {
          // Check activation status
          const { data: profile } = await supabase
            .from("profiles")
            .select("activation_completed")
            .eq("id", data.user.id)
            .single();

          if (!profile?.activation_completed) {
            navigate("/onboarding");
          } else {
            navigate("/painel");
          }
        }
        toast.success("Login realizado com sucesso!");
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const validation = authSchema.safeParse(signupData);
      
      if (!validation.success) {
        toast.error(validation.error.errors[0].message);
        return;
      }

      // Get device ID for anti-fraud tracking
      const deviceId = getDeviceId();

      // Step 1: Check IP + device eligibility before creating account (FREE plan only)
      const eligibilityResponse = await supabase.functions.invoke("check-ip-eligibility", {
        body: { device_id: deviceId },
      });
      
      if (eligibilityResponse.error) {
        console.error("Error checking eligibility:", eligibilityResponse.error);
        // Continue on error (fail-open)
      } else if (!eligibilityResponse.data?.allowed) {
        toast.error(eligibilityResponse.data?.message || "Não foi possível processar seu cadastro.", {
          duration: 6000,
        });
        return;
      }

      // Step 2: Create the user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        // Step 3: Create profile
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            full_name: signupData.fullName,
            barbershop_name: signupData.barbershopName,
            phone: signupData.telefone,
          });

        if (profileError) throw profileError;

        // Step 4: Register freemium subscription with IP + device tracking
        const freemiumResponse = await supabase.functions.invoke("register-freemium", {
          body: { userId: authData.user.id, device_id: deviceId },
        });

        if (freemiumResponse.error) {
          console.error("Error registering freemium:", freemiumResponse.error);
          // Don't block signup, just log the error
        } else if (!freemiumResponse.data?.success) {
          console.warn("Freemium registration warning:", freemiumResponse.data?.error);
        }

        toast.success("Conta criada com sucesso!", {
          description: "Você tem 30 dias de acesso gratuito.",
        });
        navigate("/onboarding");
      }
    } catch (error: any) {
      if (error.message?.includes("already registered")) {
        toast.error("Este email já está cadastrado");
      } else {
        toast.error(error.message || "Erro ao criar conta");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (resetData.password !== resetData.confirmPassword) {
        toast.error("As senhas não coincidem");
        return;
      }

      if (!validatePasswordStrength(resetData.password).isValid) {
        toast.error("A senha não atende aos requisitos mínimos de segurança");
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: resetData.password,
      });

      if (error) throw error;

      toast.success("Senha redefinida com sucesso!", {
        description: "Você já pode fazer login com sua nova senha.",
      });
      
      // Clear the reset mode and redirect to login
      navigate("/auth", { replace: true });
      setResetData({ password: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  // If in reset mode, show the password reset form
  if (isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-3 md:p-4">
        <Card className="w-full max-w-md border bg-card animate-fade-in">
          <CardHeader className="space-y-3 md:space-y-4 text-center px-4 md:px-6 pt-4 md:pt-6">
            <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-primary rounded-full flex items-center justify-center">
              <KeyRound className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl md:text-3xl">Redefinir Senha</CardTitle>
            <CardDescription className="text-sm md:text-base">
              Crie uma nova senha segura para sua conta
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-password">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="reset-password"
                    type={showResetPassword ? "text" : "password"}
                    placeholder="Crie uma senha forte"
                    value={resetData.password}
                    onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="text-sm md:text-base h-9 md:h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showResetPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showResetPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <PasswordStrengthIndicator 
                  password={resetData.password} 
                  onBreachCheck={setIsResetPasswordBreached}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-confirm-password">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="reset-confirm-password"
                    type={showResetConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={resetData.confirmPassword}
                    onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    className="text-sm md:text-base h-9 md:h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showResetConfirmPassword ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showResetConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {resetData.confirmPassword && resetData.password !== resetData.confirmPassword && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-9 md:h-10 text-sm md:text-base"
                disabled={
                  isLoading ||
                  !validatePasswordStrength(resetData.password).isValid ||
                  resetData.password !== resetData.confirmPassword ||
                  isResetPasswordBreached
                }
              >
                {isLoading ? "Salvando..." : "Salvar Nova Senha"}
              </Button>

              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => navigate("/auth", { replace: true })}
              >
                Voltar para login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-3 md:p-4">
      <PWAInstallPrompt />
      <Card className="w-full max-w-md border bg-card animate-fade-in">
        <CardHeader className="space-y-3 md:space-y-4 text-center px-4 md:px-6 pt-4 md:pt-6">
          <div className="mx-auto w-14 h-14 md:w-16 md:h-16 bg-primary rounded-full flex items-center justify-center">
            <Scissors className="w-7 h-7 md:w-8 md:h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl md:text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">GestBarber</CardTitle>
          <CardDescription className="text-sm md:text-base">Sistema completo de gestão para barbearias</CardDescription>
          <Button
            variant="link"
            onClick={() => navigate("/onboarding")}
            className="text-xs text-muted-foreground hover:text-primary"
          >
            Ver tutorial do sistema
          </Button>
        </CardHeader>
        <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-9 md:h-10">
              <TabsTrigger value="login" className="text-sm md:text-base">Login</TabsTrigger>
              <TabsTrigger value="cadastro" className="text-sm md:text-base">Cadastro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4" aria-label="Formulário de login">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                    disabled={isLoading}
                    className="text-sm md:text-base h-9 md:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      disabled={isLoading}
                      className="text-sm md:text-base h-9 md:h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showLoginPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Lockout warning */}
                {lockoutInfo.lockedUntil && lockoutInfo.lockedUntil > new Date() && (
                  <div className="flex items-start gap-2 p-2.5 bg-destructive/10 border border-destructive/20 rounded-md">
                    <Lock className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-destructive">
                        Conta temporariamente bloqueada
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Tente novamente em {formatLockoutTime(lockoutInfo.lockedUntil)}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Remaining attempts warning */}
                {!lockoutInfo.lockedUntil && lockoutInfo.remainingAttempts <= 2 && lockoutInfo.remainingAttempts > 0 && (
                  <p className="text-xs text-amber-600">
                    ⚠️ {lockoutInfo.remainingAttempts} tentativa{lockoutInfo.remainingAttempts !== 1 ? 's' : ''} restante{lockoutInfo.remainingAttempts !== 1 ? 's' : ''} antes do bloqueio
                  </p>
                )}

                <Button
                  type="button"
                  variant="link"
                  onClick={() => setIsForgotPasswordOpen(true)}
                  className="text-xs p-0 h-auto"
                >
                  Esqueceu sua senha?
                </Button>
                <Button 
                  type="submit" 
                  className="w-full h-9 md:h-10 text-sm md:text-base" 
                  disabled={isLoading || (lockoutInfo.lockedUntil !== null && lockoutInfo.lockedUntil > new Date())}
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="cadastro">
              <form onSubmit={handleSignup} className="space-y-3 md:space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nome Completo</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="João Silva"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                    disabled={isLoading}
                    className="text-sm md:text-base h-9 md:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-barbershop">Nome da Barbearia</Label>
                  <Input
                    id="signup-barbershop"
                    type="text"
                    placeholder="Barbearia do João"
                    value={signupData.barbershopName}
                    onChange={(e) => setSignupData({ ...signupData, barbershopName: e.target.value })}
                    required
                    disabled={isLoading}
                    className="text-sm md:text-base h-9 md:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-telefone">Telefone</Label>
                  <Input
                    id="signup-telefone"
                    type="tel"
                    placeholder="(11) 98765-4321"
                    value={signupData.telefone}
                    onChange={(e) => setSignupData({ ...signupData, telefone: e.target.value })}
                    required
                    disabled={isLoading}
                    className="text-sm md:text-base h-9 md:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                    disabled={isLoading}
                    className="text-sm md:text-base h-9 md:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-password"
                      type={showSignupPassword ? "text" : "password"}
                      placeholder="Crie uma senha forte"
                      value={signupData.password}
                      onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                      required
                      disabled={isLoading}
                      className="text-sm md:text-base h-9 md:h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label={showSignupPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                      {showSignupPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  <PasswordStrengthIndicator 
                    password={signupData.password} 
                    onBreachCheck={setIsPasswordBreached}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full h-9 md:h-10 text-sm md:text-base" 
                  disabled={isLoading || !validatePasswordStrength(signupData.password).isValid || isPasswordBreached}
                >
                  {isLoading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <ForgotPasswordDialog
        open={isForgotPasswordOpen}
        onOpenChange={setIsForgotPasswordOpen}
      />
    </div>
  );
};

export default Auth;
