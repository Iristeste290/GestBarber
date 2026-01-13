import { AuthLinkButton } from "@/components/landing/AuthLinkButton";
import { Briefcase, BarChart3, Brain, TrendingUp } from "lucide-react";

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
    <section id="como-funciona" className="py-20 bg-[#0A0A0A]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#EDEDED]">
            Como o GestBarber transforma uma barbearia comum em um{" "}
            <span className="text-[#C9B27C]">negócio de alta performance</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-16">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={step.number} className="relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-[#C9B27C]/50 to-[#C9B27C]/10" />
                )}

                <div className="relative flex flex-col items-center text-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#C9B27C] to-[#E8D9A8] flex items-center justify-center mb-4 shadow-lg shadow-[#C9B27C]/20">
                    <Icon className="w-8 h-8 text-black" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-[#0A0A0A] border-2 border-[#C9B27C] flex items-center justify-center">
                    <span className="text-[#C9B27C] font-bold text-sm">{step.number}</span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-[#EDEDED]">
                    {step.title}
                  </h3>
                  <p className="text-sm text-[#EDEDED]/60">{step.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <div className="inline-block px-8 py-4 rounded-xl bg-[#111111] border border-[#C9B27C]/30 mb-8">
            <p className="text-xl md:text-2xl font-semibold text-[#C9B27C]">
              "Você não paga para usar. Você paga quando começa a crescer."
            </p>
          </div>
          
          <div>
            <AuthLinkButton
              size="lg"
              className="bg-[#C9B27C] hover:bg-[#C9B27C]/90 text-black font-bold text-lg px-8"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Começar agora — é grátis
            </AuthLinkButton>
          </div>
        </div>
      </div>
    </section>
  );
};
