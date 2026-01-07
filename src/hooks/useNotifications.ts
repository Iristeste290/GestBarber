import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError } from "@/lib/error-handler";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

export const useNotifications = (userId?: string) => {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // Buscar notificações
  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ['notifications', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    staleTime: 10000,
  });

  // Atualizar contador de não lidas
  useEffect(() => {
    const count = notifications.filter(n => !n.is_read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Realtime - novos agendamentos
  useEffect(() => {
    if (!userId) return;

    const appointmentsChannel = supabase
      .channel('appointments-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
        },
        async (payload) => {
          // Criar notificação
          await supabase.from('notifications').insert({
            user_id: userId,
            title: 'Novo Agendamento',
            message: 'Um novo agendamento foi criado',
            type: 'appointment',
            link: '/agenda',
          });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    const productsChannel = supabase
      .channel('products-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products',
        },
        async (payload: any) => {
          const product = payload.new;
          // Alerta de estoque baixo
          if (product.stock_quantity <= product.min_stock_level) {
            await supabase.from('notifications').insert({
              user_id: userId,
              title: 'Estoque Baixo',
              message: `Produto "${product.name}" está com estoque baixo (${product.stock_quantity} unidades)`,
              type: 'warning',
              link: '/produtos',
            });
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
          }
        }
      )
      .subscribe();

    const paymentsChannel = supabase
      .channel('payments-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'payments',
          filter: `status=eq.pending`,
        },
        async () => {
          await supabase.from('notifications').insert({
            user_id: userId,
            title: 'Pagamento Pendente',
            message: 'Um novo pagamento pendente foi registrado',
            type: 'payment',
            link: '/pagamentos',
          });
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(productsChannel);
      supabase.removeChannel(paymentsChannel);
    };
  }, [userId, queryClient]);

  // Marcar como lida
  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      handleError(error, { title: 'Erro ao marcar notificação' });
    },
  });

  // Marcar todas como lidas
  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!userId) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      handleError(error, { title: 'Erro ao marcar todas como lidas' });
    },
  });

  // Deletar notificação
  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => {
      handleError(error, { title: 'Erro ao deletar notificação' });
    },
  });

  return {
    notifications,
    isLoading,
    unreadCount,
    markAsRead: markAsRead.mutate,
    markAllAsRead: markAllAsRead.mutate,
    deleteNotification: deleteNotification.mutate,
  };
};
