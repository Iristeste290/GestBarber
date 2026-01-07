import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GeneratedPost {
  id: string;
  title: string;
  content: string;
  post_type: string;
  created_at: string;
  image_url: string | null;
}

export const usePosts = () => {
  const queryClient = useQueryClient();
  const [generatingWeekly, setGeneratingWeekly] = useState(false);
  const [generatingPromo, setGeneratingPromo] = useState(false);
  const [generatingCampaign, setGeneratingCampaign] = useState(false);

  const { data: posts = [], isLoading } = useQuery<GeneratedPost[]>({
    queryKey: ["generated-posts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("generated_posts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    staleTime: 30000, // 30 segundos
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("generated-posts-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "generated_posts",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["generated-posts"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const generatePost = async (
    type: "weekly" | "promotion" | "campaign",
    context: string
  ) => {
    const setLoading = type === "weekly" ? setGeneratingWeekly : 
                       type === "promotion" ? setGeneratingPromo : setGeneratingCampaign;
    
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("generate-post", {
        body: { postType: type, context },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro ao gerar post");

      toast.success("Post gerado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["generated-posts"] });
      return true;
    } catch (error) {
      console.error("Erro ao gerar post:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao gerar post. Tente novamente.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    posts,
    isLoading,
    generatingWeekly,
    generatingPromo,
    generatingCampaign,
    generatePost,
  };
};