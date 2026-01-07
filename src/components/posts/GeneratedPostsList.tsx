import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Share2, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GeneratedPostsListProps {
  posts: any[];
  onPostDeleted: () => void;
}

export const GeneratedPostsList = ({ posts, onPostDeleted }: GeneratedPostsListProps) => {
  const handleShare = (postId: string) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    navigator.clipboard.writeText(shareUrl);
  };

  const handleDelete = async (id: string) => {
    // Trigger the callback
    onPostDeleted();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posts Gerados</CardTitle>
      </CardHeader>
      <CardContent>
        {posts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nenhum post gerado ainda</p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {post.image_url && (
                        <img 
                          src={post.image_url} 
                          alt={post.title}
                          className="w-full h-64 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="font-bold text-lg">{post.title}</h3>
                        <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                          {post.content}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleShare(post.id)}
                        >
                          <Share2 className="h-4 w-4 mr-2" />
                          Compartilhar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(post.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
