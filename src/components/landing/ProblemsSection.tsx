import { Check, X } from "lucide-react";

const problems = [
  "Agenda bagunçada no WhatsApp",
  "Cliente que falta e você esquece de cobrar",
  "Não sabe quanto lucrou no mês",
  "Caixa misturado com dinheiro pessoal",
  "Falta de organização no dia a dia",
];

export const ProblemsSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Você se identifica com isso?
          </h2>
          <p className="text-muted-foreground text-lg">
            A maioria dos donos de barbearia enfrenta esses problemas todos os dias:
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="space-y-4 mb-8">
            {problems.map((problem) => (
              <div
                key={problem}
                className="flex items-center gap-3 p-4 rounded-lg bg-destructive/5 border border-destructive/20"
              >
                <X className="w-5 h-5 text-destructive flex-shrink-0" />
                <span className="text-foreground">{problem}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <Check className="w-6 h-6 text-green-500 flex-shrink-0" />
            <span className="text-lg font-semibold text-foreground">
              O GestBarber resolve tudo isso.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
