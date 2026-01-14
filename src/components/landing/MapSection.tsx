import { MapPin, TrendingUp } from "lucide-react";
import { ScrollAnimation } from "./ScrollAnimation";
import { motion } from "framer-motion";

export const MapSection = () => {
  return (
    <section className="py-28 bg-[#0A0A0A] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <ScrollAnimation animation="fade-right">
            <div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm">
                <MapPin className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-semibold">Mapa de Clientes</span>
              </div>
              
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#EDEDED] mb-8 leading-tight">
                Veja no mapa onde estão{" "}
                <span className="text-primary">seus melhores clientes</span>
              </h2>
              
              <p className="text-xl md:text-2xl text-muted-foreground mb-10 leading-relaxed">
                Descubra os bairros que mais geram receita e onde você deveria investir em divulgação para crescer ainda mais.
              </p>
              
              <div className="space-y-4">
                {[
                  { icon: TrendingUp, title: "Inteligência geográfica", desc: "Veja quais bairros geram mais clientes" },
                  { icon: MapPin, title: "Hotspots de receita", desc: "Identifique áreas com maior potencial" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 8 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-center gap-5 p-5 rounded-2xl bg-gradient-to-r from-[#151515] to-[#111111] border border-primary/10 hover:border-primary/30 transition-colors cursor-pointer"
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

          {/* Map Mockup */}
          <ScrollAnimation animation="fade-left">
            <div className="relative">
              {/* Glow behind */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-[2rem] blur-2xl scale-105" />
              
              <div className="relative aspect-square rounded-[2rem] bg-gradient-to-b from-[#151515] to-[#111111] border border-primary/20 overflow-hidden p-8 shadow-2xl shadow-primary/5">
                {/* Simulated map */}
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] relative overflow-hidden">
                  {/* Grid lines */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(201,178,124,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(201,178,124,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
                  
                  {/* Animated Hotspots */}
                  {[
                    { top: "25%", left: "33%", size: 80, delay: 0 },
                    { top: "50%", right: "25%", size: 100, delay: 0.3 },
                    { bottom: "33%", left: "50%", size: 90, delay: 0.6 },
                  ].map((spot, i) => (
                    <motion.div
                      key={i}
                      animate={{ 
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        delay: spot.delay
                      }}
                      style={spot}
                      className="absolute bg-primary/30 rounded-full blur-xl"
                    />
                  ))}
                  
                  {/* Pin markers */}
                  {[
                    { top: "25%", left: "33%", size: 16 },
                    { top: "50%", right: "25%", size: 20 },
                    { bottom: "33%", left: "50%", size: 14 },
                    { top: "66%", left: "25%", size: 12 },
                    { bottom: "25%", right: "33%", size: 10 },
                  ].map((pin, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 + i * 0.1 }}
                      style={{
                        ...pin,
                        width: pin.size,
                        height: pin.size,
                      }}
                      className="absolute rounded-full bg-primary shadow-gold"
                    />
                  ))}
                </div>
              </div>
              
              {/* Floating stat card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
                className="absolute -bottom-6 -right-6 p-5 rounded-2xl bg-[#111111] border border-primary/30 shadow-gold backdrop-blur-sm"
              >
                <p className="text-sm text-muted-foreground mb-1">Bairro top</p>
                <p className="text-3xl font-bold text-primary">Centro</p>
                <p className="text-sm text-muted-foreground">42 clientes • R$ 4.800/mês</p>
              </motion.div>
              
              {/* Second floating card */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                className="absolute -top-4 -left-4 p-4 rounded-xl bg-[#111111] border border-green-500/30 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm text-green-500 font-medium">+15% este mês</span>
                </div>
              </motion.div>
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
};
