import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, Scissors } from "lucide-react";

export const LandingNavbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border/40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <Scissors className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">GestBarber</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("inicio")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Início
            </button>
            <button
              onClick={() => scrollToSection("sobre")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Sobre
            </button>
            <button
              onClick={() => scrollToSection("beneficios")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Benefícios
            </button>
            <button
              onClick={() => scrollToSection("planos")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Planos
            </button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/auth">
              <Button className="bg-gradient-to-r from-primary to-accent hover:opacity-90">
                Testar grátis
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/40">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("inicio")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Início
              </button>
              <button
                onClick={() => scrollToSection("sobre")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Sobre
              </button>
              <button
                onClick={() => scrollToSection("beneficios")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Benefícios
              </button>
              <button
                onClick={() => scrollToSection("planos")}
                className="text-left text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                Planos
              </button>
              <div className="flex flex-col gap-2 pt-4 border-t border-border/40">
                <Link to="/auth">
                  <Button variant="outline" className="w-full">Entrar</Button>
                </Link>
                <Link to="/auth">
                  <Button className="w-full bg-gradient-to-r from-primary to-accent">
                    Testar grátis
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
