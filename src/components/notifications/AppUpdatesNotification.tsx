import { Bell, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppUpdates } from "@/hooks/useAppUpdates";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";

export const AppUpdatesNotification = () => {
  const { updates, unreadCount, markAsRead, markAllAsRead, loading } = useAppUpdates();
  const [isOpen, setIsOpen] = useState(false);

  if (loading || updates.length === 0) return null;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-emerald-500 hover:bg-emerald-500"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b bg-card">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <h3 className="font-semibold">Avisos</h3>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => markAllAsRead()}
                className="text-xs h-8 gap-1"
              >
                <Check className="h-3 w-3" />
                Marcar todas como lidas
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <ScrollArea className="max-h-[400px]">
          <div className="p-2 space-y-2">
            {updates.map((update) => (
              <div
                key={update.id}
                className={`rounded-lg border p-4 transition-colors ${
                  !update.is_read 
                    ? 'bg-accent/50 border-primary/20' 
                    : 'bg-card hover:bg-accent/30'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{update.emoji}</span>
                    <h4 className="font-medium text-sm">{update.title}</h4>
                  </div>
                  {!update.is_read && (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-xs shrink-0">
                      Nova
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {update.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(update.created_at), "d 'de' MMMM", { locale: ptBR })}
                  </span>
                  {!update.is_read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markAsRead(update.id)}
                      className="h-7 text-xs gap-1"
                    >
                      <Check className="h-3 w-3" />
                      Marcar como lida
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};
