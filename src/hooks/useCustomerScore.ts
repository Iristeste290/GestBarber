import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CustomerScoreData {
  client_id: string;
  client_name: string | null;
  client_phone: string | null;
  customer_score: number;
  customer_status: 'premium' | 'normal' | 'risk';
  total_appointments: number;
  completed: number;
  canceled: number;
  no_show: number;
  cancel_rate: number;
  last_appointment_date: string | null;
  months_as_client: number;
}

export const useCustomerScore = (clientId?: string) => {
  return useQuery({
    queryKey: ['customer-score', clientId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      if (clientId) {
        const { data, error } = await supabase
          .from('client_behavior')
          .select('*')
          .eq('user_id', user.id)
          .eq('client_id', clientId)
          .maybeSingle();
        
        if (error) throw error;
        return data as CustomerScoreData | null;
      }

      const { data, error } = await supabase
        .from('client_behavior')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      
      return data as CustomerScoreData | CustomerScoreData[] | null;
    },
    enabled: true,
  });
};

export const useAllCustomerScores = () => {
  return useQuery({
    queryKey: ['all-customer-scores'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('client_behavior')
        .select('*')
        .eq('user_id', user.id)
        .order('customer_score', { ascending: true });

      if (error) throw error;
      return (data || []) as CustomerScoreData[];
    },
  });
};

export const useRiskClients = () => {
  return useQuery({
    queryKey: ['risk-clients'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('client_behavior')
        .select('*')
        .eq('user_id', user.id)
        .eq('customer_status', 'risk')
        .order('customer_score', { ascending: true });

      if (error) throw error;
      return (data || []) as CustomerScoreData[];
    },
  });
};
