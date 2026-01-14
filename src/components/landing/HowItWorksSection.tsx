import { AuthLinkButton } from "@/components/landing/AuthLinkButton";
import { Briefcase, BarChart3, Brain, TrendingUp } from "lucide-react";
import { ScrollAnimation, StaggerContainer, StaggerItem } from "./ScrollAnimation";

const steps = [
  {
    number: 1,
    icon: Briefcase,
    title: "O barbeiro entra no Start (grátis)",
    description: "Ele começa usando agenda, clientes e caixa normalmente. Sem pagar nada.",
  },
  {
    number: 2,
    icon: BarChart3,
    title: "O GestBarber começa a analisar tudo",
    description: "O sistema registra dados de clientes, horários, faturamento, serviços e recorrência.",
  },
  {
    number: 3,
    icon: Brain,
    title: "O Growth Engine entra em ação",
    description: "O sistema identifica horários vazios, clientes que mais gastam, oportunidades de aumento de faturamento e risco de queda.",
  },
  {
    number: 4,
    icon: TrendingUp,
    title: "O barbeiro cresce",
    description: "O sistema mostra onde ganhar mais dinheiro e só então oferece o plano Growth.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section id="como-funciona" className="py-28 bg-[#0A0A0A] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-20">
          <ScrollAnimation animation="fade-up">
            <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
              Como Funciona
            </span>
          </ScrollAnimation>
          <ScrollAnimation animation="fade-up" delay={0.1}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[#EDEDED] leading-tight max-w-5xl mx-auto">
              Como o GestBarber transforma uma barbearia comum em um{" "}
              <span className="text-primary">negócio de alta performance</span>
            </h2>
          </ScrollAnimation>
        </div>

        {/* Steps */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-20" staggerDelay={0.15}>
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <StaggerItem key={step.number}>
                <div className="relative h-full">
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-14 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 via-primary/30 to-transparent" />
                  )}

                  <div className="relative flex flex-col items-center text-center p-8 rounded-3xl bg-gradient-to-b from-[#151515] to-[#111111] border border-primary/10 hover:border-primary/30 transition-all duration-500 h-full hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5">
                    {/* Icon with number */}
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg shadow-primary/20">
                        <Icon className="w-9 h-9 text-black" />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#0A0A0A] border-2 border-primary flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">{step.number}</span>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-bold mb-4 text-[#EDEDED] leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Quote & CTA */}
        <ScrollAnimation animation="fade-up">
          <div className="text-center">
            <div className="inline-block px-10 py-6 rounded-2xl bg-gradient-to-r from-[#151515] to-[#111111] border border-primary/20 mb-10 backdrop-blur-sm">
              <p className="text-xl md:text-2xl lg:text-3xl font-semibold text-primary italic">
                "Você não paga para usar. Você paga quando começa a crescer."
              </p>
            </div>
            
            <div>
              <AuthLinkButton
                size="lg"
                className="bg-gradient-gold hover:opacity-90 text-black font-bold text-lg px-10 py-7 shadow-gold hover:shadow-gold-lg transition-all duration-300 hover:-translate-y-1"
              >
                <TrendingUp className="w-5 h-5 mr-2" />
                Começar agora — é grátis
              </AuthLinkButton>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};
