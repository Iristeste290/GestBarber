import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

// Mapa de rotas para preload
const ROUTE_PRELOAD_MAP: Record<string, string[]> = {
  '/auth': ['/painel', '/onboarding'],
  '/painel': ['/agenda', '/barbeiros', '/servicos'],
  '/agenda': ['/painel', '/barbeiros'],
  '/barbeiros': ['/painel', '/servicos'],
  '/servicos': ['/painel', '/barbeiros'],
  '/produtos': ['/painel'],
  '/pagamentos': ['/painel', '/caixa'],
  '/caixa': ['/painel', '/pagamentos'],
};

// Cache de módulos já carregados
const loadedModules = new Set<string>();

/**
 * Função para preload de módulo específico
 */
const preloadModule = async (path: string) => {
  if (loadedModules.has(path)) return;
  
  const moduleMap: Record<string, () => Promise<any>> = {
    '/painel': () => import('@/pages/Dashboard'),
    '/agenda': () => import('@/pages/Agenda'),
    '/barbeiros': () => import('@/pages/Barbeiros'),
    '/servicos': () => import('@/pages/Servicos'),
    '/produtos': () => import('@/pages/Products'),
    '/pagamentos': () => import('@/pages/Pagamentos'),
    '/caixa': () => import('@/pages/Caixa'),
    '/onboarding': () => import('@/pages/Onboarding'),
    '/auth': () => import('@/pages/Auth'),
    '/perfil': () => import('@/pages/Profile'),
    '/metas': () => import('@/pages/Metas'),
    '/custos': () => import('@/pages/Custos'),
    '/relatorios': () => import('@/pages/Relatorios'),
  };

  const loader = moduleMap[path];
  if (loader) {
    try {
      await loader();
      loadedModules.add(path);
    } catch (e) {
      // Ignora erros de preload
    }
  }
};

/**
 * Hook para preload inteligente de rotas
 * Carrega as próximas rotas prováveis baseado na rota atual
 */
export const useRoutePreloader = () => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    const routesToPreload = ROUTE_PRELOAD_MAP[currentPath];

    if (routesToPreload) {
      // Aguarda idle time antes de fazer preload
      const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 100));
      
      idleCallback(() => {
        routesToPreload.forEach((route, index) => {
          // Escalona os preloads para não sobrecarregar
          setTimeout(() => {
            preloadModule(route);
          }, index * 200);
        });
      });
    }
  }, [location.pathname]);
};

/**
 * Hook para preload baseado em hover de links
 */
export const useLinkPreloader = () => {
  const handleMouseEnter = useCallback((path: string) => {
    preloadModule(path);
  }, []);

  return { preloadOnHover: handleMouseEnter };
};

/**
 * Preload das rotas mais críticas no startup
 */
export const preloadCriticalRoutes = () => {
  // Usa requestIdleCallback para não bloquear
  const idleCallback = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
  
  idleCallback(() => {
    // Preload apenas as rotas mais usadas
    const criticalRoutes = ['/painel', '/agenda'];
    criticalRoutes.forEach((route, index) => {
      setTimeout(() => preloadModule(route), index * 500);
    });
  });
};

/**
 * Adiciona preconnect para recursos externos
 */
export const addResourceHints = () => {
  const hints = [
    { rel: 'preconnect', href: 'https://gufhndyzapnbpgikcvdb.supabase.co' },
    { rel: 'dns-prefetch', href: 'https://gufhndyzapnbpgikcvdb.supabase.co' },
  ];

  hints.forEach(({ rel, href }) => {
    if (!document.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;
      document.head.appendChild(link);
    }
  });
};
