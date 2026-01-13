import { AuthLinkButton } from "@/components/landing/AuthLinkButton";
import { ArrowRight, Scissors } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-[#0A0A0A] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-gold">
            <Scissors className="w-10 h-10 text-primary-foreground" />
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#EDEDED] mb-6 leading-tight">
            Sua barbearia pode ser{" "}
            <span className="text-muted-foreground">apenas mais uma</span>
            <br />
            — ou pode ser uma{" "}
            <span className="text-primary">empresa</span>.
          </h2>
          
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Comece agora gratuitamente e veja em 30 dias como o GestBarber transforma seu negócio.
          </p>
          
          <AuthLinkButton variant="premium" size="lg" className="text-lg px-12 py-8 shadow-gold">
            Criar minha conta no GestBarber
            <ArrowRight className="ml-2 w-6 h-6" />
          </AuthLinkButton>
          
          <p className="mt-6 text-sm text-muted-foreground">
            Sem cartão de crédito • Acesso completo • Cancele quando quiser
          </p>
        </div>
      </div>
    </section>
  );
};
