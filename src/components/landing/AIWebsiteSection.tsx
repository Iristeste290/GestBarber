import { Sparkles, Globe, Search, Smartphone } from "lucide-react";

export const AIWebsiteSection = () => {
  return (
    <section className="py-24 bg-[#111111]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Website Mockup */}
          <div className="order-2 lg:order-1 relative">
            <div className="aspect-[4/3] rounded-3xl bg-[#0A0A0A] border border-primary/20 overflow-hidden p-4">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-destructive/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <div className="flex-1 h-6 rounded-md bg-[#1A1A1A] flex items-center px-3">
                  <span className="text-xs text-muted-foreground">suabarbearia.gestbarber.com</span>
                </div>
              </div>
              
              {/* Website content mockup */}
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#111111] p-6 space-y-4">
                {/* Hero */}
                <div className="h-24 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">Barbearia Premium</span>
                </div>
                {/* Content blocks */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="h-16 rounded-lg bg-[#0A0A0A]" />
                  <div className="h-16 rounded-lg bg-[#0A0A0A]" />
                  <div className="h-16 rounded-lg bg-[#0A0A0A]" />
                </div>
                <div className="h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="text-sm text-primary">Agendar agora</span>
                </div>
              </div>
            </div>
            
            {/* Floating badge */}
            <div className="absolute -top-4 -left-4 p-4 rounded-2xl bg-[#0A0A0A] border border-primary/20 shadow-gold">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-primary">Gerado por IA</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">IA do Site</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#EDEDED] mb-6">
              Seu site profissional{" "}
              <span className="text-primary">criado automaticamente</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              O GestBarber cria um site completo para sua barbearia — otimizado para o Google e pronto para receber clientes.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0A0A0A] border border-primary/10">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-[#EDEDED]">Domínio próprio</p>
                  <p className="text-sm text-muted-foreground">suabarbearia.gestbarber.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0A0A0A] border border-primary/10">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Search className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-[#EDEDED]">SEO otimizado</p>
                  <p className="text-sm text-muted-foreground">Apareça no Google da sua região</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0A0A0A] border border-primary/10">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-[#EDEDED]">100% responsivo</p>
                  <p className="text-sm text-muted-foreground">Perfeito em celular e desktop</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
