import { useState } from "react";
import { Link } from "react-router-dom";
import { AuthLinkButton } from "@/components/landing/AuthLinkButton";
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-primary/10">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center">
              <Scissors className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">GestBarber</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection("problema")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              O Problema
            </button>
            <button
              onClick={() => scrollToSection("growth")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Growth Engine
            </button>
            <button
              onClick={() => scrollToSection("resultado")}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Resultados
            </button>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <AuthLinkButton variant="ghost" className="text-muted-foreground hover:text-primary">
              Entrar
            </AuthLinkButton>
            <AuthLinkButton variant="premium">
              Quero meu GestBarber
            </AuthLinkButton>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-primary"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-primary/10">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => scrollToSection("problema")}
                className="text-left text-muted-foreground hover:text-primary transition-colors py-2"
              >
                O Problema
              </button>
              <button
                onClick={() => scrollToSection("growth")}
                className="text-left text-muted-foreground hover:text-primary transition-colors py-2"
              >
                Growth Engine
              </button>
              <button
                onClick={() => scrollToSection("resultado")}
                className="text-left text-muted-foreground hover:text-primary transition-colors py-2"
              >
                Resultados
              </button>
              <div className="flex flex-col gap-2 pt-4 border-t border-primary/10">
                <AuthLinkButton variant="outline" className="w-full border-primary/30 text-primary">
                  Entrar
                </AuthLinkButton>
                <AuthLinkButton variant="premium" className="w-full">
                  Quero meu GestBarber
                </AuthLinkButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
