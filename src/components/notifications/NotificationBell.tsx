import { Bell, Sparkles, Check, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotifications } from "@/hooks/useNotifications";
import { useAppUpdates } from "@/hooks/useAppUpdates";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface NotificationBellProps {
  userId: string;
}

export const NotificationBell = ({ userId }: NotificationBellProps) => {
  const { notifications, unreadCount: notificationUnread, markAsRead, markAllAsRead } = useNotifications(userId);
  const { updates, unreadCount: updatesUnread, markAsRead: markUpdateAsRead, markAllAsRead: markAllUpdatesAsRead } = useAppUpdates();
  const navigate = useNavigate();

  const totalUnread = notificationUnread + updatesUnread;

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handleUpdateClick = (updateId: string) => {
    markUpdateAsRead(updateId);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'appointment': return '📅';
      case 'payment': return '💰';
      case 'warning': return '⚠️';
      default: return '🔔';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative hover:bg-accent/50 transition-colors"
        >
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-medium animate-in zoom-in-50">
              {totalUnread > 9 ? '9+' : totalUnread}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-24px)] sm:w-[360px] max-w-[360px] p-0 shadow-xl border-border/50" align="end" sideOffset={8}>
        <Tabs defaultValue="notifications" className="w-full">
          {/* Header com tabs */}
          <div className="bg-gradient-to-b from-card to-card/95 border-b border-border/50">
            <TabsList className="w-full h-12 bg-transparent p-1 gap-1">
              <TabsTrigger 
                value="notifications" 
                className="flex-1 h-10 data-[state=active]:bg-accent data-[state=active]:shadow-sm rounded-lg transition-all gap-2"
              >
                <Bell className="h-4 w-4" />
                <span className="text-sm font-medium">Notificações</span>
                {notificationUnread > 0 && (
                  <span className="h-5 min-w-5 flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold px-1.5">
                    {notificationUnread}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger 
                value="updates" 
                className="flex-1 h-10 data-[state=active]:bg-accent data-[state=active]:shadow-sm rounded-lg transition-all gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span className="text-sm font-medium">Novidades</span>
                {updatesUnread > 0 && (
                  <span className="h-5 min-w-5 flex items-center justify-center rounded-full bg-gold text-gold-foreground text-[10px] font-semibold px-1.5">
                    {updatesUnread}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notifications" className="m-0">
            {/* Action bar */}
            {notificationUnread > 0 && (
              <div className="flex justify-end px-3 py-2 bg-muted/30 border-b border-border/30">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => markAllAsRead()}
                  className="text-xs h-7 text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <Check className="h-3 w-3" />
                  Marcar todas como lidas
                </Button>
              </div>
            )}
            <ScrollArea className="h-[320px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Inbox className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Tudo limpo!</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Nenhuma notificação pendente</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        "w-full p-3 text-left rounded-lg transition-all",
                        "hover:bg-accent/70 active:scale-[0.99]",
                        !notification.is_read 
                          ? "bg-accent/50 border border-primary/10" 
                          : "border border-transparent hover:border-border/30"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-muted/70 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm leading-tight">{notification.title}</p>
                            {!notification.is_read && (
                              <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium uppercase tracking-wide">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="updates" className="m-0">
            {/* Action bar */}
            {updatesUnread > 0 && (
              <div className="flex justify-end px-3 py-2 bg-muted/30 border-b border-border/30">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => markAllUpdatesAsRead()}
                  className="text-xs h-7 text-muted-foreground hover:text-foreground gap-1.5"
                >
                  <Check className="h-3 w-3" />
                  Marcar todas como lidas
                </Button>
              </div>
            )}
            <ScrollArea className="h-[320px]">
              {updates.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Nenhuma novidade</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Em breve teremos novidades!</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {updates.map((update) => (
                    <button
                      key={update.id}
                      onClick={() => handleUpdateClick(update.id)}
                      className={cn(
                        "w-full p-3 text-left rounded-lg transition-all",
                        "hover:bg-accent/70 active:scale-[0.99]",
                        !update.is_read 
                          ? "bg-gradient-to-r from-gold/10 to-transparent border border-gold/20" 
                          : "border border-transparent hover:border-border/30"
                      )}
                    >
                      <div className="flex gap-3">
                        <div className="h-10 w-10 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">{update.emoji || '✨'}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-medium text-sm leading-tight">{update.title}</p>
                            {!update.is_read && (
                              <Badge className="bg-gold hover:bg-gold text-xs px-1.5 h-5 font-semibold shrink-0">
                                Nova
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                            {update.description}
                          </p>
                          <p className="text-[10px] text-muted-foreground/60 mt-2 font-medium uppercase tracking-wide">
                            {formatDistanceToNow(new Date(update.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};
