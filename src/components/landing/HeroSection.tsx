import { motion } from "framer-motion";
import { AuthLinkButton } from "@/components/landing/AuthLinkButton";
import { ArrowRight, TrendingUp, DollarSign, Shield, Play } from "lucide-react";

export const HeroSection = () => {
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

      <div className="container relative mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#111111]/80 border border-primary/20 mb-8 backdrop-blur-sm"
            >
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-sm text-primary font-medium">Sistema de crescimento para barbearias</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-[1.1] text-[#EDEDED]"
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
              className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0 mb-10 leading-relaxed"
            >
              O único sistema para barbearias que mostra onde você está{" "}
              <span className="text-destructive font-medium">perdendo dinheiro</span>{" "}
              — e como{" "}
              <span className="text-primary font-medium">ganhar mais</span>.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mb-12"
            >
              <AuthLinkButton 
                variant="premium" 
                size="lg" 
                className="text-lg px-10 py-7 shadow-gold hover:shadow-gold-lg transition-all duration-300 hover:-translate-y-1"
              >
                Quero meu GestBarber
                <ArrowRight className="ml-2 w-5 h-5" />
              </AuthLinkButton>
              <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors group">
                <span className="w-12 h-12 rounded-full border border-primary/30 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                  <Play className="w-4 h-4 text-primary ml-0.5" />
                </span>
                <span className="font-medium">Ver como funciona</span>
              </button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-wrap items-center justify-center lg:justify-start gap-4"
            >
              {[
                { icon: DollarSign, text: "Plano Start grátis" },
                { icon: TrendingUp, text: "Feito para crescer" },
                { icon: Shield, text: "Upgrade quando fizer sentido" },
              ].map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111111]/60 border border-primary/10 backdrop-blur-sm"
                >
                  <item.icon className="w-4 h-4 text-primary" />
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right - App Mockup */}
          <motion.div
            initial={{ opacity: 0, x: 50, rotateY: -10 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="relative hidden lg:block"
          >
            {/* Main dashboard mockup */}
            <div className="relative">
              {/* Glow effect behind */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 rounded-3xl blur-3xl scale-105" />
              
              {/* Dashboard frame */}
              <div className="relative rounded-3xl bg-[#111111] border border-primary/20 overflow-hidden shadow-2xl shadow-primary/10">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#0A0A0A] border-b border-primary/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <div className="flex-1 h-7 rounded-lg bg-[#1A1A1A] flex items-center px-3">
                    <span className="text-xs text-muted-foreground">app.gestbarber.com</span>
                  </div>
                </div>
                
                {/* Dashboard content */}
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="h-4 w-32 bg-primary/20 rounded" />
                      <div className="h-3 w-48 bg-[#1A1A1A] rounded mt-2" />
                    </div>
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <div className="w-5 h-5 rounded-full bg-primary" />
                    </div>
                  </div>
                  
                  {/* Stats cards */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { value: "R$ 4.850", label: "Faturamento", color: "from-primary/20 to-primary/10" },
                      { value: "+23%", label: "Crescimento", color: "from-green-500/20 to-green-500/10" },
                      { value: "89%", label: "Ocupação", color: "from-blue-500/20 to-blue-500/10" },
                    ].map((stat, i) => (
                      <div key={i} className={`p-4 rounded-xl bg-gradient-to-br ${stat.color} border border-white/5`}>
                        <p className="text-lg font-bold text-[#EDEDED]">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                  
                  {/* Chart placeholder */}
                  <div className="h-32 rounded-xl bg-[#0A0A0A] border border-primary/10 p-4">
                    <div className="flex items-end justify-between h-full gap-2">
                      {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                        <motion.div
                          key={i}
                          initial={{ height: 0 }}
                          animate={{ height: `${h}%` }}
                          transition={{ duration: 0.8, delay: 0.8 + i * 0.1 }}
                          className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating notification card */}
              <motion.div
                initial={{ opacity: 0, x: 20, y: 20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="absolute -right-4 -bottom-4 p-4 rounded-2xl bg-[#111111] border border-primary/30 shadow-gold backdrop-blur-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#EDEDED]">+R$ 1.200</p>
                    <p className="text-xs text-muted-foreground">esta semana</p>
                  </div>
                </div>
              </motion.div>
              
              {/* Floating alert card */}
              <motion.div
                initial={{ opacity: 0, x: -20, y: -20 }}
                animate={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.6, delay: 1.4 }}
                className="absolute -left-8 top-1/3 p-3 rounded-xl bg-[#111111] border border-primary/20 shadow-lg backdrop-blur-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                  <span className="text-xs text-primary font-medium">3 horários vazios hoje</span>
                </div>
              </motion.div>
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
