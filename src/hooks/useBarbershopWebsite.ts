import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BarbershopWebsite {
  id: string;
  user_id: string;
  site_name: string | null;
  site_style: 'classica' | 'moderna' | 'premium';
  site_description: string | null;
  site_content: any;
  site_url: string | null;
  whatsapp: string | null;
  address: string | null;
  photos: string[];
  services_highlight: string[];
  is_published: boolean;
  published_at: string | null;
}

export interface WebsiteFormData {
  site_name: string;
  site_style: 'classica' | 'moderna' | 'premium';
  whatsapp: string;
  address?: string;
  services_highlight: string[];
}

export const useBarbershopWebsite = () => {
  return useQuery({
    queryKey: ['barbershop-website'],
    queryFn: async (): Promise<BarbershopWebsite | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('barbershop_website')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BarbershopWebsite | null;
    },
  });
};

export const useGenerateWebsite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: WebsiteFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Get services for the site
      const { data: services } = await supabase
        .from('services')
        .select('name, price, description')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(6);

      // Call AI to generate website content
      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-website', {
        body: {
          barbershopName: formData.site_name,
          style: formData.site_style,
          services: services || [],
          whatsapp: formData.whatsapp,
          address: formData.address,
        }
      });

      if (aiError) throw aiError;

      // Generate a simple URL slug
      const slug = formData.site_name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const siteUrl = `${window.location.origin}/site/${slug}`;

      // Save website data
      const { data, error } = await supabase
        .from('barbershop_website')
        .upsert({
          user_id: user.id,
          site_name: formData.site_name,
          site_style: formData.site_style,
          site_description: aiData.description,
          site_content: aiData.content,
          site_url: siteUrl,
          whatsapp: formData.whatsapp,
          address: formData.address,
          services_highlight: formData.services_highlight,
          is_published: true,
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barbershop-website'] });
      toast.success('Site criado com sucesso!');
    },
    onError: (error: any) => {
      toast.error('Erro ao criar site', { description: error.message });
    },
  });
};
