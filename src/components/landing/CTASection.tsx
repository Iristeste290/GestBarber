import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-accent/10 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />

      <div className="container relative mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Pare de perder dinheiro.{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Organize sua barbearia hoje.
          </span>
        </h2>

        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          Mais de 2.500 donos de barbearia já transformaram seus negócios. Você é o próximo.
        </p>

        <Link to="/auth">
          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-lg px-10 py-6 shadow-lg"
          >
            Testar grátis por 30 dias
          </Button>
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
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

        <p className="text-sm text-muted-foreground mt-6">
          247 pessoas se cadastraram hoje
        </p>
      </div>
    </section>
  );
};
