import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NewBarberDialog } from "@/components/barbeiros/NewBarberDialog";
import { BarberLinkCard } from "@/components/barbeiros/BarberLinkCard";
import { BarberWorkHoursManager } from "@/components/barbeiros/BarberWorkHoursManager";
import { BarberBreaksManager } from "@/components/barbeiros/BarberBreaksManager";
import { BarberExceptionsManager } from "@/components/barbeiros/BarberExceptionsManager";
import { BarberAvatar } from "@/components/barbeiros/BarberAvatar";
import { BarberAvatarUpload } from "@/components/barbeiros/BarberAvatarUpload";
import { Plus, User, Scissors, Trash2, Crown, Clock, Coffee, Link2, CalendarOff } from "lucide-react";
import { toast } from "sonner";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { usePlanValidation } from "@/hooks/usePlanValidation";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Barber {
  id: string;
  name: string;
  specialty: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  slug: string | null;
}

const Barbeiros = () => {
  const { user, loading: authLoading } = useRequireAuth("/");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [barberToDelete, setBarberToDelete] = useState<{ id: string; name: string } | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { userPlan, isFreemium } = usePlanValidation();
  const navigate = useNavigate();

  const { data: barbers = [], isLoading, refetch } = useQuery<Barber[]>({
    queryKey: ["barbers", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("barbers")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Auto-select first barber if none selected
      if (data && data.length > 0 && !selectedBarber) {
        setSelectedBarber(data[0].id);
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  const maxBarbers = userPlan?.limits.maxBarbers ?? 2;
  const currentBarbers = barbers?.length ?? 0;
  const isAtLimit = isFreemium && currentBarbers >= maxBarbers;

  const handleAddBarber = async (barberData: { name: string; specialty: string; avatar_url: string }) => {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    try {
      const { error } = await supabase
        .from("barbers")
        .insert({
          user_id: user.id,
          name: barberData.name,
          specialty: barberData.specialty || null,
          avatar_url: barberData.avatar_url || null,
          is_active: true,
        });

      if (error) throw error;

      toast.success("Barbeiro cadastrado com sucesso!");
      refetch();
    } catch (error: any) {
      toast.error("Erro ao cadastrar barbeiro: " + error.message);
    }
  };

  const toggleBarberStatus = async (barberId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("barbers")
        .update({ is_active: !currentStatus })
        .eq("id", barberId);

      if (error) throw error;

      toast.success(
        !currentStatus ? "Barbeiro ativado" : "Barbeiro desativado"
      );
      refetch();
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
    }
  };

  const handleDeleteBarber = async () => {
    if (!barberToDelete || !user) return;

    const barberIdToDelete = barberToDelete.id;
    
    try {
      // Remove registros relacionados primeiro (vendas de produtos, metas, horários, intervalos, exceções)
      await supabase.from("product_sales").delete().eq("barber_id", barberIdToDelete);
      await supabase.from("barber_goals").delete().eq("barber_id", barberIdToDelete);
      await supabase.from("barber_work_hours").delete().eq("barber_id", barberIdToDelete);
      await supabase.from("barber_breaks").delete().eq("barber_id", barberIdToDelete);
      await supabase.from("barber_exceptions").delete().eq("barber_id", barberIdToDelete);
      
      // Remove do banco de dados
      const { error } = await supabase
        .from("barbers")
        .delete()
        .eq("id", barberIdToDelete)
        .eq("user_id", user.id);

      if (error) throw error;
      
      toast.success("Barbeiro removido com sucesso!");
      refetch();
    } catch (error: any) {
      console.error("Erro ao remover barbeiro:", error);
      toast.error("Erro ao remover barbeiro: " + error.message);
    } finally {
      setBarberToDelete(null);
    }
  };

  if (authLoading || isLoading) {
    return <FullPageLoader text="Carregando barbeiros..." />;
  }

  return (
    <AppLayout title="Barbeiros" description="Gerencie sua equipe">
      <div className="space-y-4 md:space-y-6">
        {/* Indicador de limite do plano */}
        {isFreemium && (
          <Card className={`border ${isAtLimit ? 'border-amber-500/50 bg-amber-500/5' : 'border-border'}`}>
            <CardContent className="py-3 px-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${isAtLimit ? 'bg-amber-500/10' : 'bg-primary/10'}`}>
                    <User className={`h-4 w-4 ${isAtLimit ? 'text-amber-500' : 'text-primary'}`} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {currentBarbers} de {maxBarbers} barbeiros
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAtLimit 
                        ? "Limite atingido no plano Start" 
                        : `Você pode adicionar mais ${maxBarbers - currentBarbers} barbeiro(s)`
                      }
                    </p>
                  </div>
                </div>
                {isAtLimit && (
                  <Button 
                    size="sm" 
                    onClick={() => navigate("/planos")}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    <Crown className="h-4 w-4 mr-2" />
                    Fazer Upgrade
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary flex-shrink-0" />
            <span className="text-sm text-muted-foreground">
              {barbers?.length || 0} barbeiro(s) cadastrado(s)
            </span>
          </div>
          <Button 
            onClick={() => isAtLimit ? navigate("/planos") : setIsDialogOpen(true)} 
            className="w-full sm:w-auto"
            variant={isAtLimit ? "outline" : "default"}
          >
            {isAtLimit ? (
              <>
                <Crown className="h-4 w-4 mr-2" />
                Upgrade para Adicionar
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Novo Barbeiro
              </>
            )}
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="px-4 md:px-6 pt-4 md:pt-6">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-muted flex-shrink-0"></div>
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="h-3 md:h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-2 md:h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : !barbers || barbers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 md:py-12 px-4">
              <User className="h-10 w-10 md:h-12 md:w-12 text-muted-foreground mb-3 md:mb-4" />
              <p className="text-base md:text-lg font-medium text-muted-foreground text-center">
                Nenhum barbeiro cadastrado
              </p>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 md:mt-2 mb-3 md:mb-4 text-center">
                Comece adicionando membros à sua equipe
              </p>
              <Button onClick={() => setIsDialogOpen(true)} size="sm" className="text-sm">
                <Plus className="h-3.5 w-3.5 md:h-4 md:w-4 mr-2" />
                Cadastrar Primeiro Barbeiro
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Seletor de Barbeiro com Cards Clicáveis */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {barbers.map((barber) => (
                <Card 
                  key={barber.id} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedBarber === barber.id 
                      ? 'ring-2 ring-primary shadow-lg bg-primary/5' 
                      : 'hover:bg-muted/30'
                  } ${!barber.is_active ? 'opacity-60' : ''}`}
                  onClick={() => setSelectedBarber(barber.id)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <BarberAvatar
                        name={barber.name}
                        avatarUrl={barber.avatar_url}
                        size="lg"
                        className={selectedBarber === barber.id ? 'ring-2 ring-primary ring-offset-2' : ''}
                      />
                      <div className="space-y-1 w-full">
                        <p className="font-medium text-sm truncate">{barber.name}</p>
                        {barber.specialty && (
                          <p className="text-xs text-muted-foreground truncate">{barber.specialty}</p>
                        )}
                        <Badge 
                          variant={barber.is_active ? "default" : "secondary"} 
                          className="text-[10px] px-1.5 py-0"
                        >
                          {barber.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Painel de Configuração do Barbeiro Selecionado */}
            {selectedBarber && (
              <Card className="border-2">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <BarberAvatar
                        name={barbers.find(b => b.id === selectedBarber)?.name || ''}
                        avatarUrl={barbers.find(b => b.id === selectedBarber)?.avatar_url || null}
                        size="md"
                      />
                      <div>
                        <CardTitle className="text-lg">
                          {barbers.find(b => b.id === selectedBarber)?.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Configurações completas do barbeiro
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={barbers.find(b => b.id === selectedBarber)?.is_active || false}
                        onCheckedChange={() => {
                          const barber = barbers.find(b => b.id === selectedBarber);
                          if (barber) toggleBarberStatus(barber.id, barber.is_active);
                        }}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const barber = barbers.find(b => b.id === selectedBarber);
                          if (barber) setBarberToDelete({ id: barber.id, name: barber.name });
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <Tabs defaultValue="horarios" className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-6">
                      <TabsTrigger value="horarios" className="flex items-center gap-1.5 text-xs sm:text-sm">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Horários</span>
                      </TabsTrigger>
                      <TabsTrigger value="pausas" className="flex items-center gap-1.5 text-xs sm:text-sm">
                        <Coffee className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Pausas</span>
                      </TabsTrigger>
                      <TabsTrigger value="folgas" className="flex items-center gap-1.5 text-xs sm:text-sm">
                        <CalendarOff className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Folgas</span>
                      </TabsTrigger>
                      <TabsTrigger value="link" className="flex items-center gap-1.5 text-xs sm:text-sm">
                        <Link2 className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Link</span>
                      </TabsTrigger>
                      <TabsTrigger value="foto" className="flex items-center gap-1.5 text-xs sm:text-sm">
                        <User className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Foto</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="horarios" className="mt-0">
                      <BarberWorkHoursManager
                        barberId={selectedBarber}
                        barberName={barbers.find(b => b.id === selectedBarber)?.name || ''}
                      />
                    </TabsContent>
                    
                    <TabsContent value="pausas" className="mt-0">
                      <BarberBreaksManager
                        barberId={selectedBarber}
                        barberName={barbers.find(b => b.id === selectedBarber)?.name || ''}
                      />
                    </TabsContent>
                    
                    <TabsContent value="folgas" className="mt-0">
                      <BarberExceptionsManager
                        barberId={selectedBarber}
                        barberName={barbers.find(b => b.id === selectedBarber)?.name || ''}
                      />
                    </TabsContent>
                    
                    <TabsContent value="link" className="mt-0">
                      <BarberLinkCard
                        barberId={selectedBarber}
                        barberName={barbers.find(b => b.id === selectedBarber)?.name || ''}
                        barberSlug={barbers.find(b => b.id === selectedBarber)?.slug || undefined}
                      />
                    </TabsContent>
                    
                    <TabsContent value="foto" className="mt-0">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Foto do Perfil</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <BarberAvatarUpload
                            barberId={selectedBarber}
                            barberName={barbers.find(b => b.id === selectedBarber)?.name || ''}
                            currentAvatarUrl={barbers.find(b => b.id === selectedBarber)?.avatar_url || null}
                            onAvatarUpdated={() => refetch()}
                          />
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <NewBarberDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onAddBarber={handleAddBarber}
        />

        <AlertDialog open={!!barberToDelete} onOpenChange={() => setBarberToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja remover o barbeiro <strong>{barberToDelete?.name}</strong>?
                Esta ação não pode ser desfeita e todos os agendamentos associados a este barbeiro serão afetados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBarber}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default Barbeiros;
