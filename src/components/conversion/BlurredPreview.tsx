import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Lock, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { usePlanValidation } from "@/hooks/usePlanValidation";

interface BlurredPreviewProps {
  children: ReactNode;
  featureName: string;
  description: string;
  ctaText?: string;
}

export const BlurredPreview = ({
  children,
  featureName,
  description,
  ctaText = "Desbloquear",
}: BlurredPreviewProps) => {
  const navigate = useNavigate();
  const { isGrowth, loading } = usePlanValidation();

  // Se é Growth ou está carregando, mostra o conteúdo normal
  if (loading || isGrowth) {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-lg overflow-hidden">
      {/* Conteúdo borrado */}
      <div className="blur-sm opacity-60 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay com CTA */}
      <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
        <div className="text-center p-6 max-w-sm">
          <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-[#C9B27C]/20 flex items-center justify-center">
            <Lock className="h-7 w-7 text-[#C9B27C]" />
          </div>
          
          <h3 className="text-lg font-bold text-foreground mb-2">
            {featureName}
          </h3>
          
          <p className="text-sm text-muted-foreground mb-4">
            {description}
          </p>
          
          <Button
            onClick={() => navigate('/planos')}
            className="bg-[#C9B27C] hover:bg-[#C9B27C]/90 text-black font-medium"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            {ctaText} {featureName}
          </Button>
        </div>
      </div>
    </div>
  );
};
