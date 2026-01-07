import {
  Calendar,
  DollarSign,
  Users,
  BarChart3,
  Wallet,
  Globe,
  CheckCircle,
  Zap,
} from "lucide-react";

const features = [
  { icon: Calendar, label: "Agenda inteligente" },
  { icon: DollarSign, label: "Controle financeiro" },
  { icon: Users, label: "Gestão de clientes" },
  { icon: BarChart3, label: "Relatórios claros" },
  { icon: Wallet, label: "Controle de caixa" },
  { icon: Globe, label: "Tudo online" },
  { icon: CheckCircle, label: "Organização total" },
  { icon: Zap, label: "Interface simples e rápida" },
];

export const AboutSection = () => {
  return (
    <section id="sobre" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            O que é o GestBarber
          </h2>
          <p className="text-muted-foreground text-lg max-w-3xl mx-auto">
            O GestBarber é um{" "}
            <strong className="text-foreground">
              Sistema Completo de Gestão para Barbearias
            </strong>
            , projetado para organizar e simplificar todas as operações do seu negócio em um único lugar.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.label}
              className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors"
            >
              <feature.icon className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="text-sm font-medium text-foreground">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
