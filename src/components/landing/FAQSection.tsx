import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Como funciona o período de teste grátis?",
    answer:
      "Você tem 30 dias para testar todas as funcionalidades do GestBarber sem pagar nada. Não pedimos cartão de crédito para começar. Se gostar, escolhe um plano. Se não, cancela sem burocracia.",
  },
  {
    question: "Posso cancelar a qualquer momento?",
    answer:
      "Sim! Não existe fidelidade ou multa. Você pode cancelar quando quiser direto pelo sistema, sem precisar falar com ninguém.",
  },
  {
    question: "Vocês oferecem suporte técnico?",
    answer:
      "Sim! Nossa equipe está disponível 24/7 via chat e WhatsApp. Também temos tutoriais em vídeo e uma base de conhecimento completa.",
  },
  {
    question: "Como funciona o controle financeiro?",
    answer:
      "Você registra todas as entradas e saídas, e o sistema calcula automaticamente seu lucro. Também mostra relatórios por período, serviço e profissional.",
  },
  {
    question: "Meus dados estão seguros?",
    answer:
      "100% seguros. Usamos criptografia SSL de ponta e nossos servidores seguem os mais altos padrões de segurança. Seus dados nunca são compartilhados.",
  },
  {
    question: "Posso gerenciar múltiplas barbearias?",
    answer:
      "Sim! Com o plano adequado, você gerencia quantas unidades precisar, tudo em um único painel centralizado.",
  },
  {
    question: "Preciso instalar algo no computador?",
    answer:
      "Não! O GestBarber funciona 100% online. Basta acessar pelo navegador no computador, tablet ou celular.",
  },
  {
    question: "Como funciona a gestão de clientes?",
    answer:
      "Você tem o histórico completo de cada cliente: serviços realizados, valores pagos, preferências e data da última visita. Isso ajuda a personalizar o atendimento.",
  },
];

export const FAQSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Perguntas Frequentes
          </h2>
          <p className="text-muted-foreground text-lg">
            Tire suas dúvidas sobre o GestBarber
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="border border-border/50 rounded-lg px-6 bg-muted/20"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
