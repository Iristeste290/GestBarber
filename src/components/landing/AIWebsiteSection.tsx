import { Sparkles, Globe, Search, Smartphone } from "lucide-react";
import { ScrollAnimation } from "./ScrollAnimation";
import { motion } from "framer-motion";

export const AIWebsiteSection = () => {
  return (
    <section className="py-28 bg-[#111111] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px]" />
      
      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Website Mockup */}
          <ScrollAnimation animation="fade-right" className="order-2 lg:order-1">
            <div className="relative">
              {/* Glow behind */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-3xl blur-2xl scale-105" />
              
              <div className="relative aspect-[4/3] rounded-3xl bg-gradient-to-b from-[#0D0D0D] to-[#0A0A0A] border border-primary/20 overflow-hidden p-5 shadow-2xl shadow-primary/5">
                {/* Browser chrome */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-destructive/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
                    <div className="w-3 h-3 rounded-full bg-green-500/70" />
                  </div>
                  <div className="flex-1 h-8 rounded-lg bg-[#1A1A1A] flex items-center px-4">
                    <span className="text-sm text-muted-foreground">suabarbearia.gestbarber.com</span>
                  </div>
                </div>
                
                {/* Website content mockup */}
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#111111] p-6 space-y-5 overflow-hidden">
                  {/* Hero */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    viewport={{ once: true }}
                    className="h-28 rounded-xl bg-gradient-to-r from-primary/20 to-primary/10 flex items-center justify-center border border-primary/10"
                  >
                    <span className="text-primary font-bold text-xl">Barbearia Premium</span>
                  </motion.div>
                  
                  {/* Content blocks */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    viewport={{ once: true }}
                    className="grid grid-cols-3 gap-4"
                  >
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="h-20 rounded-lg bg-[#0A0A0A] border border-white/5" />
                    ))}
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    viewport={{ once: true }}
                    className="h-14 rounded-xl bg-gradient-to-r from-primary/30 to-primary/20 flex items-center justify-center border border-primary/20"
                  >
                    <span className="text-primary font-semibold">Agendar agora</span>
                  </motion.div>
                </div>
              </div>
              
              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: true }}
                className="absolute -top-5 -left-5 p-4 rounded-2xl bg-[#0A0A0A] border border-primary/30 shadow-gold backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <span className="text-sm font-semibold text-primary">Gerado por IA</span>
                </div>
              </motion.div>
              
              {/* Performance badge */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                viewport={{ once: true }}
                className="absolute -bottom-4 -right-4 p-4 rounded-xl bg-[#0A0A0A] border border-green-500/30 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                    <span className="text-green-500 font-bold text-sm">100</span>
                  </div>
                  <span className="text-sm text-green-500 font-medium">PageSpeed</span>
                </div>
              </motion.div>
            </div>
          </ScrollAnimation>

          {/* Content */}
          <ScrollAnimation animation="fade-left" className="order-1 lg:order-2">
            <div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-semibold">IA do Site</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#EDEDED] mb-8 leading-tight">
                Seu site profissional{" "}
                <span className="text-primary">criado automaticamente</span>
              </h2>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed">
                O GestBarber cria um site completo para sua barbearia — otimizado para o Google e pronto para receber clientes.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: Globe, title: "Domínio próprio", desc: "suabarbearia.gestbarber.com" },
                  { icon: Search, title: "SEO otimizado", desc: "Apareça no Google da sua região" },
                  { icon: Smartphone, title: "100% responsivo", desc: "Perfeito em celular e desktop" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-[#0D0D0D] to-[#0A0A0A] border border-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#EDEDED] text-lg">{item.title}</p>
                      <p className="text-muted-foreground">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
};
