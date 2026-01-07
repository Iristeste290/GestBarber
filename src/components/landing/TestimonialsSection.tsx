import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";

import carlosSilvaImg from "@/assets/testimonials/carlos-silva.jpg";
import robertoSantosImg from "@/assets/testimonials/roberto-santos.jpg";
import marcosOliveiraImg from "@/assets/testimonials/marcos-oliveira.jpg";

const testimonials = [
  {
    metric: "70% menos faltas",
    quote:
      "Antes eu perdia 3 horas por dia só respondendo WhatsApp. Agora meus clientes agendam sozinhos e eu foco no que importa: cortar cabelo.",
    name: "Carlos Silva",
    role: "Proprietário - Barbearia Premium",
    location: "São Paulo, SP",
    image: carlosSilvaImg,
  },
  {
    metric: "+40% de lucro",
    quote:
      "Descobri que estava cobrando errado em 3 serviços. Corrigi e meu lucro subiu de R$4.000 para R$5.600 no mesmo mês!",
    name: "Roberto Santos",
    role: "Barbeiro Autônomo",
    location: "Rio de Janeiro, RJ",
    image: robertoSantosImg,
  },
  {
    metric: "+180 clientes/mês",
    quote:
      "Gerencio 3 unidades e 12 profissionais sem stress. Os relatórios me mostram exatamente onde preciso agir.",
    name: "Marcos Oliveira",
    role: "Dono de 3 Barbearias",
    location: "Belo Horizonte, MG",
    image: marcosOliveiraImg,
  },
];

export const TestimonialsSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Resultados reais de quem já usa
          </h2>
          <p className="text-muted-foreground text-lg">
            Não é promessa. São números de barbeiros que transformaram seus negócios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <Badge className="mb-4 bg-gradient-to-r from-primary to-accent">
                  {testimonial.metric}
                </Badge>

                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>

                <p className="text-muted-foreground mb-6 italic">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    <p className="text-xs text-muted-foreground">{testimonial.location}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
