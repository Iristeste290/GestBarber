import React, { memo, useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  fallback?: string;
  className?: string;
  containerClassName?: string;
  lazy?: boolean;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallback = '/placeholder.svg',
  className = '',
  containerClassName = '',
  lazy = true,
  ...props
}: OptimizedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lazy || isInView) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '50px', threshold: 0.01 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [lazy, isInView]);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  const imageSrc = hasError ? fallback : src;

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-hidden contain-content', containerClassName)}
    >
      {isInView && (
        <img
          src={imageSrc}
          alt={alt}
          loading={lazy ? 'lazy' : undefined}
          decoding="async"
          onError={handleError}
          className={className}
          {...props}
        />
      )}
    </div>
  );
});

// Avatar optimized component
interface OptimizedAvatarProps {
  src?: string | null;
  alt: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base'
};

export const OptimizedAvatar = memo(function OptimizedAvatar({
  src,
  alt,
  fallbackText,
  size = 'md',
  className = ''
}: OptimizedAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const showFallback = !src || hasError;
  const initials = fallbackText?.charAt(0)?.toUpperCase() || alt?.charAt(0)?.toUpperCase() || '?';

  return (
    <div 
      className={cn(
        'relative rounded-full overflow-hidden bg-muted flex items-center justify-center flex-shrink-0',
        sizeClasses[size],
        className
      )}
    >
      {!showFallback ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onError={() => setHasError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="flex items-center justify-center bg-primary/10 text-primary font-medium w-full h-full">
          {initials}
        </span>
      )}
    </div>
  );
});
