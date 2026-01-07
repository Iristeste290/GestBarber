import { Link } from "react-router-dom";
import { Scissors } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 bg-muted/50 border-t border-border/40">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">GestBarber</span>
          </Link>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <Link to="/auth" className="hover:text-foreground transition-colors">
              Entrar
            </Link>
            <a href="#sobre" className="hover:text-foreground transition-colors">
              Sobre
            </a>
            <a href="#beneficios" className="hover:text-foreground transition-colors">
              Benefícios
            </a>
            <a href="#planos" className="hover:text-foreground transition-colors">
              Planos
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {currentYear} GestBarber. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};
