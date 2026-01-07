import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Scissors, Edit, Trash2, Clock, DollarSign, ImageIcon } from "lucide-react";
import { NewServiceDialog } from "@/components/servicos/NewServiceDialog";
import { EditServiceDialog } from "@/components/servicos/EditServiceDialog";
import { useServices, Service } from "@/hooks/useServices";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { ServicesPageSkeleton } from "@/components/skeletons/PageSkeletons";

const Servicos = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const {
    services,
    isLoading,
    createService,
    isCreating,
    updateService,
    isUpdating,
    deleteService,
    isDeleting,
    toggleServiceStatus,
    isTogglingStatus,
    regenerateImage,
    isRegeneratingImage,
  } = useServices(user?.id);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleCreateService = (values: any) => {
    createService({
      name: values.name,
      description: values.description,
      price: parseFloat(values.price),
      duration_minutes: parseInt(values.duration_minutes),
    });
    setIsNewDialogOpen(false);
  };

  const handleUpdateService = (values: any) => {
    if (!selectedService) return;
    
    updateService({
      id: selectedService.id,
      name: values.name,
      description: values.description,
      price: parseFloat(values.price),
      duration_minutes: parseInt(values.duration_minutes),
      is_active: values.is_active,
    });
    setIsEditDialogOpen(false);
    setSelectedService(null);
  };

  const handleDeleteService = () => {
    if (!selectedService) return;
    deleteService(selectedService.id);
    setIsDeleteDialogOpen(false);
    setSelectedService(null);
  };

  const handleEditClick = (service: Service) => {
    setSelectedService(service);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (service: Service) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const handleToggleStatus = (service: Service) => {
    toggleServiceStatus({ id: service.id, currentStatus: service.is_active });
  };

  return (
    <AppLayout title="Serviços" description="Gerencie os serviços da barbearia">
      {authLoading || isLoading ? (
        <ServicesPageSkeleton />
      ) : (
        <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-primary" />
            <span className="text-sm text-muted-foreground">
              {services.length} serviço(s) cadastrado(s)
            </span>
          </div>
          <Button onClick={() => setIsNewDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Serviço
          </Button>
        </div>

        {services.length === 0 ? (
          <EmptyState
            icon={<Scissors className="h-12 w-12" />}
            title="Nenhum serviço cadastrado"
            description="Comece cadastrando os serviços oferecidos pela sua barbearia"
            action={
              <Button onClick={() => setIsNewDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Cadastrar Primeiro Serviço
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                {service.image_url ? (
                  <div className="relative w-full h-48 bg-muted overflow-hidden">
                    <img 
                      src={service.image_url} 
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="relative w-full h-48 bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                  </div>
                )}
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{service.name}</CardTitle>
                      {service.description && (
                        <CardDescription className="line-clamp-2 mt-1">
                          {service.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant={service.is_active ? "default" : "secondary"} className="flex-shrink-0">
                      {service.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Preço:</span>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        {formatCurrency(service.price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Duração:</span>
                      </div>
                      <span className="font-medium">
                        {service.duration_minutes} min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={() => handleToggleStatus(service)}
                        disabled={isTogglingStatus}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(service)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteClick(service)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        </div>
      )}

      <NewServiceDialog
        open={isNewDialogOpen}
        onOpenChange={setIsNewDialogOpen}
        onSubmit={handleCreateService}
        isSubmitting={isCreating}
      />

      <EditServiceDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        service={selectedService}
        onSubmit={handleUpdateService}
        isSubmitting={isUpdating}
        onRegenerateImage={(id, name) => regenerateImage({ id, serviceName: name })}
        isRegeneratingImage={isRegeneratingImage}
      />

      <ConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteService}
        title="Excluir serviço?"
        description={`Tem certeza que deseja excluir "${selectedService?.name}"? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
      />
    </AppLayout>
  );
};

export default Servicos;
