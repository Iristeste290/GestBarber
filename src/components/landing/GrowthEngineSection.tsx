import { Clock, UserMinus, Trophy, Target, ArrowRight, Zap } from "lucide-react";
import { ScrollAnimation, StaggerContainer, StaggerItem } from "./ScrollAnimation";
import { motion } from "framer-motion";

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
    <section id="growth" className="py-28 bg-[#111111] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(201,178,124,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(201,178,124,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-20">
          <ScrollAnimation animation="fade-up">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-6 backdrop-blur-sm">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-semibold">Growth Engine</span>
            </div>
          </ScrollAnimation>
          
          <ScrollAnimation animation="fade-up" delay={0.1}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#EDEDED] mb-6 leading-tight max-w-4xl mx-auto">
              Ele diz exatamente o que fazer{" "}
              <span className="text-primary">hoje</span>{" "}
              para ganhar mais
            </h2>
          </ScrollAnimation>
          
          <ScrollAnimation animation="fade-up" delay={0.2}>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              O motor de crescimento analisa sua barbearia e mostra oportunidades que você está deixando passar.
            </p>
          </ScrollAnimation>
        </div>

        {/* Features Grid */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-16" staggerDelay={0.1}>
          {features.map((feature, index) => (
            <StaggerItem key={index}>
              <div className="group p-8 rounded-3xl bg-gradient-to-b from-[#0D0D0D] to-[#0A0A0A] border border-primary/10 hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5">
                <div className="flex items-start gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <feature.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-[#EDEDED] mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Action Preview */}
        <ScrollAnimation animation="scale">
          <div className="max-w-4xl mx-auto p-8 md:p-10 rounded-3xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20 relative overflow-hidden">
            {/* Animated glow */}
            <motion.div
              animate={{ 
                opacity: [0.5, 1, 0.5],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-primary/10 rounded-full blur-3xl"
            />
            
            <div className="flex flex-col md:flex-row items-center gap-8 relative">
              <div className="flex-1 text-center md:text-left">
                <p className="text-sm text-primary font-semibold tracking-wider uppercase mb-3">Exemplo de Ação</p>
                <p className="text-xl md:text-2xl text-[#EDEDED] leading-relaxed">
                  "Você tem <span className="text-primary font-bold">3 horários vagos</span> amanhã. 
                  Envie uma mensagem para <span className="text-primary font-bold">12 clientes inativos</span>."
                </p>
              </div>
              <button className="flex items-center gap-3 px-6 py-3 rounded-xl bg-primary/20 text-primary font-semibold hover:bg-primary/30 transition-colors group">
                <span>Ver ação</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};
