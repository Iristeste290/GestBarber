import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Zap, Gift, Star, Rocket } from "lucide-react";

interface FeatureAnnouncement {
  id: string;
  title: string;
  description: string;
  icon: string;
  is_premium_only: boolean;
  created_at: string;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  crown: Crown,
  sparkles: Sparkles,
  zap: Zap,
  gift: Gift,
  star: Star,
  rocket: Rocket,
};

export const PremiumFeatureAnnouncements = () => {
  const { isGrowth, userPlan, loading } = usePlanValidation();
  const [announcements, setAnnouncements] = useState<FeatureAnnouncement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (loading || !userPlan) return;

    const fetchUnviewedAnnouncements = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Buscar anúncios não visualizados
      const { data: allAnnouncements, error: announcementsError } = await supabase
        .from("feature_announcements")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (announcementsError || !allAnnouncements) return;

      // Buscar visualizações do usuário
      const { data: views } = await supabase
        .from("feature_announcement_views")
        .select("announcement_id")
        .eq("user_id", user.id);

      const viewedIds = new Set(views?.map(v => v.announcement_id) || []);

      // Filtrar anúncios não vistos
      const unviewed = allAnnouncements.filter(a => {
        // Se é premium_only, só mostrar para Growth
        if (a.is_premium_only && !isGrowth) return false;
        // Se já foi visto, não mostrar
        if (viewedIds.has(a.id)) return false;
        return true;
      });

      if (unviewed.length > 0) {
        setAnnouncements(unviewed);
        setIsOpen(true);
      }
    };

    fetchUnviewedAnnouncements();
  }, [loading, userPlan, isGrowth]);

  const markAsViewed = async (announcementId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("feature_announcement_views")
      .insert({
        user_id: user.id,
        announcement_id: announcementId,
      });
  };

  const handleNext = async () => {
    const current = announcements[currentIndex];
    await markAsViewed(current.id);

    if (currentIndex < announcements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsOpen(false);
      setCurrentIndex(0);
    }
  };

  const handleClose = async () => {
    // Marcar todos como vistos ao fechar
    for (const announcement of announcements) {
      await markAsViewed(announcement.id);
    }
    setIsOpen(false);
  };

  if (announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const IconComponent = iconMap[current.icon] || Sparkles;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-gradient-to-r from-amber-500 to-amber-600">
              <Crown className="w-3 h-3 mr-1" />
              Novidade Growth
            </Badge>
            {announcements.length > 1 && (
              <Badge variant="outline">
                {currentIndex + 1} de {announcements.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-white" />
            </div>
            <DialogTitle className="text-xl">{current.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            {current.description}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-4">
          {announcements.length > 1 && currentIndex < announcements.length - 1 ? (
            <>
              <Button variant="ghost" onClick={handleClose}>
                Fechar tudo
              </Button>
              <Button onClick={handleNext}>
                Próximo
              </Button>
            </>
          ) : (
            <Button onClick={handleNext}>
              Entendi!
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
