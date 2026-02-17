import { UserX, CalendarX, Wallet, RotateCcw } from "lucide-react";
import { ScrollAnimation, StaggerContainer, StaggerItem } from "./ScrollAnimation";

const problems = [
  {
    icon: UserX,
    title: "Clientes faltam",
    description: "E você perde dinheiro esperando quem não vem."
  },
  {
    icon: CalendarX,
    title: "Agenda vazia",
    description: "Horários mortos que poderiam estar gerando receita."
  },
  {
    icon: Wallet,
    title: "Caixa desorganizado",
    description: "Você não sabe quanto entra, quanto sai, quanto sobra."
  },
  {
    icon: RotateCcw,
    title: "Ninguém volta",
    description: "Clientes somem e você nem percebe."
  }
];

export const ProblemsSection = () => {
  return (
    <section id="problema" className="py-28 bg-[#0A0A0A] relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-destructive/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-destructive/3 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-20">
          <ScrollAnimation animation="fade-up">
            <span className="inline-block text-destructive text-sm font-semibold tracking-wider uppercase mb-4">
              O Desafio
            </span>
          </ScrollAnimation>
          <ScrollAnimation animation="fade-up" delay={0.1}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#EDEDED] mb-6 leading-tight">
              O problema que ninguém fala
            </h2>
          </ScrollAnimation>
          <ScrollAnimation animation="fade-up" delay={0.2}>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Você trabalha muito, mas não sabe exatamente{" "}
              <span className="text-destructive font-semibold">por quê não sobra dinheiro</span>.
            </p>
          </ScrollAnimation>
        </div>

        {/* Problem Cards */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {problems.map((problem, index) => (
            <StaggerItem key={index}>
              <div className="group h-full p-8 rounded-3xl bg-gradient-to-b from-[#151515] to-[#111111] border border-destructive/10 hover:border-destructive/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-destructive/5">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6 group-hover:bg-destructive/20 group-hover:scale-110 transition-all duration-300">
                  <problem.icon className="w-7 h-7 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-[#EDEDED] mb-3">
                  {problem.title}
                </h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {problem.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* The Turn */}
        <ScrollAnimation animation="scale">
          <div className="max-w-4xl mx-auto text-center p-6 sm:p-10 md:p-16 rounded-2xl sm:rounded-[2rem] bg-gradient-to-br from-[#151515] via-[#111111] to-[#0D0D0D] border border-primary/20 relative overflow-hidden">
            {/* Glow effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-primary/10 blur-3xl" />
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-2xl" />
            
            <div className="relative">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#EDEDED] mb-6 leading-tight">
                O GestBarber <span className="text-primary">não é uma agenda</span>.
              </h3>
              <p className="text-xl md:text-2xl text-muted-foreground">
                É um <span className="text-primary font-semibold">painel de controle</span> do seu negócio.
              </p>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};
