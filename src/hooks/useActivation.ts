import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useActivation() {
  const queryClient = useQueryClient();

  const { data: activationStatus, isLoading } = useQuery({
    queryKey: ["activation-status"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("activation_completed, activated_at, activation_source")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const completeActivation = useMutation({
    mutationFn: async (source: string = "first_service") => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("profiles")
        .update({
          activation_completed: true,
          activated_at: new Date().toISOString(),
          activation_source: source,
        })
        .eq("id", user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["activation-status"] });
    },
  });

  return {
    isActivated: activationStatus?.activation_completed ?? false,
    isLoading,
    activationStatus,
    completeActivation,
  };
}
