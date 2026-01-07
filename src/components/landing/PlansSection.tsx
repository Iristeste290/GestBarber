import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, X, Sparkles, Zap, Crown, Clock, Rocket } from "lucide-react";

const plans = [
  {
    name: "Freemium",
    price: "Grátis",
    period: "para sempre",
    description: "Para começar a organizar",
    badge: null,
    icon: Sparkles,
    features: [
      { text: "Até 2 barbeiros", included: true },
      { text: "Até 50 agendamentos/mês", included: true },
      { text: "Até 10 serviços", included: true },
      { text: "Relatórios e previsões", included: true },
      { text: "Controle de custos", included: true },
      { text: "Controle de caixa", included: true },
      { text: "Suporte por e-mail (48h)", included: false },
      { text: "Produtos", included: false, comingSoon: true },
      { text: "Sistema de pagamentos", included: false, comingSoon: true },
      { text: "Metas semanais", included: false, comingSoon: true },
      { text: "Automações", included: false, comingSoon: true },
      { text: "IA e Posts automáticos", included: false, comingSoon: true },
    ],
    cta: "Começar grátis",
    variant: "outline" as const,
  },
  {
    name: "Pro",
    price: "R$ 32,90",
    period: "/mês",
    description: "Para barbearias em crescimento",
    badge: "Mais Popular",
    icon: Zap,
    features: [
      { text: "Barbeiros ilimitados", included: true },
      { text: "Agendamentos ilimitados", included: true },
      { text: "Serviços ilimitados", included: true },
      { text: "Relatórios e previsões", included: true },
      { text: "Controle de custos", included: true },
      { text: "Controle de caixa", included: true },
      { text: "Suporte por e-mail (48h)", included: true },
      { text: "Produtos ilimitados", included: true, comingSoon: true },
      { text: "Metas semanais", included: true, comingSoon: true },
      { text: "Automações completas", included: true, comingSoon: true },
      { text: "IA e Posts automáticos", included: true, comingSoon: true },
      { text: "Sistema de pagamentos", included: true, comingSoon: true },
    ],
    cta: "Assinar Pro",
    variant: "default" as const,
  },
  {
    name: "Premium",
    price: "R$ 294,80",
    originalPrice: "R$ 394,80",
    period: "/ano",
    description: "Economia de 3 meses",
    badge: "Melhor Valor",
    icon: Crown,
    features: [
      { text: "Tudo do Pro", included: true },
      { text: "Economia de 3 meses", included: true },
      { text: "Suporte por e-mail (12h)", included: true },
      { text: "Prioridade em novos recursos", included: true },
      { text: "Preço fixo garantido no ano", included: true },
    ],
    cta: "Assinar Premium",
    variant: "default" as const,
  },
];

export const PlansSection = () => {
  return (
    <section id="planos" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Planos que cabem no seu bolso
          </h2>
          <p className="text-muted-foreground text-lg">
            Escolha o plano ideal para o tamanho do seu negócio
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <Card
                key={plan.name}
                className={`relative overflow-visible ${
                  plan.badge === "Mais Popular"
                    ? "border-primary shadow-lg shadow-primary/20 md:scale-105"
                    : ""
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-accent shadow-md">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pt-8">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    {plan.originalPrice && (
                      <p className="text-sm text-muted-foreground line-through">
                        {plan.originalPrice}
                      </p>
                    )}
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {plan.description}
                  </p>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span className={`text-sm ${feature.included ? "text-foreground" : "text-muted-foreground line-through"}`}>
                          {feature.text}
                        </span>
                        {feature.comingSoon && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-amber-500/50 text-amber-600 dark:text-amber-400">
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            Em breve
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>

                  <Link to="/auth" className="block">
                    <Button
                      className={`w-full ${
                        plan.variant === "default"
                          ? "bg-gradient-to-r from-primary to-accent hover:opacity-90"
                          : ""
                      }`}
                      variant={plan.variant}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Aviso sobre recursos em desenvolvimento */}
        <Alert className="max-w-3xl mx-auto mt-8 border-amber-500/30 bg-amber-500/5">
          <Rocket className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-sm">
            <span className="font-medium text-amber-600 dark:text-amber-400">MVP em evolução:</span>{" "}
            Alguns recursos marcados como "Em breve" estão em desenvolvimento e serão liberados gradualmente para assinantes. 
            Ao assinar, você garante acesso assim que forem lançados!
          </AlertDescription>
        </Alert>
      </div>
    </section>
  );
};