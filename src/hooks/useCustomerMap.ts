import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface NeighborhoodStat {
  id: string;
  neighborhood: string;
  city: string | null;
  clients_count: number;
  total_revenue: number;
  avg_latitude: number | null;
  avg_longitude: number | null;
}

export interface ClientLocation {
  client_id: string;
  client_name: string | null;
  neighborhood: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  total_appointments: number;
}

// Brazilian cities coordinates for approximation
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'são paulo': { lat: -23.5505, lng: -46.6333 },
  'rio de janeiro': { lat: -22.9068, lng: -43.1729 },
  'belo horizonte': { lat: -19.9167, lng: -43.9345 },
  'brasília': { lat: -15.7975, lng: -47.8919 },
  'salvador': { lat: -12.9714, lng: -38.5014 },
  'fortaleza': { lat: -3.7172, lng: -38.5433 },
  'curitiba': { lat: -25.4284, lng: -49.2733 },
  'recife': { lat: -8.0476, lng: -34.8770 },
  'porto alegre': { lat: -30.0346, lng: -51.2177 },
  'manaus': { lat: -3.1190, lng: -60.0217 },
};

export const useNeighborhoodStats = () => {
  return useQuery({
    queryKey: ['neighborhood-stats'],
    queryFn: async (): Promise<NeighborhoodStat[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('neighborhood_stats')
        .select('*')
        .eq('user_id', user.id)
        .order('clients_count', { ascending: false });

      if (error) throw error;
      return (data || []) as NeighborhoodStat[];
    },
  });
};

export const useClientLocations = () => {
  return useQuery({
    queryKey: ['client-locations'],
    queryFn: async (): Promise<ClientLocation[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('client_behavior')
        .select('client_id, client_name, neighborhood, city, latitude, longitude, total_appointments')
        .eq('user_id', user.id)
        .not('neighborhood', 'is', null);

      if (error) throw error;
      return (data || []) as ClientLocation[];
    },
  });
};

export const useUpdateClientLocation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      clientId, 
      neighborhood, 
      city, 
      postalCode 
    }: { 
      clientId: string; 
      neighborhood: string; 
      city?: string; 
      postalCode?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Try to get approximate coordinates
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (city) {
        const cityLower = city.toLowerCase();
        const coords = CITY_COORDINATES[cityLower];
        if (coords) {
          // Add small random offset for neighborhood (privacy)
          latitude = coords.lat + (Math.random() - 0.5) * 0.05;
          longitude = coords.lng + (Math.random() - 0.5) * 0.05;
        }
      }

      // Update client behavior
      const { error } = await supabase
        .from('client_behavior')
        .update({
          neighborhood,
          city,
          postal_code: postalCode,
          latitude,
          longitude,
        })
        .eq('client_id', clientId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update neighborhood stats
      await updateNeighborhoodStats(user.id, neighborhood, city, latitude, longitude);

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-locations'] });
      queryClient.invalidateQueries({ queryKey: ['neighborhood-stats'] });
    },
  });
};

async function updateNeighborhoodStats(
  userId: string, 
  neighborhood: string, 
  city: string | null,
  latitude: number | null,
  longitude: number | null
) {
  // Count clients in this neighborhood
  const { data: clients } = await supabase
    .from('client_behavior')
    .select('client_id, total_appointments')
    .eq('user_id', userId)
    .eq('neighborhood', neighborhood);

  const clientsCount = clients?.length || 0;

  // Upsert neighborhood stats
  await supabase
    .from('neighborhood_stats')
    .upsert({
      user_id: userId,
      neighborhood,
      city,
      clients_count: clientsCount,
      avg_latitude: latitude,
      avg_longitude: longitude,
      last_updated: new Date().toISOString(),
    }, {
      onConflict: 'user_id,neighborhood',
    });
}

export const useRecalculateNeighborhoodStats = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      // Get all clients with neighborhoods
      const { data: clients } = await supabase
        .from('client_behavior')
        .select('neighborhood, city, latitude, longitude')
        .eq('user_id', user.id)
        .not('neighborhood', 'is', null);

      if (!clients) return;

      // Group by neighborhood
      const neighborhoodMap = new Map<string, {
        city: string | null;
        count: number;
        latSum: number;
        lngSum: number;
        latCount: number;
      }>();

      clients.forEach(client => {
        if (!client.neighborhood) return;
        
        const existing = neighborhoodMap.get(client.neighborhood) || {
          city: client.city,
          count: 0,
          latSum: 0,
          lngSum: 0,
          latCount: 0,
        };

        existing.count++;
        if (client.latitude && client.longitude) {
          existing.latSum += client.latitude;
          existing.lngSum += client.longitude;
          existing.latCount++;
        }

        neighborhoodMap.set(client.neighborhood, existing);
      });

      // Delete old stats
      await supabase
        .from('neighborhood_stats')
        .delete()
        .eq('user_id', user.id);

      // Insert new stats
      const stats = Array.from(neighborhoodMap.entries()).map(([neighborhood, data]) => ({
        user_id: user.id,
        neighborhood,
        city: data.city,
        clients_count: data.count,
        avg_latitude: data.latCount > 0 ? data.latSum / data.latCount : null,
        avg_longitude: data.latCount > 0 ? data.lngSum / data.latCount : null,
      }));

      if (stats.length > 0) {
        await supabase.from('neighborhood_stats').insert(stats);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['neighborhood-stats'] });
    },
  });
};
