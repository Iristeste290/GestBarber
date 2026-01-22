import { Bell, Sparkles } from "lucide-react";
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
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {totalUnread > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {totalUnread > 9 ? '9+' : totalUnread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Tabs defaultValue="notifications" className="w-full">
          <div className="border-b px-2 pt-2">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="notifications" className="relative text-xs">
                Notificações
                {notificationUnread > 0 && (
                  <span className="ml-1 bg-destructive text-destructive-foreground rounded-full px-1.5 text-[10px]">
                    {notificationUnread}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="updates" className="relative text-xs">
                Novidades
                {updatesUnread > 0 && (
                  <span className="ml-1 bg-primary text-primary-foreground rounded-full px-1.5 text-[10px]">
                    {updatesUnread}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="notifications" className="m-0">
            {notificationUnread > 0 && (
              <div className="flex justify-end p-2 border-b">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => markAllAsRead()}
                  className="text-xs h-7"
                >
                  Marcar todas como lidas
                </Button>
              </div>
            )}
            <ScrollArea className="h-[350px]">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notifications.map((notification) => (
                    <button
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                        !notification.is_read ? 'bg-accent/50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{notification.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </p>
                        </div>
                        {!notification.is_read && (
                          <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="updates" className="m-0">
            {updatesUnread > 0 && (
              <div className="flex justify-end p-2 border-b">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => markAllUpdatesAsRead()}
                  className="text-xs h-7"
                >
                  Marcar todas como lidas
                </Button>
              </div>
            )}
            <ScrollArea className="h-[350px]">
              {updates.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Sparkles className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhuma novidade ainda</p>
                </div>
              ) : (
                <div className="divide-y">
                  {updates.map((update) => (
                    <button
                      key={update.id}
                      onClick={() => handleUpdateClick(update.id)}
                      className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                        !update.is_read ? 'bg-accent/50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <span className="text-2xl">{update.emoji || '✨'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{update.title}</p>
                            {!update.is_read && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                                Nova
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                            {update.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
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
