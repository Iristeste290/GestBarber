import React, { memo, useCallback, useMemo, useRef, useEffect, useState } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  maxHeight?: number;
  className?: string;
  emptyMessage?: string;
  overscanCount?: number;
}

/**
 * Lista virtualizada otimizada para performance mobile
 * Renderiza apenas os itens visíveis + buffer para scroll suave
 */
export const VirtualizedList = memo(function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  maxHeight = 500,
  className = '',
  emptyMessage = 'Nenhum item encontrado',
  overscanCount = 3
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(maxHeight);

  // Calculate visible items
  const { startIndex, endIndex, visibleItems, totalHeight, offsetY } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscanCount);
    const endIndex = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscanCount
    );
    
    const visibleItems = items.slice(startIndex, endIndex);
    const offsetY = startIndex * itemHeight;

    return { startIndex, endIndex, visibleItems, totalHeight, offsetY };
  }, [items, itemHeight, containerHeight, scrollTop, overscanCount]);

  // Handle scroll with throttle
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
      setScrollTop(target.scrollTop);
    });
  }, []);

  // Observe container height
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect?.height;
      if (height) {
        setContainerHeight(height);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  // For small lists (< 15 items), render without virtualization
  if (items.length <= 15) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={index} className="contain-layout">
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto scrollbar-thin ${className}`}
      style={{ maxHeight, WebkitOverflowScrolling: 'touch' }}
      onScroll={handleScroll}
    >
      <div 
        style={{ 
          height: totalHeight, 
          position: 'relative',
          contain: 'strict'
        }}
      >
        <div 
          style={{ 
            transform: `translateY(${offsetY}px)`,
            willChange: 'transform'
          }}
        >
          {visibleItems.map((item, index) => (
            <div 
              key={startIndex + index} 
              style={{ height: itemHeight }}
              className="contain-layout"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}) as <T>(props: VirtualizedListProps<T>) => React.ReactElement;

/**
 * Hook para aplicar lazy loading em listas
 */
export function useLazyList<T>(items: T[], initialCount = 20, loadMoreCount = 10) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  
  const visibleItems = useMemo(() => {
    return items.slice(0, visibleCount);
  }, [items, visibleCount]);

  const hasMore = visibleCount < items.length;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setVisibleCount(prev => Math.min(prev + loadMoreCount, items.length));
    }
  }, [hasMore, loadMoreCount, items.length]);

  // Reset when items change
  useEffect(() => {
    setVisibleCount(initialCount);
  }, [items.length, initialCount]);

  return { visibleItems, hasMore, loadMore, totalCount: items.length };
}

/**
 * Componente de scroll infinito
 */
export const InfiniteScrollTrigger = memo(function InfiniteScrollTrigger({
  onLoadMore,
  hasMore,
  children
}: {
  onLoadMore: () => void;
  hasMore: boolean;
  children?: React.ReactNode;
}) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || !triggerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '50px', threshold: 0.1 }
    );

    observer.observe(triggerRef.current);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (!hasMore) return null;

  return (
    <div ref={triggerRef} className="py-3 text-center">
      {children || (
        <span className="text-muted-foreground text-sm">Carregando mais...</span>
      )}
    </div>
  );
});
