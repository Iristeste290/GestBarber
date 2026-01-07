import { HelpArticle, HelpCategory } from "@/data/helpArticles";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Search } from "lucide-react";

interface HelpSearchResultsProps {
  results: { category: HelpCategory; article: HelpArticle }[];
  query: string;
  onSelectResult: (category: HelpCategory, article: HelpArticle) => void;
}

export function HelpSearchResults({ results, query, onSelectResult }: HelpSearchResultsProps) {
  if (results.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-medium">Nenhum resultado encontrado</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Tente buscar por outras palavras-chave
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {results.length} resultado{results.length !== 1 ? "s" : ""} para "{query}"
      </p>
      
      <div className="space-y-2">
        {results.map(({ category, article }) => {
          const Icon = category.icon;
          return (
            <Card
              key={`${category.id}-${article.id}`}
              className="cursor-pointer transition-all hover:shadow-sm hover:border-primary/50"
              onClick={() => onSelectResult(category, article)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{article.title}</h4>
                  <p className="text-xs text-muted-foreground truncate">
                    {category.title}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
