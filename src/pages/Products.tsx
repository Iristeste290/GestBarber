import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, ShoppingCart, Package, AlertTriangle, Trash2, TrendingUp, DollarSign, Sparkles } from "lucide-react";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { handleError, handleSuccess } from "@/lib/error-handler";
import { NewProductDialog } from "@/components/products/NewProductDialog";
import { ProductSaleForm } from "@/components/products/ProductSaleForm";
import { SalesHistory } from "@/components/products/SalesHistory";
import { AppLayout } from "@/components/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProductSales, type SalesPeriod } from "@/hooks/useProductSales";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductsPageSkeleton } from "@/components/skeletons/PageSkeletons";
import confetti from "canvas-confetti";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  min_stock_level: number;
  is_active: boolean;
  image_url: string | null;
}

const Products = () => {
  const { user, loading: authLoading } = useRequireAuth();
  const [isNewProductOpen, setIsNewProductOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("sales");
  const [salesPeriod, setSalesPeriod] = useState<SalesPeriod>("30d");
  const { sales, loadingSales, stats, createSale, isCreating } = useProductSales(salesPeriod);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading: productsLoading, refetch } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { data: sales, error: salesError } = await supabase
        .from('product_sales')
        .select('id')
        .eq('product_id', productId)
        .limit(1);
      
      if (salesError) throw salesError;
      
      if (sales && sales.length > 0) {
        throw new Error('Não é possível remover este produto pois já existem vendas registradas. Você pode desativá-lo em vez de removê-lo.');
      }
      
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleSuccess('Produto removido com sucesso!');
      setProductToDelete(null);
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao remover produto. Tente novamente.';
      handleError(error, {
        title: 'Erro ao remover produto',
        description: errorMessage
      });
    }
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', productId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleSuccess(
        variables.isActive 
          ? 'Produto ativado com sucesso!' 
          : 'Produto desativado com sucesso!'
      );
    },
    onError: (error) => {
      handleError(error, {
        title: 'Erro ao atualizar produto',
        description: 'Não foi possível alterar o status do produto. Tente novamente.'
      });
    }
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Enhanced sale handler with confetti
  const handleSaleSubmit = async (saleData: any) => {
    try {
      await createSale(saleData);
      // Trigger confetti celebration
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b']
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  // Calculate stock percentage for progress bar
  const getStockPercentage = (current: number, min: number) => {
    const maxStock = min * 4; // Assume max is 4x minimum
    return Math.min((current / maxStock) * 100, 100);
  };

  // Stats calculations
  const lowStockCount = products.filter(
    p => p.is_active && p.stock_quantity <= p.min_stock_level
  ).length;
  
  const totalStockValue = products.reduce(
    (sum, p) => sum + (p.price * p.stock_quantity), 0
  );

  const activeProductsCount = products.filter(p => p.is_active).length;

  return (
    <AppLayout title="Produtos & Vendas" description="Gerencie estoque e registre vendas">
      {authLoading || productsLoading ? (
        <ProductsPageSkeleton />
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Cards with staggered animation */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="animate-fade-in hover-scale group cursor-default" style={{ animationDelay: '0ms' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeProductsCount}</div>
                <p className="text-xs text-muted-foreground">de {products.length} cadastrados</p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in hover-scale group cursor-default" style={{ animationDelay: '50ms' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Valor em Estoque</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalStockValue)}</div>
                <p className="text-xs text-muted-foreground">total em produtos</p>
              </CardContent>
            </Card>

            <Card className="animate-fade-in hover-scale group cursor-default" style={{ animationDelay: '100ms' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Vendas do Mês</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-green-500 transition-colors" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{formatCurrency(stats?.monthRevenue || 0)}</div>
                <p className="text-xs text-muted-foreground">{stats?.salesCount || 0} vendas ({stats?.monthQuantity || 0} un.)</p>
              </CardContent>
            </Card>

            <Card className={`animate-fade-in hover-scale group cursor-default ${lowStockCount > 0 ? 'border-destructive/50' : ''}`} style={{ animationDelay: '150ms' }}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertTriangle className={`h-4 w-4 transition-colors ${lowStockCount > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground group-hover:text-amber-500'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${lowStockCount > 0 ? 'text-destructive' : ''}`}>{lowStockCount}</div>
                <p className="text-xs text-muted-foreground">produtos precisam repor</p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 transition-all">
              <TabsTrigger value="sales" className="transition-all data-[state=active]:shadow-md">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Vendas
                {stats?.salesCount ? (
                  <Badge variant="secondary" className="ml-2 animate-scale-in">{stats.salesCount}</Badge>
                ) : null}
              </TabsTrigger>
              <TabsTrigger value="products" className="transition-all data-[state=active]:shadow-md">
                <Package className="h-4 w-4 mr-2" />
                Estoque
                {lowStockCount > 0 && (
                  <Badge variant="destructive" className="ml-2 animate-pulse">{lowStockCount}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="space-y-6 animate-fade-in">
              <ProductSaleForm onSubmit={handleSaleSubmit} isSubmitting={isCreating} />
              <SalesHistory 
                sales={sales} 
                period={salesPeriod}
                onPeriodChange={setSalesPeriod}
                isLoading={loadingSales}
              />
            </TabsContent>

            <TabsContent value="products" className="space-y-6 animate-fade-in">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {products.length} produto(s) cadastrado(s)
                  </span>
                </div>
                <Button onClick={() => setIsNewProductOpen(true)} className="group transition-all hover:shadow-lg">
                  <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                  Novo Produto
                </Button>
              </div>

              {products.length === 0 ? (
                <EmptyState
                  icon={<Package className="h-12 w-12" />}
                  title="Nenhum produto cadastrado"
                  description="Comece adicionando produtos ao seu estoque"
                  action={
                    <Button onClick={() => setIsNewProductOpen(true)} className="group">
                      <Plus className="h-4 w-4 mr-2 group-hover:rotate-90 transition-transform" />
                      Adicionar Primeiro Produto
                    </Button>
                  }
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {products.map((product, index) => {
                    const stockPercentage = getStockPercentage(product.stock_quantity, product.min_stock_level);
                    const isLowStock = product.stock_quantity <= product.min_stock_level;
                    
                    return (
                      <Card 
                        key={product.id} 
                        className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-fade-in"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        {/* Product Image */}
                        {product.image_url ? (
                          <div className="relative h-40 overflow-hidden bg-muted">
                            <img 
                              src={product.image_url} 
                              alt={product.name}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        ) : (
                          <div className="relative h-28 overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                            <Package className="h-12 w-12 text-muted-foreground/30 group-hover:scale-110 transition-transform" />
                          </div>
                        )}

                        {/* Decorative gradient on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-2 right-2 h-8 w-8 text-destructive bg-background/80 backdrop-blur-sm hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                          onClick={() => setProductToDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        
                        <CardHeader className="pb-3 pr-12">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1 min-w-0">
                                <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                                  {product.name}
                                </CardTitle>
                                {product.description && (
                                  <CardDescription className="line-clamp-2 mt-1">
                                    {product.description}
                                  </CardDescription>
                                )}
                              </div>
                              <Badge 
                                variant={product.is_active ? "default" : "secondary"} 
                                className={`flex-shrink-0 transition-all ${product.is_active ? 'animate-scale-in' : ''}`}
                              >
                                {product.is_active ? (
                                  <><Sparkles className="h-3 w-3 mr-1" />Ativo</>
                                ) : "Inativo"}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                id={`active-${product.id}`}
                                checked={product.is_active}
                                onCheckedChange={(checked) => 
                                  toggleActiveMutation.mutate({ 
                                    productId: product.id, 
                                    isActive: checked 
                                  })
                                }
                                className="data-[state=checked]:bg-primary"
                              />
                              <Label htmlFor={`active-${product.id}`} className="text-sm text-muted-foreground cursor-pointer">
                                {product.is_active ? 'Produto ativo' : 'Produto desativado'}
                              </Label>
                            </div>
                          </div>
                        </CardHeader>
                        
                        <CardContent className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">Preço:</span>
                            <span className="text-xl font-bold text-primary">{formatCurrency(product.price)}</span>
                          </div>
                          
                          {/* Stock progress bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">Estoque:</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-semibold transition-colors ${isLowStock ? "text-destructive" : "text-green-600"}`}>
                                  {product.stock_quantity} un.
                                </span>
                                {isLowStock && (
                                  <AlertTriangle className="w-4 h-4 text-destructive animate-pulse" />
                                )}
                              </div>
                            </div>
                            <Progress 
                              value={stockPercentage} 
                              className={`h-2 transition-all ${isLowStock ? '[&>div]:bg-destructive' : '[&>div]:bg-green-500'}`}
                            />
                            <div className="text-xs text-muted-foreground flex justify-between">
                              <span>Mín: {product.min_stock_level} un.</span>
                              <span>{Math.round(stockPercentage)}% do ideal</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <NewProductDialog 
            open={isNewProductOpen} 
            onOpenChange={setIsNewProductOpen} 
            onAddProduct={refetch} 
          />

          <ConfirmationDialog
            open={!!productToDelete}
            onOpenChange={(open) => !open && setProductToDelete(null)}
            onConfirm={() => productToDelete && deleteMutation.mutate(productToDelete)}
            title="Tem certeza que deseja remover este produto?"
            description="Essa ação não pode ser desfeita."
            confirmText="Remover"
            cancelText="Cancelar"
            variant="destructive"
          />
        </div>
      )}
    </AppLayout>
  );
};

export default Products;
