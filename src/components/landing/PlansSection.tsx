import { AuthLinkButton } from "@/components/landing/AuthLinkButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, TrendingUp, Briefcase, Crown, Clock, Sparkles } from "lucide-react";
import { ScrollAnimation, StaggerContainer, StaggerItem } from "./ScrollAnimation";
import { motion } from "framer-motion";

const comingSoonFeatures = [
  'Produtos',
  'Metas',
  'Automação WhatsApp',
  'Posts Prontos (IA)',
  'Pagamentos',
];

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
    iconBg: "bg-gradient-to-br from-primary to-primary/70",
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
    ],
    cta: "Quero crescer",
    variant: "default" as const,
  },
];

export const PlansSection = () => {
  return (
    <section id="planos" className="py-28 bg-[#0A0A0A] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <ScrollAnimation animation="fade-up">
            <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
              Planos
            </span>
          </ScrollAnimation>
          <ScrollAnimation animation="fade-up" delay={0.1}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[#EDEDED] leading-tight">
              Você quer só trabalhar ou quer <span className="text-primary">crescer</span>?
            </h2>
          </ScrollAnimation>
          <ScrollAnimation animation="fade-up" delay={0.2}>
            <p className="text-xl md:text-2xl text-muted-foreground">
              O plano Start organiza. O plano Growth faz crescer.
            </p>
          </ScrollAnimation>
        </div>

        {/* Plans Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16" staggerDelay={0.2}>
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isGrowth = plan.name === "Growth";
            
            return (
              <StaggerItem key={plan.name}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card
                    className={`relative overflow-visible bg-gradient-to-b from-[#151515] to-[#111111] border-[#222222] h-full ${
                      isGrowth
                        ? "border-primary/50 shadow-xl shadow-primary/10 lg:scale-105"
                        : "hover:border-primary/20"
                    } transition-all duration-300`}
                  >
                    {/* Glow effect for Growth plan */}
                    {isGrowth && (
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur opacity-50" />
                    )}
                    
                    {plan.badge && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-primary to-primary/80 text-black shadow-gold font-bold py-1.5 px-4">
                          <Crown className="w-3.5 h-3.5 mr-1.5" />
                          {plan.badge}
                        </Badge>
                      </div>
                    )}

                    <div className="relative">
                      <CardHeader className={`text-center ${isGrowth ? 'pt-12' : 'pt-10'} pb-6`}>
                        <div className={`mx-auto mb-4 w-16 h-16 rounded-2xl ${plan.iconBg} flex items-center justify-center shadow-lg ${isGrowth ? 'shadow-primary/20' : ''}`}>
                          <Icon className={`w-8 h-8 ${plan.iconColor}`} />
                        </div>
                        <CardTitle className="text-3xl text-[#EDEDED]">{plan.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-2">
                          {plan.description}
                        </p>
                        <div className="mt-6">
                          <span className={`text-5xl font-bold ${isGrowth ? 'text-primary' : 'text-[#EDEDED]'}`}>
                            {plan.price}
                          </span>
                          <span className="text-muted-foreground text-lg"> {plan.period}</span>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-6 px-8 pb-8">
                        <ul className="space-y-4">
                          {plan.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-3">
                              {feature.included ? (
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${feature.highlight ? 'bg-primary/20' : 'bg-green-500/20'}`}>
                                  <Check className={`w-4 h-4 ${feature.highlight ? 'text-primary' : 'text-green-500'}`} />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-[#1A1A1A] flex items-center justify-center">
                                  <X className="w-4 h-4 text-muted-foreground/50" />
                                </div>
                              )}
                              <span className={`text-base ${
                                feature.included 
                                  ? feature.highlight 
                                    ? 'text-primary font-semibold' 
                                    : 'text-[#EDEDED]' 
                                  : 'text-muted-foreground/50 line-through'
                              }`}>
                                {feature.text}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* Em breve section */}
                        <div className={`pt-5 border-t ${isGrowth ? 'border-primary/20' : 'border-[#333333]'}`}>
                          <p className={`text-sm mb-3 flex items-center gap-2 ${isGrowth ? 'text-primary/80' : 'text-muted-foreground'}`}>
                            <Clock className="w-4 h-4" />
                            Em breve {isGrowth && <Badge variant="outline" className="text-xs border-primary/30 text-primary">incluído</Badge>}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {comingSoonFeatures.map((feature, idx) => (
                              <Badge 
                                key={idx} 
                                variant="secondary" 
                                className={`text-xs px-3 py-1 ${
                                  isGrowth 
                                    ? 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20' 
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}
                              >
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="pt-4">
                          <AuthLinkButton
                            className={`w-full py-6 text-lg font-bold transition-all duration-300 ${
                              isGrowth
                                ? "bg-gradient-gold hover:opacity-90 text-black shadow-gold hover:shadow-gold-lg hover:-translate-y-0.5"
                                : "border-[#333333] text-[#EDEDED] hover:bg-[#1a1a1a] hover:border-primary/30"
                            }`}
                            variant={plan.variant}
                            size="lg"
                          >
                            {isGrowth && <Sparkles className="w-5 h-5 mr-2" />}
                            {plan.cta}
                          </AuthLinkButton>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Bottom text */}
        <ScrollAnimation animation="fade-up">
          <div className="text-center">
            <p className="text-primary text-lg font-medium mb-3">
              Você só precisa do Growth quando sua barbearia começa a faturar mais.
            </p>
            <p className="text-muted-foreground">
              Pagamento seguro via Stripe • Cancele quando quiser
            </p>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};
