import { UserX, CalendarX, Wallet, RotateCcw } from "lucide-react";

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
    <section id="problema" className="py-24 bg-[#0A0A0A]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#EDEDED] mb-6">
            O problema que ninguém fala
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Você trabalha muito, mas não sabe exatamente{" "}
            <span className="text-destructive font-medium">por quê não sobra dinheiro</span>.
          </p>
        </div>

        {/* Problem Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {problems.map((problem, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-[#111111] border border-destructive/20 hover:border-destructive/40 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4 group-hover:bg-destructive/20 transition-colors">
                <problem.icon className="w-6 h-6 text-destructive" />
              </div>
              <h3 className="text-xl font-semibold text-[#EDEDED] mb-2">
                {problem.title}
              </h3>
              <p className="text-muted-foreground">
                {problem.description}
              </p>
            </div>
          ))}
        </div>

        {/* The Turn */}
        <div className="max-w-4xl mx-auto text-center p-8 md:p-12 rounded-3xl bg-gradient-to-br from-[#111111] to-[#1A1A1A] border border-primary/20">
          <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#EDEDED] mb-4">
            O GestBarber <span className="text-primary">não é uma agenda</span>.
          </h3>
          <p className="text-xl text-muted-foreground">
            É um <span className="text-primary font-medium">painel de controle</span> do seu negócio.
          </p>
        </div>
      </div>
    </section>
  );
};
