import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

export const HeroSection = () => {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-muted-foreground">+2.500 barbearias já usam</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Sua barbearia{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            organizada
          </span>
          , seu lucro{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-primary">
            garantido
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Chega de agenda no WhatsApp e caixa desorganizado. Com o GestBarber você controla tudo em um só lugar e fatura mais.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link to="/auth">
            <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-8 py-6">
              Começar agora — é grátis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6"
            onClick={() => {
              const element = document.getElementById("planos");
              if (element) element.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Ver Planos
          </Button>
        </div>

        {/* Trust indicators */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            <span>Sem cartão de crédito</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            <span>Acesso completo</span>
          </div>
          <div className="flex items-center gap-1">
            <Check className="w-4 h-4 text-green-500" />
            <span>Cancele quando quiser</span>
          </div>
        </div>
      </div>
    </section>
  );
};
