import { Users, CalendarCheck, DollarSign, Building2 } from "lucide-react";

const results = [
  {
    icon: Users,
    title: "Mais clientes",
    value: "+45%",
    description: "de novos agendamentos"
  },
  {
    icon: CalendarCheck,
    title: "Menos faltas",
    value: "-72%",
    description: "de no-shows"
  },
  {
    icon: DollarSign,
    title: "Mais dinheiro",
    value: "+R$2.400",
    description: "por mês em média"
  },
  {
    icon: Building2,
    title: "Negócio profissional",
    value: "100%",
    description: "controle do seu caixa"
  }
];

export const ResultsSection = () => {
  return (
    <section id="resultado" className="py-24 bg-[#0A0A0A]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#EDEDED] mb-6">
            O que muda quando você usa o{" "}
            <span className="text-primary">GestBarber</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Resultados reais de barbearias que deixaram de apenas sobreviver e começaram a crescer.
          </p>
        </div>

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-8 rounded-2xl bg-[#111111] border border-primary/20 hover:border-primary/40 hover:shadow-gold transition-all duration-300 text-center group"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
                <result.icon className="w-8 h-8 text-primary" />
              </div>
              <p className="text-4xl md:text-5xl font-bold text-primary mb-2">
                {result.value}
              </p>
              <h3 className="text-xl font-semibold text-[#EDEDED] mb-2">
                {result.title}
              </h3>
              <p className="text-muted-foreground">
                {result.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
