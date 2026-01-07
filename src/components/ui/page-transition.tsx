import { useEffect, useState, useRef, memo } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = memo(function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    // Skip transition on initial render
    if (prevPathRef.current === location.pathname) {
      return;
    }

    // Start exit animation
    setIsTransitioning(true);

    // After exit animation, update content and start enter animation
    const timeout = setTimeout(() => {
      setDisplayChildren(children);
      prevPathRef.current = location.pathname;
      
      // Small delay to ensure DOM update before enter animation
      requestAnimationFrame(() => {
        setIsTransitioning(false);
      });
    }, 150); // Match exit animation duration

    return () => clearTimeout(timeout);
  }, [location.pathname, children]);

  return (
    <div
      className={`page-transition ${isTransitioning ? 'page-exit' : 'page-enter'}`}
      style={{ minHeight: '100%' }}
    >
      {displayChildren}
    </div>
  );
});

// Simpler version without exit animation for faster perceived performance
export const SimplePageTransition = memo(function SimplePageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [isEntering, setIsEntering] = useState(true);

  useEffect(() => {
    setIsEntering(true);
    const timeout = setTimeout(() => setIsEntering(false), 200);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <div
      className={isEntering ? 'page-fade-in' : ''}
      style={{ minHeight: '100%' }}
    >
      {children}
    </div>
  );
});
