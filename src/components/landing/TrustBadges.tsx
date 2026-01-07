import { Shield, Award, Users, Headphones } from "lucide-react";

const badges = [
  {
    icon: Shield,
    title: "100% Seguro",
    description: "Criptografia SSL",
  },
  {
    icon: Award,
    title: "Garantia 30 Dias",
    description: "Satisfação garantida",
  },
  {
    icon: Users,
    title: "5000+ Clientes",
    description: "Satisfeitos",
  },
  {
    icon: Headphones,
    title: "Suporte 24/7",
    description: "Sempre disponível",
  },
];

export const TrustBadges = () => {
  return (
    <section className="py-12 bg-muted/30 border-y border-border/40">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {badges.map((badge) => (
            <div key={badge.title} className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <badge.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground">{badge.title}</h3>
              <p className="text-sm text-muted-foreground">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
