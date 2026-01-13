import { AuthLinkButton } from "@/components/landing/AuthLinkButton";
import { ArrowRight, TrendingUp, DollarSign, Shield } from "lucide-react";

export const HeroSection = () => {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden bg-[#0A0A0A]"
    >
      {/* Subtle gold gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(201,178,124,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(201,178,124,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="container relative mx-auto px-4 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#111111] border border-primary/20 mb-8">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span className="text-sm text-primary">Sistema de crescimento para barbearias</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight text-[#EDEDED]">
          Pare de gerenciar.{" "}
          <span className="text-primary">
            Comece a crescer.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
          O único sistema para barbearias que mostra onde você está{" "}
          <span className="text-destructive font-medium">perdendo dinheiro</span>{" "}
          — e como{" "}
          <span className="text-primary font-medium">ganhar mais</span>.
        </p>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <AuthLinkButton variant="premium" size="lg" className="text-lg px-10 py-7 shadow-gold">
            Quero meu GestBarber
            <ArrowRight className="ml-2 w-5 h-5" />
          </AuthLinkButton>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111111] border border-primary/10">
            <DollarSign className="w-4 h-4 text-primary" />
            <span>Plano Start grátis para sempre</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111111] border border-primary/10">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>Feito para crescer barbearias</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111111] border border-primary/10">
            <Shield className="w-4 h-4 text-primary" />
            <span>Upgrade apenas quando fizer sentido</span>
          </div>
        </div>
      </div>
    </section>
  );
};
