import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin } from "lucide-react";

import carlosSilvaImg from "@/assets/testimonials/carlos-silva.jpg";
import robertoSantosImg from "@/assets/testimonials/roberto-santos.jpg";
import marcosOliveiraImg from "@/assets/testimonials/marcos-oliveira.jpg";

const testimonials = [
  {
    metric: "+45% de faturamento",
    quote:
      "Depois que comecei a usar o GestBarber, parei de ter horários vazios e aumentei meu faturamento. O Growth Engine me mostrou exatamente onde eu estava perdendo dinheiro.",
    barbershopName: "Barbearia Alpha",
    location: "São Paulo, SP",
    image: carlosSilvaImg,
  },
  {
    metric: "Zero faltas por mês",
    quote:
      "Antes eu perdia 5 clientes por semana com faltas. Agora o sistema me avisa quem tem histórico ruim e eu consigo agir antes. Simplesmente mudou meu negócio.",
    barbershopName: "Corte & Estilo",
    location: "Rio de Janeiro, RJ",
    image: robertoSantosImg,
  },
  {
    metric: "+80 clientes novos",
    quote:
      "O mapa de clientes me mostrou que eu não tinha nenhum cliente de um bairro vizinho. Fiz uma ação focada e ganhei 80 clientes em 2 meses.",
    barbershopName: "Barbearia do Marcos",
    location: "Belo Horizonte, MG",
    image: marcosOliveiraImg,
  },
];

export const TestimonialsSection = () => {
  return (
    <section id="resultados" className="py-20 bg-[#0F0F0F]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#EDEDED]">
            Resultados reais de quem já usa o <span className="text-[#C9B27C]">GestBarber</span>
          </h2>
          <p className="text-[#EDEDED]/60 text-lg">
            Não é promessa. São números de barbeiros que transformaram seus negócios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {testimonials.map((testimonial) => (
            <Card
              key={testimonial.barbershopName}
              className="bg-[#111111] border-[#222222] hover:border-[#C9B27C]/30 transition-all duration-300"
            >
              <CardContent className="p-6">
                <Badge className="mb-4 bg-gradient-to-r from-[#C9B27C] to-[#E8D9A8] text-black font-semibold">
                  {testimonial.metric}
                </Badge>

                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-[#C9B27C] text-[#C9B27C]"
                    />
                  ))}
                </div>

                <p className="text-[#EDEDED]/80 mb-6 italic leading-relaxed">
                  "{testimonial.quote}"
                </p>

                <div className="flex items-center gap-3">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.barbershopName}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#C9B27C]/30"
                  />
                  <div>
                    <p className="font-semibold text-[#EDEDED]">{testimonial.barbershopName}</p>
                    <p className="text-sm text-[#EDEDED]/50 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {testimonial.location}
                    </p>
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
