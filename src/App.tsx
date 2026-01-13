import { Suspense, useEffect, lazy, memo } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import { ChatBot } from "@/components/chat/ChatBot";
import { GrowthTriggerProvider } from "@/components/upgrade/GrowthTriggerProvider";
import { queryClient, restoreQueryCache, persistQueryCache } from "@/lib/query-client";
import { preloadCriticalRoutes, addResourceHints, useRoutePreloader } from "@/lib/route-preloader";
import { SimplePageTransition } from "@/components/ui/page-transition";
import * as Pages from "./App.lazy";

// Public pages - loaded separately
const PublicAgenda = lazy(() => import("./pages/PublicAgenda"));
const PublicBarberSchedule = lazy(() => import("./pages/PublicBarberSchedule"));
const PublicBarberScheduleBySlug = lazy(() => import("./pages/PublicBarberScheduleBySlug"));
const BarberSitePage = lazy(() => import("./pages/BarberSitePage"));
const GoogleCallback = lazy(() => import("./pages/GoogleCallback"));

// Componente interno para preload de rotas
const RoutePreloader = memo(function RoutePreloader() {
  useRoutePreloader();
  return null;
});

// Memoized toast providers
const ToastProviders = memo(function ToastProviders() {
  return (
    <>
      <Toaster />
      <Sonner />
    </>
  );
});

const App = () => {
  // Register Service Worker e inicializações
  useEffect(() => {
    // Adiciona hints de recursos externos
    addResourceHints();
    
    // Restaura cache do sessionStorage
    restoreQueryCache();
    
    // Service Worker: desativado temporariamente para eliminar o redirect /auth -> /
    // (comportamento crítico observado em alguns navegadores quando o SW responde navegações).
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          registrations.forEach((reg) => reg.unregister());
        })
        .catch(() => {
          // ignore
        });
    }

    // Preload rotas críticas após hidratação
    const timeoutId = setTimeout(() => {
      preloadCriticalRoutes();
    }, 2000);

    // Persiste cache antes de sair
    const handleBeforeUnload = () => {
      persistQueryCache();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={300}>
          <ToastProviders />
          <BrowserRouter>
            <GrowthTriggerProvider>
              <ChatBot />
              <RoutePreloader />
              <Suspense fallback={<FullPageLoader text="Carregando..." />}>
                <SimplePageTransition>
                  <Routes>
                  <Route path="/" element={<Pages.Index />} />
                  <Route path="/auth" element={<Pages.Auth />} />
                  <Route path="/onboarding" element={<Pages.Onboarding />} />
                  <Route path="/google-callback" element={<GoogleCallback />} />
                  <Route path="/agenda-publica" element={<PublicAgenda />} />
                  <Route path="/agenda-publica/:barberId" element={<PublicBarberSchedule />} />
                  <Route path="/agenda/:slug" element={<PublicBarberScheduleBySlug />} />
                  <Route path="/b/:slug" element={<BarberSitePage />} />
                  <Route path="/b/:slug/:service" element={<BarberSitePage />} />
                  <Route path="/site/:slug" element={<BarberSitePage />} />
                  <Route path="/agenda" element={<Pages.Agenda />} />
                  <Route path="/painel" element={<Pages.Dashboard />} />
                  <Route path="/produtos" element={<Pages.Products />} />
                  <Route path="/servicos" element={<Pages.Servicos />} />
                  <Route path="/barbeiros" element={<Pages.Barbeiros />} />
                  <Route path="/metas" element={<Pages.Metas />} />
                  <Route path="/custos" element={<Pages.Custos />} />
                  <Route path="/relatorios" element={<Pages.Relatorios />} />
                  <Route path="/automacao" element={<Pages.Automacao />} />
                  <Route path="/posts-prontos" element={<Pages.PostsProntos />} />
                  <Route path="/pagamentos" element={<Pages.Pagamentos />} />
                  <Route path="/caixa" element={<Pages.Caixa />} />
                  <Route path="/configuracoes/whatsapp" element={<Pages.WhatsAppConfig />} />
                  <Route path="/perfil" element={<Pages.Profile />} />
                  <Route path="/planos" element={<Pages.Planos />} />
                  <Route path="/barbeiro-login" element={<Pages.BarberAuth />} />
                  <Route path="/barbeiro-painel" element={<Pages.BarberDashboard />} />
                  <Route path="/post/:id" element={<Pages.SharedPost />} />
                  <Route path="/fidelidade" element={<Pages.Fidelidade />} />
                  <Route path="/admin/fraude" element={<Pages.AdminFraudLogs />} />
                  <Route path="/admin/ajuda-stats" element={<Pages.AdminAjudaStats />} />
                  <Route path="/admin/waitlist" element={<Pages.AdminWaitlistStats />} />
                  <Route path="/admin/roles" element={<Pages.AdminUserRoles />} />
                  <Route path="/admin/feedbacks" element={<Pages.AdminTrialFeedback />} />
                  <Route path="/admin/pwa" element={<Pages.AdminPWAAnalytics />} />
                  <Route path="/admin/suporte" element={<Pages.AdminSupportQueue />} />
                  <Route path="/ajuda" element={<Pages.Ajuda />} />
                  <Route path="/suporte" element={<Pages.Suporte />} />
                  <Route path="/pagamento-sucesso" element={<Pages.PaymentSuccess />} />
                  <Route path="/acesso-negado" element={<Pages.AccessDenied />} />
                  <Route path="/assinatura-expirada" element={<Pages.SubscriptionExpired />} />
                  <Route path="/feedback-trial" element={<Pages.TrialFeedback />} />
                  <Route path="/growth-engine" element={<Pages.GrowthEngine />} />
                  <Route path="/upgrade" element={<Pages.Upgrade />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<Pages.NotFound />} />
                  </Routes>
                </SimplePageTransition>
              </Suspense>
            </GrowthTriggerProvider>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
