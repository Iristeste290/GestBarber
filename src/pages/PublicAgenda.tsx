import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Calendar, Clock, Scissors } from "lucide-react";

interface Barber {
  id: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
}

const PublicAgenda = () => {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    try {
      // Use secure public view that excludes user_id
      const { data, error } = await supabase
        .from("barbers_public")
        .select("id, name, specialty, avatar_url")
        .order("name");

      if (error) throw error;
      setBarbers(data || []);
    } catch (error) {
      console.error("Erro ao carregar barbeiros:", error);
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-2">
            <Scissors className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Agendamento Online</h1>
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
                    onClick={() => navigate(`/agenda-publica/${barber.id}`)}
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
