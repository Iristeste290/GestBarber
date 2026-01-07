import { supabase } from "@/integrations/supabase/client";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";

// Cache do usuário atual para evitar chamadas repetidas
let cachedUser: { id: string; email?: string } | null = null;
let userCacheTime = 0;
const USER_CACHE_TTL = 60000; // 1 minuto

/**
 * Obtém o usuário atual com cache para evitar chamadas repetidas
 */
export async function getCurrentUser() {
  const now = Date.now();
  
  // Retorna cache se ainda válido
  if (cachedUser && (now - userCacheTime) < USER_CACHE_TTL) {
    return cachedUser;
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    cachedUser = null;
    return null;
  }

  cachedUser = { id: user.id, email: user.email };
  userCacheTime = now;
  return cachedUser;
}

/**
 * Limpa o cache do usuário (usar no logout)
 */
export function clearUserCache() {
  cachedUser = null;
  userCacheTime = 0;
}

// Cache de barbeiros por usuário
const barberIdsCache = new Map<string, { ids: string[]; time: number }>();
const BARBER_CACHE_TTL = 120000; // 2 minutos

/**
 * Obtém os IDs dos barbeiros do usuário com cache
 */
export async function getUserBarberIds(userId: string): Promise<string[]> {
  const now = Date.now();
  const cached = barberIdsCache.get(userId);
  
  if (cached && (now - cached.time) < BARBER_CACHE_TTL) {
    return cached.ids;
  }

  const { data, error } = await supabase
    .from("barbers")
    .select("id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching barber IDs:", error);
    return [];
  }

  const ids = data?.map(b => b.id) || [];
  barberIdsCache.set(userId, { ids, time: now });
  return ids;
}

/**
 * Limpa cache de barbeiros
 */
export function clearBarberCache(userId?: string) {
  if (userId) {
    barberIdsCache.delete(userId);
  } else {
    barberIdsCache.clear();
  }
}

/**
 * Query com timeout e abort controller
 */
export async function queryWithTimeout<T>(
  queryFn: () => Promise<T>,
  timeoutMs: number = 10000
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const result = await Promise.race([
      queryFn(),
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(new Error('Query timeout'));
        });
      })
    ]);
    clearTimeout(timeoutId);
    return result;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Batch de queries em paralelo com limite de concorrência
 */
export async function batchQueries<T>(
  queries: (() => Promise<T>)[],
  concurrency: number = 3
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < queries.length; i += concurrency) {
    const batch = queries.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn => fn()));
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Select otimizado - apenas colunas necessárias
 */
export const optimizedSelects = {
  // Appointments - dados mínimos para listagem
  appointmentsList: `
    id,
    appointment_date,
    appointment_time,
    status,
    customer_name,
    duration_minutes,
    barber:barbers(name),
    service:services(name, price, duration_minutes)
  `,
  
  // Appointments - dados completos para detalhes
  appointmentDetails: `
    *,
    barber:barbers(id, name, avatar_url),
    service:services(id, name, price, duration_minutes),
    profile:profiles(full_name, phone)
  `,
  
  // Barbeiros - listagem
  barbersList: `id, name, avatar_url, is_active, specialty, commission_percentage, slug`,
  
  // Serviços - listagem
  servicesList: `id, name, price, duration_minutes, is_active, description`,
  
  // Produtos - listagem
  productsList: `id, name, price, stock_quantity, min_stock_level, is_active`,
  
  // Stats - apenas preços
  appointmentsStats: `id, services(price)`,
  
  // Vendas - listagem
  salesList: `id, sale_date, quantity, unit_price, total_price, products(name), barbers(name)`,
};

/**
 * Helper para criar filtros de data
 */
export function dateFilters(startDate: Date, endDate: Date) {
  return {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0],
  };
}

/**
 * Query keys padronizados para consistência de cache
 */
export const queryKeys = {
  // Dashboard
  dashboardStats: (date: string) => ['dashboard-stats', date] as const,
  barberRanking: (month: string) => ['barber-ranking', month] as const,
  
  // Analytics
  analyticsMonthly: () => ['analytics-monthly'] as const,
  analyticsWeekly: () => ['analytics-weekly'] as const,
  analyticsPeakHours: () => ['analytics-peak-hours'] as const,
  analyticsHistorical: () => ['analytics-historical'] as const,
  
  // Entities
  barbers: (userId?: string) => userId ? ['barbers', userId] : ['barbers'] as const,
  services: (userId?: string) => userId ? ['services', userId] : ['services'] as const,
  products: (userId?: string) => userId ? ['products', userId] : ['products'] as const,
  expenses: (userId?: string) => userId ? ['expenses', userId] : ['expenses'] as const,
  payments: (userId?: string) => userId ? ['payments', userId] : ['payments'] as const,
  
  // Barber specific
  barberGoals: (barberId: string) => ['barber-goals', barberId] as const,
  barberAppointments: (barberId: string, date: string) => ['barber-appointments', barberId, date] as const,
  barberCommissions: (barberId: string) => ['barber-commissions', barberId] as const,
  
  // Appointments
  appointments: (filters?: { date?: string; barberId?: string }) => 
    ['appointments', filters] as const,
  
  // Posts
  generatedPosts: () => ['generated-posts'] as const,
  
  // Cash
  cashSession: (userId?: string) => ['cash-session', userId] as const,
  cashHistory: (sessionId?: string) => ['cash-history', sessionId] as const,
};

/**
 * Stale times padronizados
 */
export const staleTimes = {
  // Dados que mudam frequentemente
  realtime: 10000,        // 10 segundos
  frequent: 30000,        // 30 segundos
  
  // Dados moderados
  moderate: 60000,        // 1 minuto
  standard: 120000,       // 2 minutos
  
  // Dados estáveis
  stable: 300000,         // 5 minutos
  veryStable: 600000,     // 10 minutos
  
  // Dados raramente alterados
  static: 1800000,        // 30 minutos
};

/**
 * Erro handler padronizado para queries
 */
export function handleQueryError(error: unknown, context: string): never {
  console.error(`[Supabase Query Error] ${context}:`, error);
  
  if (error instanceof Error) {
    if (error.message.includes('timeout')) {
      throw new Error('A requisição demorou muito. Tente novamente.');
    }
    if (error.message.includes('network')) {
      throw new Error('Erro de conexão. Verifique sua internet.');
    }
  }
  
  throw error;
}
