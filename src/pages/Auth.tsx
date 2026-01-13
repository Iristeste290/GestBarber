import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { 
  Scissors, 
  Eye, 
  EyeOff, 
  KeyRound, 
  Lock, 
  CalendarCheck, 
  Users, 
  BarChart3, 
  Sparkles,
  CheckCircle2
} from "lucide-react";
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

const valueProps = [
  { icon: CalendarCheck, text: "Agenda cheia automaticamente" },
  { icon: Users, text: "Clientes que voltam sozinhos" },
  { icon: BarChart3, text: "Decisões baseadas em números" },
  { icon: Sparkles, text: "Growth Engine que trabalha por você" },
];

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

      const { data: lockCheck, error: lockError } = await supabase.rpc('check_login_allowed', {
        p_email: loginData.email,
        p_ip: null
      });

      if (lockError) {
        console.warn("Error checking login status:", lockError);
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
        await supabase.rpc('record_login_attempt', {
          p_email: loginData.email,
          p_success: false,
          p_ip: null
        });

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

      await supabase.rpc('record_login_attempt', {
        p_email: loginData.email,
        p_success: true,
        p_ip: null
      });

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

      const deviceId = getDeviceId();

      const eligibilityResponse = await supabase.functions.invoke("check-ip-eligibility", {
        body: { device_id: deviceId },
      });
      
      if (eligibilityResponse.error) {
        console.error("Error checking eligibility:", eligibilityResponse.error);
      } else if (!eligibilityResponse.data?.allowed) {
        toast.error(eligibilityResponse.data?.message || "Não foi possível processar seu cadastro.", {
          duration: 6000,
        });
        return;
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (signUpError) throw signUpError;

      if (authData.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            full_name: signupData.fullName,
            barbershop_name: signupData.barbershopName,
            phone: signupData.telefone,
          });

        if (profileError) throw profileError;

        const freemiumResponse = await supabase.functions.invoke("register-freemium", {
          body: { userId: authData.user.id, device_id: deviceId },
        });

        if (freemiumResponse.error) {
          console.error("Error registering freemium:", freemiumResponse.error);
        } else if (!freemiumResponse.data?.success) {
          console.warn("Freemium registration warning:", freemiumResponse.data?.error);
        }

        toast.success("Conta criada com sucesso!", {
          description: "Vamos configurar sua barbearia.",
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
      
      navigate("/auth", { replace: true });
      setResetData({ password: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setIsLoading(false);
    }
  };

  // Password reset mode
  if (isResetMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4">
        <Card className="w-full max-w-md border-primary/20 bg-[#111111]">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <KeyRound className="w-8 h-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-[#EDEDED]">Redefinir Senha</h1>
              <p className="text-muted-foreground">Crie uma nova senha segura para sua conta</p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-password" className="text-[#EDEDED]">Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="reset-password"
                    type={showResetPassword ? "text" : "password"}
                    placeholder="Crie uma senha forte"
                    value={resetData.password}
                    onChange={(e) => setResetData({ ...resetData, password: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11 bg-[#1a1a1a] border-[#333] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetPassword(!showResetPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={resetData.password} onBreachCheck={setIsResetPasswordBreached} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-confirm-password" className="text-[#EDEDED]">Confirmar Nova Senha</Label>
                <div className="relative">
                  <Input
                    id="reset-confirm-password"
                    type={showResetConfirmPassword ? "text" : "password"}
                    placeholder="Confirme sua nova senha"
                    value={resetData.confirmPassword}
                    onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                    required
                    disabled={isLoading}
                    className="h-11 bg-[#1a1a1a] border-[#333] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showResetConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {resetData.confirmPassword && resetData.password !== resetData.confirmPassword && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-primary hover:bg-primary/90"
                disabled={isLoading || !validatePasswordStrength(resetData.password).isValid || resetData.password !== resetData.confirmPassword || isResetPasswordBreached}
              >
                {isLoading ? "Salvando..." : "Salvar Nova Senha"}
              </Button>

              <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/auth", { replace: true })}>
                Voltar para login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex">
      <PWAInstallPrompt />

      {/* Left side - Value proposition (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12 xl:p-16 bg-gradient-to-br from-primary/10 via-[#0A0A0A] to-[#0A0A0A] relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        
        <div className="relative z-10 max-w-lg">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <Scissors className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-primary">GestBarber</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl xl:text-4xl font-bold text-[#EDEDED] leading-tight mb-4">
            Você não precisa de mais um{" "}
            <span className="text-muted-foreground">app de agenda</span>.
          </h1>

          <p className="text-lg text-muted-foreground mb-10">
            O GestBarber mostra onde sua barbearia está{" "}
            <span className="text-destructive font-medium">perdendo dinheiro</span>{" "}
            — e como{" "}
            <span className="text-primary font-medium">ganhar mais</span>.
          </p>

          {/* Value props */}
          <ul className="space-y-4">
            {valueProps.map((prop, idx) => (
              <li key={idx} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <prop.icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-[#EDEDED]">{prop.text}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="mt-12 p-4 rounded-xl bg-[#111111] border border-primary/20">
            <p className="text-sm text-muted-foreground">
              Barbearias que usam o GestBarber faturam em média{" "}
              <span className="text-primary font-semibold">+30%</span>{" "}
              nos primeiros meses.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center mb-8">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center mb-3">
              <Scissors className="w-7 h-7 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">GestBarber</span>
          </div>

          <Card className="border-primary/20 bg-[#111111]">
            <CardContent className="p-6 md:p-8">
              {/* Plan badge */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">Plano Start: grátis para sempre</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Sem cartão de crédito</p>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-11 bg-[#1a1a1a]">
                  <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Entrar
                  </TabsTrigger>
                  <TabsTrigger value="cadastro" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                    Criar conta
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="mt-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-[#EDEDED]">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-11 bg-[#1a1a1a] border-[#333]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-[#EDEDED]">Senha</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          required
                          disabled={isLoading}
                          className="h-11 bg-[#1a1a1a] border-[#333] pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {lockoutInfo.lockedUntil && lockoutInfo.lockedUntil > new Date() && (
                      <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                        <Lock className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-medium text-destructive">Conta temporariamente bloqueada</p>
                          <p className="text-xs text-muted-foreground">Tente novamente em {formatLockoutTime(lockoutInfo.lockedUntil)}.</p>
                        </div>
                      </div>
                    )}

                    {!lockoutInfo.lockedUntil && lockoutInfo.remainingAttempts <= 2 && lockoutInfo.remainingAttempts > 0 && (
                      <p className="text-xs text-amber-600">
                        ⚠️ {lockoutInfo.remainingAttempts} tentativa{lockoutInfo.remainingAttempts !== 1 ? 's' : ''} restante{lockoutInfo.remainingAttempts !== 1 ? 's' : ''} antes do bloqueio
                      </p>
                    )}

                    <Button type="button" variant="link" onClick={() => setIsForgotPasswordOpen(true)} className="text-xs p-0 h-auto text-muted-foreground hover:text-primary">
                      Esqueceu sua senha?
                    </Button>

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold" 
                      disabled={isLoading || (lockoutInfo.lockedUntil !== null && lockoutInfo.lockedUntil > new Date())}
                    >
                      {isLoading ? "Entrando..." : "Entrar"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="cadastro" className="mt-6">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="text-[#EDEDED]">Seu nome</Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="João Silva"
                          value={signupData.fullName}
                          onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                          required
                          disabled={isLoading}
                          className="h-11 bg-[#1a1a1a] border-[#333]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-telefone" className="text-[#EDEDED]">Telefone</Label>
                        <Input
                          id="signup-telefone"
                          type="tel"
                          placeholder="(11) 98765-4321"
                          value={signupData.telefone}
                          onChange={(e) => setSignupData({ ...signupData, telefone: e.target.value })}
                          required
                          disabled={isLoading}
                          className="h-11 bg-[#1a1a1a] border-[#333]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-barbershop" className="text-[#EDEDED]">Nome da Barbearia</Label>
                      <Input
                        id="signup-barbershop"
                        type="text"
                        placeholder="Barbearia do João"
                        value={signupData.barbershopName}
                        onChange={(e) => setSignupData({ ...signupData, barbershopName: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-11 bg-[#1a1a1a] border-[#333]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-[#EDEDED]">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        required
                        disabled={isLoading}
                        className="h-11 bg-[#1a1a1a] border-[#333]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-[#EDEDED]">Senha</Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showSignupPassword ? "text" : "password"}
                          placeholder="Crie uma senha forte"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          required
                          disabled={isLoading}
                          className="h-11 bg-[#1a1a1a] border-[#333] pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showSignupPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <PasswordStrengthIndicator password={signupData.password} onBreachCheck={setIsPasswordBreached} />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full h-11 bg-primary hover:bg-primary/90 font-semibold" 
                      disabled={isLoading || !validatePasswordStrength(signupData.password).isValid || isPasswordBreached}
                    >
                      {isLoading ? "Criando conta..." : "Criar Conta Grátis"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              {/* Psychological trigger */}
              <p className="text-center text-xs text-muted-foreground mt-6">
                Você pode usar gratuitamente. Só faz upgrade quando fizer sentido.
              </p>
            </CardContent>
          </Card>

          {/* Mobile social proof */}
          <div className="lg:hidden mt-6 p-4 rounded-xl bg-[#111111] border border-primary/20">
            <p className="text-xs text-muted-foreground text-center">
              Barbearias que usam o GestBarber faturam em média{" "}
              <span className="text-primary font-semibold">+30%</span>{" "}
              nos primeiros meses.
            </p>
          </div>
        </div>
      </div>

      <ForgotPasswordDialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen} />
    </div>
  );
};

export default Auth;
