import { HelpCategory } from "@/data/helpArticles";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight } from "lucide-react";

interface HelpCategoriesProps {
  categories: HelpCategory[];
  onSelectCategory: (category: HelpCategory) => void;
}

export function HelpCategories({ categories, onSelectCategory }: HelpCategoriesProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {categories.map((category) => {
        const Icon = category.icon;
        return (
          <Card
            key={category.id}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
            onClick={() => onSelectCategory(category)}
          >
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm truncate">{category.title}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {category.description}
                </p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
