import { useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Loader2 } from "lucide-react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { SupportGrowthGate } from "@/components/support/SupportGrowthGate";
import { GrowthSupportChat } from "@/components/support/GrowthSupportChat";
import { SupportUpsellModal } from "@/components/support/SupportUpsellModal";
import { useGrowthSupport } from "@/hooks/useGrowthSupport";

export default function Suporte() {
  const { loading: authLoading } = useRequireAuth("/auth");
  const { isGrowth, loading: planLoading } = usePlanValidation();
  const { logInteraction, shouldShowUpsell } = useGrowthSupport();

  // Log interaction for Start users
  useEffect(() => {
    if (!isGrowth && !planLoading) {
      logInteraction.mutate("support_click");
    }
  }, [isGrowth, planLoading]);

  if (authLoading || planLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  // Block access for Start users
  if (!isGrowth) {
    return (
      <AppLayout>
        <SupportGrowthGate />
        <SupportUpsellModal 
          open={shouldShowUpsell} 
          onOpenChange={() => {}} 
          trigger="support_click"
        />
      </AppLayout>
    );
  }

  // Growth users get the AI chat
  return (
    <AppLayout>
      <div className="h-[calc(100vh-4rem)]">
        <GrowthSupportChat />
      </div>
    </AppLayout>
  );
}
