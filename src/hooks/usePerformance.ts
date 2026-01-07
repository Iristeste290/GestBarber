import { useCallback, useMemo, useRef, useEffect } from 'react';

// Cache para formatadores - evita recriar Intl objects
const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
});

const dateFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
});

const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
});

// Hook para formatação otimizada com cache
export const useFormatters = () => {
  const formatCurrency = useCallback((value: number) => {
    return currencyFormatter.format(value);
  }, []);

  const formatDate = useCallback((date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return dateFormatter.format(d);
  }, []);

  const formatDateTime = useCallback((date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return dateTimeFormatter.format(d);
  }, []);

  return { formatCurrency, formatDate, formatDateTime };
};

// Hook para debounce otimizado
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

// Hook para throttle otimizado
export const useThrottle = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) => {
  const lastRun = useRef(Date.now());

  return useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastRun.current >= delay) {
        lastRun.current = now;
        callback(...args);
      }
    },
    [callback, delay]
  );
};

// Hook para lazy loading de dados
export const useLazyData = <T>(
  data: T[],
  itemsPerPage: number = 20
) => {
  const visibleItems = useMemo(() => {
    return data.slice(0, itemsPerPage);
  }, [data, itemsPerPage]);

  const hasMore = data.length > itemsPerPage;

  return { visibleItems, hasMore, totalCount: data.length };
};

// Hook para intersection observer (lazy loading)
export const useIntersectionObserver = (
  callback: () => void,
  options?: IntersectionObserverInit
) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          callback();
        }
      },
      { threshold: 0.1, ...options }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [callback, options]);

  return ref;
};

// Utilitário para memoização profunda
export const useDeepMemo = <T>(value: T, deps: React.DependencyList): T => {
  const ref = useRef<T>(value);
  const depsRef = useRef<React.DependencyList>(deps);

  const depsChanged = deps.some((dep, i) => dep !== depsRef.current[i]);

  if (depsChanged) {
    ref.current = value;
    depsRef.current = deps;
  }

  return ref.current;
};
