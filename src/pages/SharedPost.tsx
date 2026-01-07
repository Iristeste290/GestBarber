import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Post {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

export default function SharedPost() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("generated_posts")
          .select("id, title, content, created_at")
          .eq("id", id)
          .eq("is_public", true)
          .single();

        if (error) throw error;

        setPost(data);
      } catch (err) {
        console.error("Erro ao carregar post:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const isMobile = () => {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  };

  const handleCopyText = async () => {
    if (!post) return;
    
    try {
      await navigator.clipboard.writeText(post.content);
      toast.success("Texto copiado!");
    } catch (error) {
      toast.error("Erro ao copiar");
    }
  };

  const handleShare = async () => {
    if (!post) return;

    const shareText = `${post.title}\n\n${post.content}`;
    const shareUrl = window.location.href;

    if (isMobile()) {
      const encodedText = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
      
      try {
        window.location.href = `whatsapp://send?text=${encodedText}`;
        
        setTimeout(() => {
          if (navigator.share) {
            navigator.share({
              title: post.title,
              text: shareText,
              url: shareUrl,
            }).catch((error) => {
              if ((error as Error).name !== "AbortError") {
                handleCopyLink();
              }
            });
          } else {
            handleCopyLink();
          }
        }, 2000);
      } catch (error) {
        if (navigator.share) {
          try {
            await navigator.share({
              title: post.title,
              text: shareText,
              url: shareUrl,
            });
          } catch (shareError) {
            if ((shareError as Error).name !== "AbortError") {
              handleCopyLink();
            }
          }
        } else {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    } catch (error) {
      toast.error("Erro ao copiar link");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Post não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Este post não existe ou não está mais disponível para compartilhamento.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 py-8">
      <div className="max-w-2xl mx-auto space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{post.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-foreground">
              {post.content}
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={handleCopyText}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copiar Texto
              </Button>
              
              <Button
                variant="default"
                onClick={handleShare}
                className="bg-green-500/90 hover:bg-green-500 text-white dark:bg-green-600/90 dark:hover:bg-green-600"
              >
                <Share2 className="h-4 w-4 mr-2" />
                {isMobile() ? "Compartilhar via WhatsApp" : "Copiar Link"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          Post compartilhado via Posts Prontos
        </div>
      </div>
    </div>
  );
}
