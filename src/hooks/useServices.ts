import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError, handleSuccess } from "@/lib/error-handler";
import { queryKeys, staleTimes } from "@/lib/supabase-helpers";

export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  user_id: string;
  created_at: string;
  image_url: string | null;
}

export interface NewService {
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
}

export interface UpdateService extends NewService {
  is_active: boolean;
}

export const useServices = (userId?: string) => {
  const queryClient = useQueryClient();

  // Listar serviços - select otimizado
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: queryKeys.services(userId),
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('services')
        .select('id, name, description, price, duration_minutes, is_active, user_id, created_at, image_url')
        .eq('user_id', userId)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: staleTimes.frequent,
  });

  // Criar serviço com atualização otimista
  const createService = useMutation({
    mutationFn: async (service: NewService) => {
      if (!userId) throw new Error('Usuário não autenticado');

      // Gerar imagem em background (não bloqueia)
      const imagePromise = supabase.functions.invoke('generate-service-image', {
        body: { serviceName: service.name }
      }).catch(() => ({ data: null }));

      const { data, error } = await supabase
        .from('services')
        .insert({
          user_id: userId,
          name: service.name,
          description: service.description || null,
          price: service.price,
          duration_minutes: service.duration_minutes,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Atualiza imagem depois se disponível
      const imageResult = await imagePromise;
      if (imageResult.data?.imageUrl) {
        await supabase
          .from('services')
          .update({ image_url: imageResult.data.imageUrl })
          .eq('id', data.id);
        data.image_url = imageResult.data.imageUrl;
      }

      return data;
    },
    onSuccess: (newService) => {
      queryClient.setQueryData<Service[]>(queryKeys.services(userId), (old = []) => {
        return [...old, newService].sort((a, b) => a.name.localeCompare(b.name));
      });
      handleSuccess('Serviço criado', 'O serviço foi cadastrado com sucesso');
    },
    onError: (error) => {
      handleError(error, { title: 'Erro ao criar serviço' });
    },
  });

  // Atualizar serviço
  const updateService = useMutation({
    mutationFn: async ({ id, ...service }: UpdateService & { id: string }) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('services')
        .update({
          name: service.name,
          description: service.description || null,
          price: service.price,
          duration_minutes: service.duration_minutes,
          is_active: service.is_active,
        })
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ id, ...updates }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.services(userId) });
      const previous = queryClient.getQueryData<Service[]>(queryKeys.services(userId));
      
      queryClient.setQueryData<Service[]>(queryKeys.services(userId), (old = []) => {
        return old.map(s => s.id === id ? { ...s, ...updates } : s);
      });
      
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.services(userId), context.previous);
      }
      handleError(error, { title: 'Erro ao atualizar serviço' });
    },
    onSuccess: () => {
      handleSuccess('Serviço atualizado', 'As alterações foram salvas');
    },
  });

  // Excluir serviço
  const deleteService = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.services(userId) });
      const previous = queryClient.getQueryData<Service[]>(queryKeys.services(userId));
      
      queryClient.setQueryData<Service[]>(queryKeys.services(userId), (old = []) => {
        return old.filter(s => s.id !== id);
      });
      
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.services(userId), context.previous);
      }
      handleError(error, { title: 'Erro ao excluir serviço' });
    },
    onSuccess: () => {
      handleSuccess('Serviço excluído', 'O serviço foi removido com sucesso');
    },
  });

  // Toggle status
  const toggleServiceStatus = useMutation({
    mutationFn: async ({ id, currentStatus }: { id: string; currentStatus: boolean }) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('services')
        .update({ is_active: !currentStatus })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return { id, newStatus: !currentStatus };
    },
    onMutate: async ({ id, currentStatus }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.services(userId) });
      const previous = queryClient.getQueryData<Service[]>(queryKeys.services(userId));
      
      queryClient.setQueryData<Service[]>(queryKeys.services(userId), (old = []) => {
        return old.map(s => s.id === id ? { ...s, is_active: !currentStatus } : s);
      });
      
      return { previous };
    },
    onError: (error, _, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.services(userId), context.previous);
      }
      handleError(error, { title: 'Erro ao alterar status' });
    },
    onSuccess: () => {
      handleSuccess('Status alterado', 'O status do serviço foi atualizado');
    },
  });

  // Regenerar imagem
  const regenerateImage = useMutation({
    mutationFn: async ({ id, serviceName }: { id: string; serviceName: string }) => {
      if (!userId) throw new Error('Usuário não autenticado');

      const { data: imageData, error: imageError } = await supabase.functions.invoke('generate-service-image', {
        body: { serviceName }
      });

      if (imageError) throw imageError;

      const { error } = await supabase
        .from('services')
        .update({ image_url: imageData.imageUrl })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      return { id, imageUrl: imageData.imageUrl };
    },
    onSuccess: ({ id, imageUrl }) => {
      queryClient.setQueryData<Service[]>(queryKeys.services(userId), (old = []) => {
        return old.map(s => s.id === id ? { ...s, image_url: imageUrl } : s);
      });
      handleSuccess('Imagem regenerada', 'A imagem do serviço foi atualizada');
    },
    onError: (error) => {
      handleError(error, { title: 'Erro ao regenerar imagem' });
    },
  });

  return {
    services,
    isLoading,
    createService: createService.mutate,
    isCreating: createService.isPending,
    updateService: updateService.mutate,
    isUpdating: updateService.isPending,
    deleteService: deleteService.mutate,
    isDeleting: deleteService.isPending,
    toggleServiceStatus: toggleServiceStatus.mutate,
    isTogglingStatus: toggleServiceStatus.isPending,
    regenerateImage: regenerateImage.mutate,
    isRegeneratingImage: regenerateImage.isPending,
  };
};
