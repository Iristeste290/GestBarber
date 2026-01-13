import { Link } from "react-router-dom";
import { Scissors } from "lucide-react";

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="py-12 bg-[#0A0A0A] border-t border-primary/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Scissors className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-primary">GestBarber</span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/auth" className="hover:text-primary transition-colors">
              Entrar
            </Link>
            <Link to="/auth" className="hover:text-primary transition-colors">
              Criar conta
            </Link>
            <Link to="/ajuda" className="hover:text-primary transition-colors">
              Suporte
            </Link>
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
