import { Clock, UserMinus, Trophy, Target, ArrowRight, Zap } from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "Horários vazios",
    description: "Veja quais horários estão ociosos e preencha com um clique."
  },
  {
    icon: UserMinus,
    title: "Clientes sumidos",
    description: "Saiba quem não aparece há mais de 30 dias e reative."
  },
  {
    icon: Trophy,
    title: "Seu ranking",
    description: "Descubra como sua barbearia se compara com outras da região."
  },
  {
    icon: Target,
    title: "Oportunidades",
    description: "O sistema mostra exatamente o que fazer para faturar mais."
  }
];

export const GrowthEngineSection = () => {
  return (
    <section id="growth" className="py-24 bg-[#111111]">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Growth Engine</span>
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#EDEDED] mb-6">
            Ele diz exatamente o que fazer{" "}
            <span className="text-primary">hoje</span>{" "}
            para ganhar mais
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            O motor de crescimento analisa sua barbearia e mostra oportunidades que você está deixando passar.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-[#0A0A0A] border border-primary/10 hover:border-primary/30 transition-all duration-300 group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-[#EDEDED] mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Action Preview */}
        <div className="mt-16 max-w-3xl mx-auto p-6 md:p-8 rounded-2xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 text-center md:text-left">
              <p className="text-sm text-primary font-medium mb-2">EXEMPLO DE AÇÃO</p>
              <p className="text-lg text-[#EDEDED]">
                "Você tem <span className="text-primary font-bold">3 horários vagos</span> amanhã. 
                Envie uma mensagem para <span className="text-primary font-bold">12 clientes inativos</span>."
              </p>
            </div>
            <div className="flex items-center gap-2 text-primary">
              <span className="font-medium">Ver ação</span>
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
