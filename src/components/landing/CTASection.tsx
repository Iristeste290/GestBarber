import { AuthLinkButton } from "@/components/landing/AuthLinkButton";
import { ArrowRight, Scissors, Sparkles } from "lucide-react";
import { ScrollAnimation } from "./ScrollAnimation";
import { motion } from "framer-motion";

export const CTASection = () => {
  return (
    <section className="py-32 relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-primary/5 to-[#0A0A0A]" />
      
      {/* Animated background elements */}
      <motion.div
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{ 
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]"
      />
      
      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(201,178,124,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(201,178,124,0.02)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-5xl mx-auto">
          <ScrollAnimation animation="scale">
            <div className="text-center p-6 sm:p-10 md:p-20 rounded-2xl sm:rounded-[3rem] bg-gradient-to-b from-[#151515]/80 to-[#111111]/80 border border-primary/20 backdrop-blur-sm shadow-2xl shadow-primary/5">
              {/* Logo */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center mx-auto mb-10 shadow-gold"
              >
                <Scissors className="w-12 h-12 text-black" />
              </motion.div>
              
              {/* Headline */}
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#EDEDED] mb-8 leading-tight"
              >
                Sua barbearia pode ser{" "}
                <span className="text-muted-foreground">apenas mais uma</span>
                <br />
                — ou pode ser uma{" "}
                <span className="text-primary relative">
                  empresa
                  <motion.span
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                    viewport={{ once: true }}
                    className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full origin-left"
                  />
                </span>.
              </motion.h2>
              
              {/* Subheadline */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true }}
                className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed"
              >
                Comece agora gratuitamente e veja em 30 dias como o GestBarber transforma seu negócio.
              </motion.p>
              
              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true }}
              >
                <AuthLinkButton 
                  variant="premium" 
                  size="lg" 
                  className="text-base sm:text-xl px-6 sm:px-14 py-6 sm:py-8 shadow-gold hover:shadow-gold-lg transition-all duration-300 hover:-translate-y-1 w-full sm:w-auto"
                >
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 flex-shrink-0" />
                  <span className="truncate">Criar minha conta</span>
                  <ArrowRight className="ml-2 sm:ml-3 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                </AuthLinkButton>
              </motion.div>
              
              {/* Trust badges */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true }}
                className="mt-10 flex flex-wrap justify-center gap-6 text-muted-foreground"
              >
                {["Sem cartão de crédito", "Acesso completo", "Cancele quando quiser"].map((text, i) => (
                  <span key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {text}
                  </span>
                ))}
              </motion.div>
            </div>
          </ScrollAnimation>
        </div>
      </div>
    </section>
  );
};
