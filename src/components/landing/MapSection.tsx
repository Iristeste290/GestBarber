import { MapPin, TrendingUp } from "lucide-react";

export const MapSection = () => {
  return (
    <section className="py-24 bg-[#0A0A0A]">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">Mapa de Clientes</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#EDEDED] mb-6">
              Veja no mapa onde estão{" "}
              <span className="text-primary">seus melhores clientes</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Descubra os bairros que mais geram receita e onde você deveria investir em divulgação para crescer ainda mais.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#111111] border border-primary/10">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-[#EDEDED]">Inteligência geográfica</p>
                  <p className="text-sm text-muted-foreground">Veja quais bairros geram mais clientes</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-[#111111] border border-primary/10">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-[#EDEDED]">Hotspots de receita</p>
                  <p className="text-sm text-muted-foreground">Identifique áreas com maior potencial</p>
                </div>
              </div>
            </div>
          </div>

          {/* Map Mockup */}
          <div className="relative">
            <div className="aspect-square rounded-3xl bg-[#111111] border border-primary/20 overflow-hidden p-6">
              {/* Simulated map */}
              <div className="w-full h-full rounded-2xl bg-gradient-to-br from-[#1A1A1A] to-[#0A0A0A] relative overflow-hidden">
                {/* Grid lines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(201,178,124,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(201,178,124,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
                
                {/* Hotspots */}
                <div className="absolute top-1/4 left-1/3 w-16 h-16 rounded-full bg-primary/30 blur-xl animate-pulse" />
                <div className="absolute top-1/2 right-1/4 w-24 h-24 rounded-full bg-primary/40 blur-xl animate-pulse delay-300" />
                <div className="absolute bottom-1/3 left-1/2 w-20 h-20 rounded-full bg-primary/20 blur-xl animate-pulse delay-700" />
                
                {/* Pin markers */}
                <div className="absolute top-1/4 left-1/3 w-4 h-4 rounded-full bg-primary shadow-gold" />
                <div className="absolute top-1/2 right-1/4 w-5 h-5 rounded-full bg-primary shadow-gold" />
                <div className="absolute bottom-1/3 left-1/2 w-3 h-3 rounded-full bg-primary shadow-gold" />
                <div className="absolute top-2/3 left-1/4 w-4 h-4 rounded-full bg-primary/60" />
                <div className="absolute bottom-1/4 right-1/3 w-3 h-3 rounded-full bg-primary/60" />
              </div>
            </div>
            
            {/* Floating stat */}
            <div className="absolute -bottom-4 -right-4 p-4 rounded-2xl bg-[#111111] border border-primary/20 shadow-gold">
              <p className="text-sm text-muted-foreground">Bairro top</p>
              <p className="text-2xl font-bold text-primary">Centro</p>
              <p className="text-sm text-muted-foreground">42 clientes</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
