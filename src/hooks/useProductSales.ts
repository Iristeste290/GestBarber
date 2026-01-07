import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { handleError, handleSuccess } from "@/lib/error-handler";
import { subDays, subMonths, format } from "date-fns";

interface ProductSale {
  id: string;
  product_id: string;
  barber_id: string;
  client_id: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  sale_date: string;
  notes: string | null;
}

interface NewSale {
  product_id: string;
  barber_id: string;
  client_id?: string;
  quantity: number;
  notes?: string;
}

export type SalesPeriod = "7d" | "30d" | "3m" | "all";

export const useProductSales = (period: SalesPeriod = "30d") => {
  const queryClient = useQueryClient();

  // Calcular data de início baseado no período
  const getStartDate = (): string | null => {
    const now = new Date();
    switch (period) {
      case "7d":
        return format(subDays(now, 7), "yyyy-MM-dd");
      case "30d":
        return format(subDays(now, 30), "yyyy-MM-dd");
      case "3m":
        return format(subMonths(now, 3), "yyyy-MM-dd");
      case "all":
        return null;
    }
  };

  // Buscar vendas
  const { data: sales = [], isLoading: loadingSales } = useQuery<ProductSale[]>({
    queryKey: ['product-sales', period],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Buscar barbeiros do usuário
      const { data: userBarbers } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user.id);
      
      const barberIds = userBarbers?.map(b => b.id) || [];
      if (barberIds.length === 0) return [];

      let query = supabase
        .from('product_sales')
        .select(`
          *,
          products(name, image_url),
          barbers(name),
          profiles(full_name)
        `)
        .in('barber_id', barberIds)
        .order('sale_date', { ascending: false });

      const startDate = getStartDate();
      if (startDate) {
        query = query.gte('sale_date', startDate);
      }

      // Aumentar limite para "all"
      const limit = period === "all" ? 500 : 100;
      query = query.limit(limit);

      const { data, error } = await query;

      if (error) throw error;
      return data as any;
    },
    staleTime: 30000,
  });

  // Criar venda
  const createSale = useMutation({
    mutationFn: async (sale: NewSale) => {
      // Buscar preço atual do produto
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('price, stock_quantity')
        .eq('id', sale.product_id)
        .single();

      if (productError) throw productError;
      if (product.stock_quantity < sale.quantity) {
        throw new Error('Estoque insuficiente');
      }

      const unitPrice = product.price;
      const totalPrice = unitPrice * sale.quantity;

      const { data, error } = await supabase
        .from('product_sales')
        .insert({
          product_id: sale.product_id,
          barber_id: sale.barber_id,
          client_id: sale.client_id || null,
          quantity: sale.quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          notes: sale.notes,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-sales'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleSuccess('Venda registrada!', 'O estoque foi atualizado automaticamente');
    },
    onError: (error) => {
      handleError(error, { title: 'Erro ao registrar venda' });
    },
  });

  // Estatísticas de vendas
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['sales-stats'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { monthRevenue: 0, monthQuantity: 0, salesCount: 0 };

      // Buscar barbeiros do usuário
      const { data: userBarbers } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user.id);
      
      const barberIds = userBarbers?.map(b => b.id) || [];
      if (barberIds.length === 0) return { monthRevenue: 0, monthQuantity: 0, salesCount: 0 };

      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      const { data: monthSales } = await supabase
        .from('product_sales')
        .select('total_price, quantity')
        .in('barber_id', barberIds)
        .gte('sale_date', firstDayOfMonth.toISOString().split('T')[0]);

      const totalRevenue = monthSales?.reduce((sum, sale) => 
        sum + Number(sale.total_price), 0) || 0;
      
      const totalQuantity = monthSales?.reduce((sum, sale) => 
        sum + sale.quantity, 0) || 0;

      return {
        monthRevenue: totalRevenue,
        monthQuantity: totalQuantity,
        salesCount: monthSales?.length || 0,
      };
    },
    staleTime: 60000,
  });

  return {
    sales,
    loadingSales,
    stats,
    loadingStats,
    createSale: createSale.mutate,
    isCreating: createSale.isPending,
  };
};
