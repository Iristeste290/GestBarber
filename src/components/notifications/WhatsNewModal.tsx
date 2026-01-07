import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Crown, 
  Sparkles, 
  Zap, 
  Gift, 
  Star, 
  Rocket,
  Bell,
  CheckCircle,
  ArrowRight,
  PartyPopper
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface FeatureAnnouncement {
  id: string;
  title: string;
  description: string;
  icon: string | null;
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
  bell: Bell,
  check: CheckCircle,
  party: PartyPopper,
};

export const WhatsNewModal = () => {
  const [announcements, setAnnouncements] = useState<FeatureAnnouncement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUnviewedAnnouncements = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        // Buscar anúncios ativos
        const { data: allAnnouncements, error: announcementsError } = await supabase
          .from("feature_announcements")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (announcementsError || !allAnnouncements) {
          setIsLoading(false);
          return;
        }

        // Buscar visualizações do usuário
        const { data: views } = await supabase
          .from("feature_announcement_views")
          .select("announcement_id")
          .eq("user_id", user.id);

        const viewedIds = new Set(views?.map(v => v.announcement_id) || []);

        // Filtrar anúncios não vistos
        const unviewed = allAnnouncements.filter(a => !viewedIds.has(a.id));

        if (unviewed.length > 0) {
          setAnnouncements(unviewed);
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Error fetching announcements:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUnviewedAnnouncements();
  }, []);

  const markAsViewed = async (announcementId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("feature_announcement_views")
      .upsert({
        user_id: user.id,
        announcement_id: announcementId,
      }, { onConflict: "user_id,announcement_id" });
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

  const handleMarkAllAsViewed = async () => {
    for (const announcement of announcements) {
      await markAsViewed(announcement.id);
    }
    setIsOpen(false);
  };

  if (isLoading || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const IconComponent = iconMap[current.icon || "sparkles"] || Sparkles;
  const isLastAnnouncement = currentIndex === announcements.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleMarkAllAsViewed()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 text-primary-foreground">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-0">
              <Sparkles className="w-3 h-3 mr-1" />
              Novidades
            </Badge>
            {announcements.length > 1 && (
              <Badge variant="secondary" className="bg-white/20 text-white border-0">
                {currentIndex + 1} de {announcements.length}
              </Badge>
            )}
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
              <IconComponent className="w-7 h-7 text-white" />
            </div>
            <div>
              <DialogHeader className="text-left">
                <DialogTitle className="text-xl text-white">
                  {current.title}
                </DialogTitle>
                <p className="text-xs text-white/70 mt-1">
                  {formatDistanceToNow(new Date(current.created_at), { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              </DialogHeader>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <ScrollArea className="max-h-[200px]">
            <DialogDescription className="text-base text-foreground leading-relaxed">
              {current.description}
            </DialogDescription>
          </ScrollArea>

          {current.is_premium_only && (
            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <Crown className="w-4 h-4" />
                <span className="text-sm font-medium">Recurso Premium</span>
              </div>
            </div>
          )}

          {/* Progress dots */}
          {announcements.length > 1 && (
            <div className="flex justify-center gap-1.5 mt-6">
              {announcements.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex 
                      ? "w-6 bg-primary" 
                      : idx < currentIndex 
                        ? "w-1.5 bg-primary/50" 
                        : "w-1.5 bg-muted"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t">
            {announcements.length > 1 && !isLastAnnouncement ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleMarkAllAsViewed}
                  className="text-muted-foreground"
                >
                  Pular todas
                </Button>
                <Button onClick={handleNext} className="gap-2">
                  Próxima
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <div />
                <Button onClick={handleNext} className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Entendi!
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
