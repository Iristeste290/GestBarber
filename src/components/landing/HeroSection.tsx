import { motion } from "framer-motion";
import { useEffect } from "react";
import { AuthLinkButton } from "@/components/landing/AuthLinkButton";
import { ArrowRight, TrendingUp, DollarSign, Shield } from "lucide-react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'wistia-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        'media-id'?: string;
        aspect?: string;
        'controls-visible-on-load'?: string;
      }, HTMLElement>;
    }
  }
}

export const HeroSection = () => {
  useEffect(() => {
    // Load Wistia scripts
    if (!document.querySelector('script[src*="fast.wistia.com/player.js"]')) {
      const playerScript = document.createElement('script');
      playerScript.src = 'https://fast.wistia.com/player.js';
      playerScript.async = true;
      document.head.appendChild(playerScript);
    }
    if (!document.querySelector('script[src*="ykc48s8kp3"]')) {
      const embedScript = document.createElement('script');
      embedScript.src = 'https://fast.wistia.com/embed/ykc48s8kp3.js';
      embedScript.async = true;
      embedScript.type = 'module';
      document.head.appendChild(embedScript);
    }
  }, []);
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#0A0A0A]"
    >
      {/* Animated gradient orbs */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/8 rounded-full blur-[120px]"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
        className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-primary/6 rounded-full blur-[100px]"
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.5 }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full"
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(201,178,124,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(201,178,124,0.02)_1px,transparent_1px)] bg-[size:80px_80px]" />

      <div className="container relative mx-auto px-6 lg:px-12 xl:px-16 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left space-y-8">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111]/80 border border-primary/20 backdrop-blur-sm"
            >
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-primary font-medium">Sistema de crescimento para barbearias</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-bold leading-[1.1] text-[#EDEDED]"
            >
              Pare de gerenciar.{" "}
              <span className="text-primary relative">
                Comece a crescer.
                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.8, delay: 0.8 }}
                  className="absolute -bottom-2 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50 rounded-full origin-left"
                />
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground max-w-lg mx-auto lg:mx-0 leading-relaxed"
            >
              O único sistema para barbearias que mostra onde você está{" "}
              <span className="text-destructive font-medium">perdendo dinheiro</span>{" "}
              — e como{" "}
              <span className="text-primary font-medium">ganhar mais</span>.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex items-center justify-center lg:justify-start"
            >
              <AuthLinkButton 
                variant="premium" 
                size="lg" 
                className="text-lg px-10 py-7 shadow-gold hover:shadow-gold-lg transition-all duration-300 hover:-translate-y-1"
              >
                Quero meu GestBarber
                <ArrowRight className="ml-2 w-5 h-5" />
              </AuthLinkButton>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-3"
            >
              {[
                { icon: DollarSign, text: "Plano Start grátis" },
                { icon: TrendingUp, text: "Feito para crescer" },
                { icon: Shield, text: "Upgrade quando fizer sentido" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#111111]/60 border border-primary/10 backdrop-blur-sm"
                >
                  <item.icon className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right - Video */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative"
          >
            <div className="relative">
              {/* Glow effect behind */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl blur-3xl scale-105" />
              
              {/* Wistia Video */}
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 border border-primary/20">
                <div className="relative w-full">
                  {/* Wistia Player */}
                  <wistia-player
                    media-id="ykc48s8kp3"
                    aspect="1.7777777777777777"
                    controls-visible-on-load="false"
                    style={{ width: '100%', display: 'block' }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:flex flex-col items-center gap-2"
        >
          <span className="text-xs text-muted-foreground">Role para descobrir</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 rounded-full border border-primary/30 flex items-start justify-center p-2"
          >
            <motion.div className="w-1.5 h-3 bg-primary rounded-full" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
