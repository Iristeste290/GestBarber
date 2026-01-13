import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
    <section id="faq" className="py-20 bg-[#0A0A0A]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-[#EDEDED]">
            Perguntas Frequentes
          </h2>
          <p className="text-[#EDEDED]/60 text-lg">
            Tire suas dúvidas sobre o GestBarber
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-8">
          {/* General FAQs */}
          <Accordion type="single" collapsible className="space-y-4">
            {generalFaqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`general-${index}`}
                className="border border-[#222222] rounded-lg px-6 bg-[#111111]"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline text-[#EDEDED] hover:text-[#C9B27C]">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-[#EDEDED]/70 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* Support FAQs */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-[#C9B27C] flex items-center gap-2">
              <span className="w-8 h-[2px] bg-[#C9B27C]"></span>
              Suporte e Atendimento
            </h3>
            <Accordion type="single" collapsible className="space-y-4">
              {supportFaqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`support-${index}`}
                  className="border border-[#222222] rounded-lg px-6 bg-[#111111]"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline text-[#EDEDED] hover:text-[#C9B27C]">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-[#EDEDED]/70 leading-relaxed">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-[#EDEDED]/50 text-sm">
            Ainda tem dúvidas?{" "}
            <Link to="/suporte" className="text-[#C9B27C] hover:underline">
              Fale com nosso suporte
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
};
