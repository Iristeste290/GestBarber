import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AppUpdate {
  id: string;
  title: string;
  description: string;
  emoji: string;
  version: string | null;
  created_at: string;
  is_read: boolean;
}

export const useAppUpdates = () => {
  const [updates, setUpdates] = useState<AppUpdate[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchUpdates = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Buscar todas as atualizações ativas
      const { data: allUpdates, error: updatesError } = await supabase
        .from("app_updates")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20);

      if (updatesError) throw updatesError;

      // Se usuário logado, buscar quais já foram lidas
      let viewedIds = new Set<string>();
      if (user) {
        const { data: views } = await supabase
          .from("app_update_views")
          .select("update_id")
          .eq("user_id", user.id);

        viewedIds = new Set(views?.map(v => v.update_id) || []);
      }

      const updatesWithReadStatus = (allUpdates || []).map(update => ({
        ...update,
        is_read: viewedIds.has(update.id),
      }));

      setUpdates(updatesWithReadStatus);
      setUnreadCount(updatesWithReadStatus.filter(u => !u.is_read).length);
    } catch (error) {
      console.error("Erro ao buscar atualizações:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (updateId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from("app_update_views")
        .insert({
          user_id: user.id,
          update_id: updateId,
        });

      setUpdates(prev =>
        prev.map(u => (u.id === updateId ? { ...u, is_read: true } : u))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Erro ao marcar como lida:", error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const unreadUpdates = updates.filter(u => !u.is_read);
      
      if (unreadUpdates.length === 0) return;

      const inserts = unreadUpdates.map(u => ({
        user_id: user.id,
        update_id: u.id,
      }));

      await supabase.from("app_update_views").insert(inserts);

      setUpdates(prev => prev.map(u => ({ ...u, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Erro ao marcar todas como lidas:", error);
    }
  }, [updates]);

  useEffect(() => {
    fetchUpdates();
  }, [fetchUpdates]);

  return {
    updates,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchUpdates,
  };
};
