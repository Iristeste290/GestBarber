import { HelpCategory } from "@/data/helpArticles";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, Lock } from "lucide-react";
import { usePlanValidation } from "@/hooks/usePlanValidation";

interface HelpCategoriesProps {
  categories: HelpCategory[];
  onSelectCategory: (category: HelpCategory) => void;
  onRestrictedClick?: () => void;
}

// Categorias restritas ao plano Growth
const GROWTH_ONLY_CATEGORIES = ["falar-suporte", "recursos-growth"];

export function HelpCategories({ categories, onSelectCategory, onRestrictedClick }: HelpCategoriesProps) {
  const { isGrowth, loading } = usePlanValidation();

  const isRestricted = (categoryId: string) => {
    return GROWTH_ONLY_CATEGORIES.includes(categoryId) && !isGrowth;
  };

  const handleClick = (category: HelpCategory) => {
    if (!loading && isRestricted(category.id)) {
      onRestrictedClick?.();
    } else {
      onSelectCategory(category);
    }
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((category) => {
        const Icon = category.icon;
        const restricted = !loading && isRestricted(category.id);
        
        return (
          <Card
            key={category.id}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => handleClick(category)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                restricted ? "bg-muted" : "bg-primary/10"
              }`}>
                <Icon className={`h-5 w-5 ${restricted ? "text-muted-foreground" : "text-primary"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm truncate">{category.title}</h3>
                  {restricted && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded">
                      <Lock className="h-3 w-3" />
                      Growth
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {category.description}
                </p>
              </div>
              <ChevronRight className={`h-4 w-4 shrink-0 ${
                restricted ? "text-muted-foreground/50" : "text-muted-foreground"
              }`} />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
