import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const steps = [
  {
    number: 1,
    title: "Crie sua barbearia",
    description: "Cadastre-se em menos de 2 minutos. Sem cartão de crédito, sem compromisso.",
  },
  {
    number: 2,
    title: "Cadastre serviços e profissionais",
    description: "Adicione seus serviços, horários, produtos e profissionais da equipe.",
  },
  {
    number: 3,
    title: "Organize agenda e caixa",
    description: "Gerencie agendamentos, controle financeiro e acompanhe tudo em tempo real.",
  },
  {
    number: 4,
    title: "Tenha controle total",
    description: "Relatórios, métricas e gestão completa para aumentar seu faturamento.",
  },
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Como funciona</h2>
          <p className="text-muted-foreground text-lg">
            Comece a usar o GestBarber em 4 passos simples
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto mb-12">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary/50 to-primary/10" />
              )}

              <div className="relative flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg">
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/auth">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8"
            >
              Criar minha barbearia agora
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">
            +2.500 barbearias confiam no GestBarber
          </p>
        </div>
      </div>
    </section>
  );
};
