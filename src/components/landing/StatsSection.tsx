import { useEffect, useState } from "react";

const stats = [
  { value: 2500, suffix: "+", label: "Barbearias Ativas" },
  { value: 98, suffix: "%", label: "Satisfação" },
  { value: 50, suffix: "mil+", label: "Agendamentos/Mês" },
  { value: 4.8, suffix: "", label: "Avaliação Média", isDecimal: true },
];

const AnimatedNumber = ({
  value,
  suffix,
  isDecimal,
}: {
  value: number;
  suffix: string;
  isDecimal?: boolean;
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(timer);
      } else {
        setDisplayValue(current);
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
      {isDecimal ? displayValue.toFixed(1) : Math.floor(displayValue)}
      {suffix}
    </span>
  );
};

export const StatsSection = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Números que impressionam
          </h2>
          <p className="text-muted-foreground text-lg">
            Milhares de barbeiros confiam no GestBarber para gerenciar seus negócios
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <AnimatedNumber
                value={stat.value}
                suffix={stat.suffix}
                isDecimal={stat.isDecimal}
              />
              <p className="text-muted-foreground mt-2">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
