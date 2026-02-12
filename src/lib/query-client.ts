import { QueryClient } from "@tanstack/react-query";

/**
 * QueryClient otimizado para performance mobile
 * - Cache agressivo para dados persistentes
 * - Retry inteligente
 * - Garbage collection otimizado
 * - Offline-first approach
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache por 10 minutos por padrão (reduz refetches)
      staleTime: 10 * 60 * 1000,
      // Manter no cache por 30 minutos
      gcTime: 30 * 60 * 1000,
      // Retry apenas 1 vez para respostas mais rápidas
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('auth')) {
          return false;
        }
        return failureCount < 1;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
      // Não refetch automaticamente (economia de requisições)
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: false,
      // Network mode para offline-first
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

// Keys de queries para persistência
const PERSIST_KEYS = ['barbers', 'services', 'products', 'dashboard-stats', 'barber-ranking'];
const CACHE_KEY = 'gestbarber-query-cache';
const CACHE_MAX_AGE = 30 * 60 * 1000; // 30 minutos

/**
 * Restaura cache do sessionStorage
 */
export function restoreQueryCache() {
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return;

    const { data, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    // Ignora cache muito antigo
    if (age > CACHE_MAX_AGE) {
      sessionStorage.removeItem(CACHE_KEY);
      return;
    }

    // Restaura dados no queryClient
    Object.entries(data).forEach(([key, value]) => {
      queryClient.setQueryData([key], value);
    });

    console.log('[Cache] Restored from sessionStorage');
  } catch (error) {
    console.warn('[Cache] Failed to restore:', error);
    sessionStorage.removeItem(CACHE_KEY);
  }
}

/**
 * Persiste cache no sessionStorage
 */
export function persistQueryCache() {
  try {
    const cache = queryClient.getQueryCache().getAll();
    const data: Record<string, unknown> = {};

    cache.forEach(query => {
      const key = query.queryKey[0];
      if (typeof key === 'string' && PERSIST_KEYS.includes(key) && query.state.data) {
        data[key] = query.state.data;
      }
    });

    if (Object.keys(data).length > 0) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now(),
      }));
    }
  } catch (error) {
    console.warn('[Cache] Failed to persist:', error);
  }
}

/**
 * Prefetch dados críticos do dashboard
 */
export const prefetchCriticalData = async () => {
  const cached = queryClient.getQueryData(['dashboard-stats']);
  if (!cached) {
    console.log('[Prefetch] Dashboard data will be loaded on demand');
  }
};

/**
 * Limpa todo o cache
 */
export const cleanupOldCache = () => {
  queryClient.clear();
  sessionStorage.removeItem(CACHE_KEY);
};

/**
 * Invalida queries relacionadas a uma entidade
 */
export const invalidateRelatedQueries = (entity: string) => {
  const relatedMap: Record<string, string[]> = {
    appointments: ['appointments', 'dashboard-stats', 'analytics-monthly', 'analytics-weekly', 'barber-appointments'],
    barbers: ['barbers', 'barber-ranking', 'barber-goals', 'barber-appointments'],
    services: ['services', 'appointments'],
    products: ['products', 'product-sales'],
    expenses: ['expenses', 'analytics-monthly'],
  };

  const queriesToInvalidate = relatedMap[entity] || [entity];
  queriesToInvalidate.forEach(key => {
    queryClient.invalidateQueries({ queryKey: [key] });
  });
};

/**
 * Atualização otimista para mutations
 */
export function optimisticUpdate<T>(
  queryKey: readonly unknown[],
  updater: (old: T | undefined) => T
) {
  queryClient.setQueryData(queryKey, updater);
}

/**
 * Restaura estado anterior em caso de erro
 */
export function rollbackUpdate<T>(
  queryKey: readonly unknown[],
  previousData: T
) {
  queryClient.setQueryData(queryKey, previousData);
}
