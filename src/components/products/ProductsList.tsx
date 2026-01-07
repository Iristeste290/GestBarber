import { memo, useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, AlertTriangle, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { handleError, handleSuccess } from "@/lib/error-handler";
import { useFormatters } from "@/hooks/usePerformance";

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

interface ProductsListProps {
  products: Product[];
}

// Memoized product card component
const ProductCard = memo(function ProductCard({
  product,
  formatCurrency,
  onDelete
}: {
  product: Product;
  formatCurrency: (value: number) => string;
  onDelete: (id: string) => void;
}) {
  const isLowStock = product.stock_quantity <= product.min_stock_level;
  
  const handleDeleteClick = useCallback(() => {
    onDelete(product.id);
  }, [onDelete, product.id]);

  return (
    <Card className="hover-lift contain-layout">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{product.name}</CardTitle>
            {product.description && (
              <CardDescription className="line-clamp-2 mt-1">
                {product.description}
              </CardDescription>
            )}
          </div>
          <Badge variant={product.is_active ? "default" : "secondary"} className="flex-shrink-0">
            {product.is_active ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Preço:</span>
          <span className="text-lg font-bold">{formatCurrency(product.price)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Estoque:</span>
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isLowStock ? "text-destructive" : "text-green-600"}`}>
              {product.stock_quantity} un.
            </span>
            {isLowStock && (
              <AlertTriangle className="w-4 h-4 text-destructive" />
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Mín: {product.min_stock_level} un.
        </div>
        <Button
          variant="destructive"
          size="sm"
          className="w-full mt-2 transition-gpu"
          onClick={handleDeleteClick}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Remover Produto
        </Button>
      </CardContent>
    </Card>
  );
});

export const ProductsList = memo(function ProductsList({ products }: ProductsListProps) {
  const queryClient = useQueryClient();
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const { formatCurrency } = useFormatters();

  const deleteMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleSuccess('Produto removido', 'O produto foi excluído com sucesso.');
      setProductToDelete(null);
    },
    onError: (error) => {
      handleError(error, {
        title: 'Erro ao remover produto',
        description: 'Não foi possível excluir o produto. Tente novamente.'
      });
    }
  });

  const handleDelete = useCallback((id: string) => {
    setProductToDelete(id);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (productToDelete) {
      deleteMutation.mutate(productToDelete);
    }
  }, [productToDelete, deleteMutation]);

  const handleCloseDialog = useCallback((open: boolean) => {
    if (!open) setProductToDelete(null);
  }, []);

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Package className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            Nenhum produto cadastrado
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Comece adicionando produtos ao seu estoque
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 contain-layout">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            formatCurrency={formatCurrency}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <ConfirmationDialog
        open={!!productToDelete}
        onOpenChange={handleCloseDialog}
        onConfirm={handleConfirmDelete}
        title="Confirmar exclusão"
        description="Tem certeza que deseja remover este produto? Esta ação não pode ser desfeita."
        confirmText="Remover"
        cancelText="Cancelar"
        variant="destructive"
      />
    </>
  );
});
