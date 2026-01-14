import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollAnimation } from "./ScrollAnimation";
import { HelpCircle, Headphones } from "lucide-react";

const generalFaqs = [
  {
    question: "O Start é realmente grátis para sempre?",
    answer:
      "Sim, 100% grátis para sempre. Você pode usar agenda, clientes, caixa, barbeiros e serviços sem pagar nada. O plano Start foi feito para organizar sua barbearia. Só existe cobrança se você quiser crescer com o plano Growth.",
  },
  {
    question: "Quando eu preciso pagar?",
    answer:
      "Você só paga quando decide que quer crescer. O plano Growth ativa recursos avançados como o Growth Engine, mapa de clientes, insights de faturamento e IA. Enquanto o Start resolver, você não precisa pagar.",
  },
  {
    question: "O GestBarber é só para agendar?",
    answer:
      "Não! O GestBarber é um sistema completo de gestão e crescimento. Ele organiza sua agenda, mas também analisa seu negócio, identifica oportunidades de faturamento, mostra clientes em risco e te ajuda a tomar decisões baseadas em dados.",
  },
  {
    question: "Funciona para barbearias pequenas?",
    answer:
      "Funciona para qualquer tamanho. Se você trabalha sozinho, o Start resolve. Se tem equipe e quer crescer, o Growth potencializa. O sistema cresce junto com você.",
  },
  {
    question: "Preciso entender de marketing?",
    answer:
      "Não precisa saber nada de marketing. O Growth Engine faz a análise por você e mostra exatamente o que fazer: qual horário está vazio, qual cliente sumiu, onde você está perdendo dinheiro. É só seguir as recomendações.",
  },
  {
    question: "Posso cancelar o Growth quando quiser?",
    answer:
      "Sim, cancela quando quiser sem multa e sem burocracia. Se você voltar para o Start, continua usando o sistema normalmente. O GestBarber cresce junto com o barbeiro — não força nada.",
  },
];

const supportFaqs = [
  {
    question: "O que é o Suporte Growth?",
    answer:
      "O Suporte Growth é um assistente inteligente exclusivo do plano Growth. Ele combina IA que entende seu negócio com acesso a especialistas humanos quando necessário. O foco é ajudar você a crescer, não apenas resolver problemas.",
  },
  {
    question: "Vou falar com uma pessoa de verdade?",
    answer:
      "Sim! Quando necessário, você será atendido por especialistas em crescimento de barbearias. A IA resolve questões simples instantaneamente, e casos mais complexos ou estratégicos são encaminhados para atendimento humano.",
  },
  {
    question: "Em quanto tempo respondem?",
    answer:
      "A IA responde instantaneamente. Quando o atendimento humano é necessário, priorizamos por faturamento e urgência. Usuários Growth com maior movimento recebem atenção prioritária.",
  },
  {
    question: "O que o plano Start não tem?",
    answer:
      "O plano Start não inclui suporte direto. Ele foi feito para você usar o sistema livremente. O Suporte Growth é um benefício exclusivo para barbearias que querem crescer com acompanhamento real.",
  },
  {
    question: "O suporte ajuda com marketing e crescimento?",
    answer:
      "Sim! O foco principal do Suporte Growth é ajudar você a ganhar mais clientes, encher sua agenda e faturar mais. Não é suporte técnico comum — é consultoria de crescimento.",
  },
  {
    question: "Posso pedir ajuda para configurar minha barbearia?",
    answer:
      "Sim. Usuários Growth podem pedir ajuda para configurar agenda, serviços, preços, estratégias de retenção e tudo que impacta seu faturamento.",
  },
];

export const FAQSection = () => {
  return (
    <section id="faq" className="py-24 md:py-32 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A] via-[#0F0F0F] to-[#0A0A0A]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <ScrollAnimation animation="fade-up" className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
            <HelpCircle className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Perguntas Frequentes</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Tire suas <span className="text-primary">dúvidas</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Respondemos as perguntas mais comuns sobre o GestBarber
          </p>
        </ScrollAnimation>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* General FAQs */}
          <ScrollAnimation animation="fade-right" delay={0.1}>
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8 h-full">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </div>
                Sobre o GestBarber
              </h3>
              <Accordion type="single" collapsible className="space-y-3">
                {generalFaqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`general-${index}`}
                    className="border border-white/10 rounded-xl px-4 bg-white/[0.02] data-[state=open]:bg-white/5 transition-colors"
                  >
                    <AccordionTrigger className="text-left text-white hover:text-primary hover:no-underline py-4 text-sm md:text-base">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollAnimation>

          {/* Support FAQs */}
          <ScrollAnimation animation="fade-left" delay={0.2}>
            <div className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl border border-white/10 p-6 md:p-8 h-full">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-primary" />
                </div>
                Suporte e Atendimento
              </h3>
              <Accordion type="single" collapsible className="space-y-3">
                {supportFaqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`support-${index}`}
                    className="border border-white/10 rounded-xl px-4 bg-white/[0.02] data-[state=open]:bg-white/5 transition-colors"
                  >
                    <AccordionTrigger className="text-left text-white hover:text-primary hover:no-underline py-4 text-sm md:text-base">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground pb-4 text-sm leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollAnimation>
        </div>

        {/* CTA to support */}
        <ScrollAnimation animation="fade-up" delay={0.3}>
          <div className="mt-12 text-center">
            <p className="text-muted-foreground mb-4">
              Não encontrou sua resposta?
            </p>
            <Link
              to="/suporte"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-primary/30 transition-all duration-300"
            >
              <Headphones className="w-4 h-4" />
              Fale com nosso suporte
            </Link>
          </div>
        </ScrollAnimation>
      </div>
    </section>
  );
};
