import { memo } from "react";
import { LoadingSpinner } from "./loading-spinner";

interface FullPageLoaderProps {
  text?: string;
}

export const FullPageLoader = memo(function FullPageLoader({ 
  text = "Carregando..." 
}: FullPageLoaderProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
});
