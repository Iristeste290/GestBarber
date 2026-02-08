import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Calendar, Scissors, AlertCircle } from "lucide-react";

interface Barber {
  id: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
}

interface BarbershopInfo {
  barbershop_name: string | null;
  barbershop_logo_url: string | null;
}

const PublicAgenda = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [barbershopInfo, setBarbershopInfo] = useState<BarbershopInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError("ID da barbearia não fornecido");
      setLoading(false);
      return;
    }
    loadBarbers();
  }, [userId]);

  const loadBarbers = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      setError(null);

      // Load from backend function (avoids exposing global barbers/services to anonymous users)
      const { data: payload, error: invokeError } = await supabase.functions.invoke(
        "public-agenda",
        { body: { userId } },
      );

      if (invokeError) throw invokeError;

      const barbersData = (payload as any)?.barbers as Barber[] | undefined;
      const shop = (payload as any)?.barbershop as BarbershopInfo | undefined;

      if (!shop) {
        setError("Barbearia não encontrada ou sem barbeiros disponíveis");
        setBarbers([]);
        setBarbershopInfo(null);
        return;
      }

      setBarbershopInfo({
        barbershop_name: shop.barbershop_name ?? null,
        barbershop_logo_url: shop.barbershop_logo_url ?? null,
      });

      if (!barbersData || barbersData.length === 0) {
        setBarbers([]);
      } else {
        setBarbers(barbersData);
      }
    } catch (err) {
      console.error("Erro ao carregar barbeiros:", err);
      setError("Erro ao carregar dados da barbearia");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando barbeiros...</p>
        </div>
      </div>
    );
  }

  if (error || !userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Agenda não encontrada</h2>
            <p className="text-muted-foreground mb-4">
              {error || "O link da agenda pública é inválido ou expirou."}
            </p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Voltar para o início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            {barbershopInfo?.barbershop_logo_url ? (
              <Avatar className="h-10 w-10">
                <AvatarImage src={barbershopInfo.barbershop_logo_url} />
                <AvatarFallback>
                  <Scissors className="h-5 w-5 text-primary" />
                </AvatarFallback>
              </Avatar>
            ) : (
              <Scissors className="h-8 w-8 text-primary" />
            )}
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {barbershopInfo?.barbershop_name || "Agendamento Online"}
            </h1>
          </div>
          <p className="text-muted-foreground">Escolha seu barbeiro e agende seu horário</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {barbers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Nenhum barbeiro disponível no momento.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {barbers.map((barber) => (
              <Card key={barber.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={barber.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {barber.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{barber.name}</CardTitle>
                      {barber.specialty && (
                        <CardDescription>{barber.specialty}</CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => navigate(`/agenda-publica/${userId}/${barber.id}`)}
                    className="w-full"
                    size="lg"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Agendar Horário
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicAgenda;
