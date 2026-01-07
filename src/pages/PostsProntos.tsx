import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Tag, Sparkles } from "lucide-react";
import { GeneratedPostsList } from "@/components/posts/GeneratedPostsList";
import { PostGeneratorForm } from "@/components/posts/PostGeneratorForm";
import { usePosts } from "@/hooks/usePosts";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { FullPageLoader } from "@/components/ui/full-page-loader";

const PostsProntos = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const {
    posts,
    isLoading,
    generatingWeekly,
    generatingPromo,
    generatingCampaign,
    generatePost,
  } = usePosts();

  if (authLoading || isLoading) {
    return <FullPageLoader text="Carregando posts..." />;
  }

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6 px-3 md:px-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Posts Prontos com IA</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Crie posts profissionais para suas redes sociais usando inteligência artificial
          </p>
        </div>

        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="weekly" className="text-xs md:text-sm">
              <Calendar className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Agenda</span>
            </TabsTrigger>
            <TabsTrigger value="promotion" className="text-xs md:text-sm">
              <Tag className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Promoções</span>
            </TabsTrigger>
            <TabsTrigger value="campaign" className="text-xs md:text-sm">
              <Sparkles className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="hidden sm:inline">Campanhas</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weekly" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <PostGeneratorForm
              title="Post de Agenda Semanal"
              description="Gere posts profissionais com os horários disponíveis da semana"
              placeholder="Ex: Segunda a sexta: 9h-19h, Sábado: 9h-17h"
              type="weekly"
              onGenerate={generatePost}
              isGenerating={generatingWeekly}
            />
            <GeneratedPostsList
              posts={posts.filter((p) => p.post_type === "weekly")}
              onPostDeleted={() => {}}
            />
          </TabsContent>

          <TabsContent value="promotion" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <PostGeneratorForm
              title="Post de Promoção"
              description="Crie posts promocionais atrativos para aumentar suas vendas"
              placeholder="Ex: 30% de desconto para novos clientes"
              type="promotion"
              onGenerate={generatePost}
              isGenerating={generatingPromo}
            />
            <GeneratedPostsList
              posts={posts.filter((p) => p.post_type === "promotion")}
              onPostDeleted={() => {}}
            />
          </TabsContent>

          <TabsContent value="campaign" className="space-y-4 md:space-y-6 mt-4 md:mt-6">
            <PostGeneratorForm
              title="Post de Campanha"
              description="Desenvolva campanhas criativas para engajar seu público"
              placeholder="Ex: Campanha de verão, dicas de cuidados"
              type="campaign"
              onGenerate={generatePost}
              isGenerating={generatingCampaign}
            />
            <GeneratedPostsList
              posts={posts.filter((p) => p.post_type === "campaign")}
              onPostDeleted={() => {}}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default PostsProntos;
