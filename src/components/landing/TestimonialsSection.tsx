import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollAnimation } from "./ScrollAnimation";
import { motion, AnimatePresence } from "framer-motion";

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
  {
    metric: "+R$ 4.500/mês",
    quote:
      "Eu não sabia que estava perdendo tanto dinheiro com horários vazios. O GestBarber me mostrou e agora recupero mais de R$ 4.500 todo mês que antes ia pro ralo.",
    barbershopName: "Barber House",
    location: "Curitiba, PR",
    image: carlosSilvaImg,
  },
  {
    metric: "3x mais retenção",
    quote:
      "Meus clientes voltam muito mais. O sistema de fidelidade e os lembretes automáticos fizeram toda a diferença. Triplicamos a taxa de retorno.",
    barbershopName: "Studio Corte Fino",
    location: "Porto Alegre, RS",
    image: robertoSantosImg,
  },
  {
    metric: "Agenda sempre cheia",
    quote:
      "Trabalhava com 60% da agenda preenchida. Hoje é difícil ter horário vago. O Growth Engine identifica oportunidades que eu nunca enxergaria sozinho.",
    barbershopName: "Barbearia Premium",
    location: "Brasília, DF",
    image: marcosOliveiraImg,
  },
  {
    metric: "-70% no-shows",
    quote:
      "O score de cliente foi um divisor de águas. Agora sei quem tem histórico de faltar e posso pedir confirmação antecipada. Reduzi drasticamente as faltas.",
    barbershopName: "Classic Barber",
    location: "Salvador, BA",
    image: carlosSilvaImg,
  },
  {
    metric: "+120 avaliações",
    quote:
      "O GestBarber me ajudou a pedir avaliações no momento certo. Saltei de 15 para 135 avaliações no Google em 3 meses. Agora apareço em primeiro nas buscas.",
    barbershopName: "Navalha de Ouro",
    location: "Fortaleza, CE",
    image: robertoSantosImg,
  },
  {
    metric: "2 novas unidades",
    quote:
      "Com os dados do GestBarber, identifiquei bairros com demanda e abri 2 novas unidades. Hoje tenho 3 barbearias e o sistema gerencia tudo.",
    barbershopName: "Rede Barber King",
    location: "Recife, PE",
    image: marcosOliveiraImg,
  },
];

// Social proof stats
const stats = [
  { value: "2.500+", label: "Barbearias Ativas" },
  { value: "98%", label: "Satisfação" },
  { value: "50k+", label: "Agendamentos/Mês" },
];

export const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Show 3 testimonials at a time on desktop, 1 on mobile
  const getVisibleCount = () => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768 ? 3 : 1;
    }
    return 3;
  };
  
  const [visibleCount, setVisibleCount] = useState(getVisibleCount());
  
  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const maxIndex = testimonials.length - visibleCount;

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next, isPaused]);

  const visibleTestimonials = testimonials.slice(currentIndex, currentIndex + visibleCount);
  
  // Handle edge case when we're near the end
  if (visibleTestimonials.length < visibleCount) {
    const remaining = visibleCount - visibleTestimonials.length;
    visibleTestimonials.push(...testimonials.slice(0, remaining));
  }

  return (
    <section id="resultados" className="py-28 bg-[#0F0F0F] relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <div className="text-center mb-16">
          <ScrollAnimation animation="fade-up">
            <span className="inline-block text-primary text-sm font-semibold tracking-wider uppercase mb-4">
              Resultados Reais
            </span>
          </ScrollAnimation>
          <ScrollAnimation animation="fade-up" delay={0.1}>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-[#EDEDED] leading-tight">
              Quem usa, <span className="text-primary">cresce</span>
            </h2>
          </ScrollAnimation>
          <ScrollAnimation animation="fade-up" delay={0.2}>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              Não é promessa. São números de barbeiros que transformaram seus negócios.
            </p>
          </ScrollAnimation>
        </div>

        {/* Stats */}
        <ScrollAnimation animation="fade-up" delay={0.3}>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-20">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <p className="text-4xl md:text-5xl font-bold text-primary mb-2">{stat.value}</p>
                <p className="text-muted-foreground text-lg">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </ScrollAnimation>

        {/* Testimonial Carousel */}
        <div 
          className="relative max-w-7xl mx-auto"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Navigation Buttons */}
          <button
            onClick={prev}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-6 z-10 w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white hover:bg-primary/20 hover:border-primary/30 transition-all duration-300 shadow-lg"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-6 z-10 w-12 h-12 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center text-white hover:bg-primary/20 hover:border-primary/30 transition-all duration-300 shadow-lg"
            aria-label="Próximo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Cards Container */}
          <div className="overflow-hidden px-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6"
              >
                {visibleTestimonials.map((testimonial, index) => (
                  <Card 
                    key={`${currentIndex}-${index}`}
                    className="h-full bg-gradient-to-b from-[#151515] to-[#111111] border-[#222222] hover:border-primary/30 transition-all duration-500 hover:-translate-y-2 hover:shadow-xl hover:shadow-primary/5 overflow-hidden group"
                  >
                    <CardContent className="p-8 flex flex-col h-full">
                      {/* Metric Badge */}
                      <Badge className="self-start mb-6 bg-gradient-to-r from-primary to-primary/80 text-black font-bold text-sm py-1.5 px-4">
                        {testimonial.metric}
                      </Badge>

                      {/* Stars */}
                      <div className="flex gap-1 mb-6">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className="w-5 h-5 fill-primary text-primary"
                          />
                        ))}
                      </div>

                      {/* Quote */}
                      <div className="relative flex-1 mb-8">
                        <Quote className="absolute -top-2 -left-2 w-10 h-10 text-primary/10" />
                        <p className="text-[#EDEDED]/90 text-lg leading-relaxed italic relative z-10">
                          "{testimonial.quote}"
                        </p>
                      </div>

                      {/* Author */}
                      <div className="flex items-center gap-4 pt-6 border-t border-primary/10">
                        <div className="relative">
                          <img 
                            src={testimonial.image} 
                            alt={testimonial.barbershopName}
                            className="w-14 h-14 rounded-full object-cover border-2 border-primary/30 group-hover:border-primary/50 transition-colors"
                          />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-[#111111]" />
                        </div>
                        <div>
                          <p className="font-bold text-[#EDEDED] text-lg">{testimonial.barbershopName}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {testimonial.location}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: Math.ceil(testimonials.length / visibleCount) }).map((_, index) => {
              const isActive = Math.floor(currentIndex / visibleCount) === index || 
                (index === 0 && currentIndex < visibleCount);
              return (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index * visibleCount)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    isActive 
                      ? 'w-8 bg-primary' 
                      : 'bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Ir para página ${index + 1}`}
                />
              );
            })}
          </div>
        </div>

        {/* Trust logos */}
        <ScrollAnimation animation="fade-up" delay={0.4}>
          <div className="mt-20 text-center">
            <p className="text-sm text-muted-foreground mb-8">Barbearias de todo o Brasil confiam no GestBarber</p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 opacity-40">
              {["Alpha", "Premium", "Elite", "Classic", "Modern", "Vintage"].map((name, i) => (
                <div key={i} className="text-xl md:text-2xl font-bold text-[#EDEDED]/50">
                  {name}
                </div>
              ))}
            </div>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};
