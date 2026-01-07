import { Link } from "react-router-dom";
import { ShieldX, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const AccessDenied = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-destructive/20 rounded-full blur-xl animate-pulse" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10 border-2 border-destructive/30">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Você não tem permissão para acessar esta página. 
            Esta área é restrita a administradores.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline">
            <Link to="/painel">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Painel
            </Link>
          </Button>
          <Button asChild>
            <Link to="/">
              <Home className="h-4 w-4 mr-2" />
              Página Inicial
            </Link>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground pt-4">
          Se você acredita que deveria ter acesso, entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;
