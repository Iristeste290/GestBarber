import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { startOfMonth, endOfMonth, format } from "date-fns";

export interface LostRevenueItem {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  lost_date: string;
  value_lost: number;
  reason: 'no_show' | 'late_cancel' | 'empty_slot' | 'cancelled';
  service_name: string | null;
  slot_time: string | null;
  barber_id: string | null;
}

export interface LostRevenueSummary {
  total_lost: number;
  no_show_count: number;
  late_cancel_count: number;
  empty_slot_count: number;
  cancelled_count: number;
  top_offenders: Array<{
    customer_name: string;
    customer_phone: string | null;
    total_lost: number;
    incidents: number;
  }>;
}

export const useLostRevenue = (month?: Date) => {
  const targetMonth = month || new Date();
  const start = format(startOfMonth(targetMonth), 'yyyy-MM-dd');
  const end = format(endOfMonth(targetMonth), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['lost-revenue', start, end],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('lost_revenue')
        .select('*')
        .eq('user_id', user.id)
        .gte('lost_date', start)
        .lte('lost_date', end)
        .order('lost_date', { ascending: false });

      if (error) throw error;
      return (data || []) as LostRevenueItem[];
    },
  });
};

export const useLostRevenueSummary = (month?: Date) => {
  const { data: items, isLoading } = useLostRevenue(month);

  const summary: LostRevenueSummary = {
    total_lost: 0,
    no_show_count: 0,
    late_cancel_count: 0,
    empty_slot_count: 0,
    cancelled_count: 0,
    top_offenders: [],
  };

  if (items && items.length > 0) {
    // Calculate totals
    items.forEach(item => {
      summary.total_lost += Number(item.value_lost) || 0;
      
      switch (item.reason) {
        case 'no_show':
          summary.no_show_count++;
          break;
        case 'late_cancel':
          summary.late_cancel_count++;
          break;
        case 'empty_slot':
          summary.empty_slot_count++;
          break;
        case 'cancelled':
          summary.cancelled_count++;
          break;
      }
    });

    // Calculate top offenders
    const offenderMap = new Map<string, { total: number; count: number; phone: string | null }>();
    
    items.forEach(item => {
      if (item.customer_name) {
        const existing = offenderMap.get(item.customer_name) || { total: 0, count: 0, phone: null };
        offenderMap.set(item.customer_name, {
          total: existing.total + (Number(item.value_lost) || 0),
          count: existing.count + 1,
          phone: item.customer_phone,
        });
      }
    });

    summary.top_offenders = Array.from(offenderMap.entries())
      .map(([name, data]) => ({
        customer_name: name,
        customer_phone: data.phone,
        total_lost: data.total,
        incidents: data.count,
      }))
      .sort((a, b) => b.total_lost - a.total_lost)
      .slice(0, 5);
  }

  return { summary, isLoading };
};
