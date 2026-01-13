import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format, subDays } from "date-fns";

export interface GoogleBusinessMetrics {
  views_count: number;
  reviews_count: number;
  average_rating: number;
  unanswered_reviews: number;
  website_clicks: number;
  direction_requests: number;
  phone_calls: number;
}

export interface GoogleBusinessConnection {
  id: string;
  user_id: string;
  business_id: string | null;
  account_name: string | null;
  location_name: string | null;
  is_connected: boolean;
  last_sync_at: string | null;
}

export const useGoogleBusinessConnection = () => {
  return useQuery({
    queryKey: ['google-business-connection'],
    queryFn: async (): Promise<GoogleBusinessConnection | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('google_business_connection')
        .select('id, user_id, business_id, account_name, location_name, is_connected, last_sync_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });
};

export const useGoogleBusinessMetrics = () => {
  return useQuery({
    queryKey: ['google-business-metrics'],
    queryFn: async (): Promise<GoogleBusinessMetrics> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return {
          views_count: 0,
          reviews_count: 0,
          average_rating: 0,
          unanswered_reviews: 0,
          website_clicks: 0,
          direction_requests: 0,
          phone_calls: 0,
        };
      }

      // Get metrics for the current month
      const start = format(startOfMonth(new Date()), 'yyyy-MM-dd');
      const end = format(endOfMonth(new Date()), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('google_business_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('metric_date', start)
        .lte('metric_date', end)
        .order('metric_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        return {
          views_count: data.views_count || 0,
          reviews_count: data.reviews_count || 0,
          average_rating: data.average_rating || 0,
          unanswered_reviews: data.unanswered_reviews || 0,
          website_clicks: data.website_clicks || 0,
          direction_requests: data.direction_requests || 0,
          phone_calls: data.phone_calls || 0,
        };
      }

      return {
        views_count: 0,
        reviews_count: 0,
        average_rating: 0,
        unanswered_reviews: 0,
        website_clicks: 0,
        direction_requests: 0,
        phone_calls: 0,
      };
    },
  });
};

export const useGoogleBusinessTrend = () => {
  return useQuery({
    queryKey: ['google-business-trend'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('google_business_metrics')
        .select('metric_date, views_count, reviews_count')
        .eq('user_id', user.id)
        .gte('metric_date', thirtyDaysAgo)
        .order('metric_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};
