import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  TrendingUp,
  BarChart3,
  Users,
  Layers,
  Smartphone,
} from "lucide-react";

const benefits = [
  {
    icon: Calendar,
    badge: "Essencial",
    badgeVariant: "default" as const,
    title: "Agenda que funciona de verdade",
    description:
      "Chega de cliente perdido no WhatsApp. Agendamentos automáticos, lembretes e confirmação que reduzem faltas em até 70%.",
  },
  {
    icon: TrendingUp,
    badge: "Popular",
    badgeVariant: "secondary" as const,
    title: "Saiba exatamente quanto você lucra",
    description:
      "Veja seu faturamento, custos e lucro em tempo real. Sem achismo, com números claros todo dia.",
  },
  {
    icon: BarChart3,
    badge: null,
    badgeVariant: null,
    title: "Relatórios que ajudam a decidir",
    description:
      "Descubra seus melhores serviços, horários de pico e clientes mais lucrativos. Dados que viram ação.",
  },
  {
    icon: Users,
    badge: "Novo",
    badgeVariant: "outline" as const,
    title: "Clientes que voltam sempre",
    description:
      "Histórico completo de cada cliente: serviços, preferências e quanto já gastou. Atendimento personalizado.",
  },
  {
    icon: Layers,
    badge: "Gestão",
    badgeVariant: "default" as const,
    title: "Tudo organizado em um lugar só",
    description:
      "Serviços, profissionais, produtos e estoque. Sem planilhas, sem papel, sem dor de cabeça.",
  },
  {
    icon: Smartphone,
    badge: null,
    badgeVariant: null,
    title: "Simples de usar, rápido de aprender",
    description:
      "Interface limpa que você aprende em 5 minutos. Mais tempo cortando cabelo, menos tempo no computador.",
  },
];

export const BenefitsSection = () => {
  return (
    <section id="beneficios" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que você ganha com o GestBarber
          </h2>
          <p className="text-muted-foreground text-lg">
            Ferramentas práticas que resolvem problemas reais do seu dia a dia
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit) => (
            <Card
              key={benefit.title}
              className="group hover:shadow-lg hover:border-primary/30 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <benefit.icon className="w-6 h-6 text-primary" />
                  </div>
                  {benefit.badge && (
                    <Badge variant={benefit.badgeVariant}>{benefit.badge}</Badge>
                  )}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {benefit.title}
                </h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
