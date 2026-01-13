import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export interface BarberSite {
  id: string;
  user_id: string;
  slug: string;
  title: string;
  description: string | null;
  theme: string | null;
  city: string | null;
  phone: string | null;
  address: string | null;
  seo_data: Record<string, unknown>;
  site_content: Record<string, unknown>;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateSiteData {
  title: string;
  phone: string;
  address?: string;
  city?: string;
  theme?: string;
}

export const useBarberSite = () => {
  return useQuery({
    queryKey: ['barber-site'],
    queryFn: async (): Promise<BarberSite | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('barber_sites')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BarberSite | null;
    },
  });
};

export const usePublicBarberSite = (slug: string | undefined) => {
  return useQuery({
    queryKey: ['public-barber-site', slug],
    queryFn: async (): Promise<BarberSite | null> => {
      if (!slug) return null;

      const { data, error } = await supabase
        .from('barber_sites')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as BarberSite | null;
    },
    enabled: !!slug,
  });
};

export const useCreateBarberSite = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: async (formData: CreateSiteData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Generate slug from title
      const { data: slugData, error: slugError } = await supabase
        .rpc('generate_site_slug', { site_title: formData.title });
      
      if (slugError) throw slugError;
      const slug = slugData as string;

      // Get services for site content
      const { data: services } = await supabase
        .from('services')
        .select('name, price, description, duration_minutes')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .limit(8);

      // Get profile info
      const { data: profile } = await supabase
        .from('profiles')
        .select('barbershop_name, full_name')
        .eq('id', user.id)
        .single();

      // Generate AI content
      const { data: aiData, error: aiError } = await supabase.functions.invoke('generate-website', {
        body: {
          barbershopName: formData.title,
          style: formData.theme || 'moderna',
          services: services || [],
          whatsapp: formData.phone,
          address: formData.address,
        }
      });

      if (aiError) {
        console.error('AI generation error:', aiError);
        // Continue without AI content
      }

      const siteContent = {
        services: services || [],
        ownerName: profile?.full_name,
        ...(aiData?.content || {}),
      };

      const seoData = {
        metaTitle: aiData?.content?.metaTitle || formData.title,
        metaDescription: aiData?.content?.metaDescription || `Visite ${formData.title}`,
      };

      // Create site record
      const { data, error } = await supabase
        .from('barber_sites')
        .insert({
          user_id: user.id,
          slug,
          title: formData.title,
          description: aiData?.description || `Site da ${formData.title}`,
          theme: formData.theme || 'moderna',
          city: formData.city,
          phone: formData.phone,
          address: formData.address,
          seo_data: seoData,
          site_content: siteContent,
          published: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as BarberSite;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['barber-site'] });
      toast.success('Site criado com sucesso!');
      // Navigate to the public site
      navigate(`/b/${data.slug}`);
    },
    onError: (error: Error) => {
      console.error('Error creating site:', error);
      toast.error('Erro ao criar site', { description: error.message });
    },
  });
};

export const useUpdateBarberSite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<BarberSite> & { id: string }) => {
      const { error } = await supabase
        .from('barber_sites')
        .update({
          title: data.title,
          description: data.description,
          theme: data.theme,
          city: data.city,
          phone: data.phone,
          address: data.address,
          published: data.published,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['barber-site'] });
      toast.success('Site atualizado!');
    },
    onError: (error: Error) => {
      toast.error('Erro ao atualizar site', { description: error.message });
    },
  });
};
