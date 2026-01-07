import { ReactNode, useState, useEffect, memo, useMemo } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { useUserProfile } from "@/hooks/useUserProfile";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { useUpcomingAppointmentsNotifier } from "@/hooks/useUpcomingAppointmentsNotifier";
import { usePlanValidation } from "@/hooks/usePlanValidation";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

// Memoized header component
const AppHeader = memo(function AppHeader({ 
  title, 
  barbershopName,
  userId
}: { 
  title?: string; 
  barbershopName?: string;
  userId?: string;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-14 md:h-16 items-center gap-2 md:gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-3 md:px-4">
      <SidebarTrigger className="min-h-[44px] min-w-[44px]" />
      <Separator orientation="vertical" className="h-6" />
      <div className="flex-1 min-w-0">
        {title && (
          <div>
            <h1 className="text-base md:text-lg font-bold text-foreground truncate">
              {title}
            </h1>
            {barbershopName && (
              <p className="text-xs text-muted-foreground truncate hidden sm:block">
                {barbershopName}
              </p>
            )}
          </div>
        )}
      </div>
      {userId && <NotificationBell userId={userId} />}
    </header>
  );
});

export const AppLayout = memo(function AppLayout({ children, title, description }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const { profile } = useUserProfile(user);
  const { userPlan, loading: planLoading, isFreemium } = usePlanValidation();

  // Hook para notificações de agendamentos próximos
  useUpcomingAppointmentsNotifier(user?.id);

  // Redirecionar para feedback/assinatura expirada se o plano expirou
  useEffect(() => {
    const checkAndRedirect = async () => {
      if (!planLoading && userPlan?.isExpired && user) {
        // Não redirecionar se já estiver em páginas permitidas
        const allowedPaths = ['/assinatura-expirada', '/planos', '/pagamento-sucesso', '/feedback-trial'];
        if (allowedPaths.includes(location.pathname)) return;

        // Verificar se já deu feedback (para todos os usuários)
        const { data: feedback } = await supabase
          .from('trial_feedback')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)
          .maybeSingle();

        if (feedback) {
          // Já deu feedback, vai direto para assinatura expirada
          navigate('/assinatura-expirada');
        } else {
          // Ainda não deu feedback, vai para o formulário
          navigate('/feedback-trial');
        }
      }
    };

    checkAndRedirect();
  }, [planLoading, userPlan?.isExpired, location.pathname, navigate, user]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const barbershopName = useMemo(() => profile?.barbershop_name, [profile?.barbershop_name]);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col w-full min-w-0 contain-layout">
          <AppHeader title={title} barbershopName={barbershopName} userId={user?.id} />
          <main className="flex-1 overflow-auto w-full">
            <div className="p-3 sm:p-4 md:p-6">
              {description && (
                <p className="text-xs sm:text-sm text-muted-foreground mb-3 md:mb-4">
                  {description}
                </p>
              )}
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
});
