import { AuthLinkButton } from "@/components/landing/AuthLinkButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, TrendingUp, Briefcase, Crown, Clock } from "lucide-react";

const plans = [
  {
    name: "Start",
    price: "Grátis",
    period: "para sempre",
    description: "Ideal para organizar a barbearia",
    badge: null,
    icon: Briefcase,
    iconBg: "bg-[#1a1a1a]",
    iconColor: "text-[#EDEDED]/60",
    features: [
      { text: "Agenda completa", included: true },
      { text: "Gestão de clientes", included: true },
      { text: "Controle de caixa", included: true },
      { text: "Barbeiros ilimitados", included: true },
      { text: "Serviços ilimitados", included: true },
      { text: "Controle financeiro", included: true },
      { text: "Growth Engine", included: false },
      { text: "Mapa de Clientes", included: false },
      { text: "IA do Site", included: false },
      { text: "Produtos", included: false, comingSoon: true },
      { text: "Metas", included: false, comingSoon: true },
      { text: "Automação", included: false, comingSoon: true },
      { text: "Posts Prontos", included: false, comingSoon: true },
      { text: "Pagamentos", included: false, comingSoon: true },
      { text: "Config WhatsApp", included: false, comingSoon: true },
    ],
    cta: "Começar grátis",
    variant: "outline" as const,
  },
  {
    name: "Growth",
    price: "R$ 59,90",
    period: "/mês",
    description: "Para barbearias que querem crescer",
    badge: "Recomendado",
    icon: TrendingUp,
    iconBg: "bg-gradient-to-br from-[#C9B27C] to-[#E8D9A8]",
    iconColor: "text-black",
    features: [
      { text: "Tudo do Start", included: true, highlight: true },
      { text: "Growth Engine (IA)", included: true },
      { text: "Mapa de clientes", included: true },
      { text: "Insights de faturamento", included: true },
      { text: "Previsões e alertas", included: true },
      { text: "SEO local automático", included: true },
      { text: "IA que cria site", included: true },
      { text: "Suporte humano prioritário", included: true },
      { text: "Produtos", included: true, comingSoon: true },
      { text: "Metas", included: true, comingSoon: true },
      { text: "Automação", included: true, comingSoon: true },
      { text: "Posts Prontos", included: true, comingSoon: true },
      { text: "Pagamentos", included: true, comingSoon: true },
      { text: "Config WhatsApp", included: true, comingSoon: true },
    ],
    cta: "Quero crescer",
    variant: "default" as const,
  },
];

export const PlansSection = () => {
  return (
    <section id="planos" className="py-20 bg-[#0A0A0A]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#EDEDED]">
            Você quer só trabalhar ou quer <span className="text-[#C9B27C]">crescer</span>?
          </h2>
          <p className="text-[#EDEDED]/60 text-lg">
            O plano Start organiza. O plano Growth faz crescer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isGrowth = plan.name === "Growth";
            
            return (
              <Card
                key={plan.name}
                className={`relative overflow-visible bg-[#111111] border-[#222222] ${
                  isGrowth
                    ? "border-[#C9B27C] shadow-lg shadow-[#C9B27C]/10 md:scale-105"
                    : ""
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-[#C9B27C] to-[#E8D9A8] text-black shadow-md">
                      <Crown className="w-3 h-3 mr-1" />
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <CardHeader className={`text-center ${isGrowth ? 'pt-10' : 'pt-8'}`}>
                  <div className={`mx-auto mb-3 w-14 h-14 rounded-full ${plan.iconBg} flex items-center justify-center`}>
                    <Icon className={`w-7 h-7 ${plan.iconColor}`} />
                  </div>
                  <CardTitle className="text-2xl text-[#EDEDED]">{plan.name}</CardTitle>
                  <p className="text-sm text-[#EDEDED]/40 mt-1">
                    {plan.description}
                  </p>
                  <div className="mt-4">
                    <span className={`text-4xl font-bold ${isGrowth ? 'text-[#C9B27C]' : 'text-[#EDEDED]'}`}>
                      {plan.price}
                    </span>
                    <span className="text-[#EDEDED]/60"> {plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className={`w-4 h-4 flex-shrink-0 ${feature.highlight ? 'text-[#C9B27C]' : 'text-green-500'}`} />
                        ) : (
                          <X className="w-4 h-4 text-[#EDEDED]/30 flex-shrink-0" />
                        )}
                        <span className={`text-sm ${
                          feature.included 
                            ? feature.highlight 
                              ? 'text-[#C9B27C] font-semibold' 
                              : 'text-[#EDEDED]' 
                            : 'text-[#EDEDED]/30 line-through'
                        }`}>
                          {feature.text}
                        </span>
                        {feature.comingSoon && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-blue-500/20 text-blue-400 border-blue-500/30">
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            Em breve
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>

                  <div className="pt-4">
                    <AuthLinkButton
                      className={`w-full ${
                        isGrowth
                          ? "bg-[#C9B27C] hover:bg-[#C9B27C]/90 text-black font-bold"
                          : "border-[#333333] text-[#EDEDED] hover:bg-[#1a1a1a]"
                      }`}
                      variant={plan.variant}
                      size="lg"
                    >
                      {isGrowth && <TrendingUp className="w-4 h-4 mr-2" />}
                      {plan.cta}
                    </AuthLinkButton>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="text-center text-[#C9B27C]/70 text-base mt-10 font-medium">
          Você só precisa do Growth quando sua barbearia começa a faturar mais.
        </p>
        <p className="text-center text-[#EDEDED]/40 text-sm mt-2">
          Pagamento seguro via Stripe • Cancele quando quiser
        </p>
      </div>
    </section>
  );
};
