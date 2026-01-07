import { Calendar, DollarSign, Settings, HelpCircle, Users, Sparkles } from "lucide-react";

interface SuggestionCategory {
  icon: React.ReactNode;
  title: string;
  suggestions: string[];
}

interface ChatSuggestionsProps {
  isActivated: boolean;
  daysRemaining?: number;
  onSuggestionClick: (suggestion: string) => void;
}

export function ChatSuggestions({ isActivated, daysRemaining, onSuggestionClick }: ChatSuggestionsProps) {
  const categories: SuggestionCategory[] = [];

  // Urgency category for freemium ending soon
  if (daysRemaining !== undefined && daysRemaining <= 5) {
    categories.push({
      icon: <Sparkles className="h-3.5 w-3.5 text-amber-500" />,
      title: "Seu plano está acabando",
      suggestions: [
        "Meu plano gratuito está acabando, o que fazer?",
        "Quais são os planos disponíveis?"
      ]
    });
  }

  // Setup category for non-activated users
  if (!isActivated) {
    categories.push({
      icon: <Settings className="h-3.5 w-3.5 text-blue-500" />,
      title: "Primeiros passos",
      suggestions: [
        "Como configurar minha barbearia?",
        "Como cadastrar meu primeiro serviço?",
        "Como adicionar um barbeiro?"
      ]
    });
  }

  // Operational categories for activated users
  if (isActivated) {
    categories.push({
      icon: <Calendar className="h-3.5 w-3.5 text-green-500" />,
      title: "Agenda",
      suggestions: [
        "Como agendar um cliente?",
        "Como enviar lembretes pelo WhatsApp?"
      ]
    });

    categories.push({
      icon: <DollarSign className="h-3.5 w-3.5 text-emerald-500" />,
      title: "Financeiro",
      suggestions: [
        "Como ver meu faturamento?",
        "Como cadastrar produtos para venda?"
      ]
    });
  }

  // General help category
  categories.push({
    icon: <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />,
    title: "Dúvidas gerais",
    suggestions: [
      "Como funciona o plano gratuito?",
      "Como ver relatórios?"
    ]
  });

  return (
    <div className="pt-3 space-y-4 animate-fade-in">
      <p className="text-xs text-muted-foreground text-center animate-fade-in">
        Como posso ajudar?
      </p>
      
      <div className="space-y-3">
        {categories.slice(0, 3).map((category, categoryIndex) => (
          <div 
            key={categoryIndex} 
            className="space-y-1.5 animate-fade-in"
            style={{ animationDelay: `${categoryIndex * 100}ms`, animationFillMode: 'backwards' }}
          >
            <div className="flex items-center gap-1.5 px-1">
              {category.icon}
              <span className="text-xs font-medium text-muted-foreground">
                {category.title}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              {category.suggestions.slice(0, 2).map((suggestion, suggestionIndex) => (
                <button
                  key={suggestion}
                  onClick={() => onSuggestionClick(suggestion)}
                  className="text-xs px-3 py-2 rounded-lg border bg-background hover:bg-accent hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 text-left flex items-center gap-2 animate-fade-in"
                  style={{ 
                    animationDelay: `${(categoryIndex * 100) + (suggestionIndex * 50) + 50}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  <span className="truncate">{suggestion}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}