import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Service } from "@/hooks/useServices";
import { ImageIcon, RefreshCw } from "lucide-react";

const serviceFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100),
  description: z.string().max(500).optional(),
  price: z.string().min(1, "Preço é obrigatório"),
  duration_minutes: z.string().min(1, "Duração é obrigatória"),
  is_active: z.boolean(),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface EditServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service | null;
  onSubmit: (values: ServiceFormValues & { id: string }) => void;
  isSubmitting: boolean;
  onRegenerateImage: (id: string, serviceName: string) => void;
  isRegeneratingImage: boolean;
}

export function EditServiceDialog({ 
  open, 
  onOpenChange, 
  service, 
  onSubmit, 
  isSubmitting,
  onRegenerateImage,
  isRegeneratingImage
}: EditServiceDialogProps) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
      duration_minutes: "30",
      is_active: true,
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        description: service.description || "",
        price: service.price.toString(),
        duration_minutes: service.duration_minutes.toString(),
        is_active: service.is_active,
      });
    }
  }, [service, form]);

  const handleSubmit = (values: ServiceFormValues) => {
    if (!service) return;
    onSubmit({ ...values, id: service.id });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Serviço</DialogTitle>
          <DialogDescription>
            Atualize as informações do serviço
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {/* Imagem do serviço */}
            {service && (
              <div className="space-y-2">
                <FormLabel>Imagem do Serviço</FormLabel>
                <div className="flex items-start gap-4">
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {service.image_url ? (
                      <img 
                        src={service.image_url} 
                        alt={service.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Clique no botão abaixo para regenerar a imagem com IA
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => service && onRegenerateImage(service.id, service.name)}
                      disabled={isRegeneratingImage}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isRegeneratingImage ? 'animate-spin' : ''}`} />
                      {isRegeneratingImage ? 'Gerando...' : 'Regenerar Imagem'}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Serviço *</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: Corte Masculino" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o serviço..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço (R$) *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duração (min) *</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="30" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Serviço Ativo</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      Disponível para agendamento
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
