import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { HelpSearch } from "@/components/ajuda/HelpSearch";
import { HelpCategories } from "@/components/ajuda/HelpCategories";
import { HelpArticlesList } from "@/components/ajuda/HelpArticlesList";
import { HelpArticleView } from "@/components/ajuda/HelpArticleView";
import { HelpSearchResults } from "@/components/ajuda/HelpSearchResults";
import { HelpGrowthGate } from "@/components/ajuda/HelpGrowthGate";
import { helpCategories, searchArticles, HelpCategory, HelpArticle } from "@/data/helpArticles";
import { HelpCircle, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { SupportGrowthGate } from "@/components/support/SupportGrowthGate";

type ViewState = 
  | { type: "categories" }
  | { type: "articles"; category: HelpCategory }
  | { type: "article"; category: HelpCategory; article: HelpArticle }
  | { type: "growth-gate" };

export default function Ajuda() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<ViewState>({ type: "categories" });
  const [showSupportGate, setShowSupportGate] = useState(false);
  const { isGrowth, loading: planLoading } = usePlanValidation();
  
  const searchResults = useMemo(() => {
    return searchArticles(searchQuery);
  }, [searchQuery]);

  const handleSupportClick = () => {
    if (!planLoading && !isGrowth) {
      setShowSupportGate(true);
    } else {
      navigate("/suporte");
    }
  };

  const handleRestrictedClick = () => {
    setView({ type: "growth-gate" });
  };
  
  const isSearching = searchQuery.trim().length > 0;
  
  const handleSelectCategory = (category: HelpCategory) => {
    setView({ type: "articles", category });
    setSearchQuery("");
  };
  
  const handleSelectArticle = (article: HelpArticle) => {
    if (view.type === "articles") {
      setView({ type: "article", category: view.category, article });
    }
  };
  
  const handleSelectSearchResult = (category: HelpCategory, article: HelpArticle) => {
    setView({ type: "article", category, article });
    setSearchQuery("");
  };
  
  const handleBack = () => {
    if (view.type === "article") {
      setView({ type: "articles", category: view.category });
    } else if (view.type === "growth-gate") {
      setView({ type: "categories" });
    } else {
      setView({ type: "categories" });
    }
  };
  
  if (showSupportGate) {
    return (
      <AppLayout
        title="Suporte"
        description="Suporte exclusivo do plano Growth"
      >
        <SupportGrowthGate />
      </AppLayout>
    );
  }
  
  return (
    <AppLayout
      title="Central de Ajuda"
      description="Encontre respostas para suas dúvidas"
    >
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <HelpCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Central de Ajuda</h1>
            <p className="text-sm text-muted-foreground">
              Como podemos te ajudar hoje?
            </p>
          </div>
        </div>
        
        {/* Search */}
        <HelpSearch value={searchQuery} onChange={setSearchQuery} />
        
        {/* Content */}
        {view.type === "growth-gate" ? (
          <HelpGrowthGate onBack={handleBack} />
        ) : isSearching ? (
          <HelpSearchResults
            results={searchResults}
            query={searchQuery}
            onSelectResult={handleSelectSearchResult}
          />
        ) : view.type === "categories" ? (
          <HelpCategories
            categories={helpCategories}
            onSelectCategory={handleSelectCategory}
            onRestrictedClick={handleRestrictedClick}
          />
        ) : view.type === "articles" ? (
          <HelpArticlesList
            category={view.category}
            onBack={handleBack}
            onSelectArticle={handleSelectArticle}
          />
        ) : (
          <HelpArticleView
            article={view.article}
            category={view.category}
            onBack={handleBack}
          />
        )}
        
        {/* Contact Support Card */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <MessageCircle className="h-8 w-8 text-muted-foreground hidden sm:block" />
              <div>
                <p className="font-medium text-sm">Não encontrou o que procurava?</p>
                <p className="text-xs text-muted-foreground">
                  Fale com nosso suporte
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSupportClick}
            >
              Falar com o Suporte
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
