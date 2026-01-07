import { HelpArticle, HelpCategory } from "@/data/helpArticles";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronRight } from "lucide-react";

interface HelpArticlesListProps {
  category: HelpCategory;
  onBack: () => void;
  onSelectArticle: (article: HelpArticle) => void;
}

export function HelpArticlesList({ category, onBack, onSelectArticle }: HelpArticlesListProps) {
  const Icon = category.icon;
  
  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="gap-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
      
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="font-semibold">{category.title}</h2>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </div>
      </div>
      
      <div className="space-y-2">
        {category.articles.map((article) => (
          <Card
            key={article.id}
            className="cursor-pointer transition-all hover:shadow-sm hover:border-primary/50"
            onClick={() => onSelectArticle(article)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <span className="text-sm font-medium">{article.title}</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
