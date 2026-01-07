import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, User, Sparkles, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProductSaleFormProps {
  onSubmit: (sale: any) => void;
  isSubmitting: boolean;
}

export const ProductSaleForm = ({ onSubmit, isSubmitting }: ProductSaleFormProps) => {
  const [formData, setFormData] = useState({
    product_id: "",
    barber_id: "",
    quantity: "1",
    notes: "",
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ['products-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: barbers = [] } = useQuery({
    queryKey: ['barbers-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('barbers')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.product_id || !formData.barber_id || !formData.quantity) {
      return;
    }

    try {
      await onSubmit({
        product_id: formData.product_id,
        barber_id: formData.barber_id,
        quantity: parseInt(formData.quantity),
        notes: formData.notes || undefined,
      });

      // Show success state
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2000);

      setFormData({
        product_id: "",
        barber_id: "",
        quantity: "1",
        notes: "",
      });
    } catch (error) {
      // Error handling done in parent
    }
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);
  const totalPrice = selectedProduct ? selectedProduct.price * parseInt(formData.quantity || "1") : 0;
  const isFormValid = formData.product_id && formData.barber_id && formData.quantity;

  return (
    <Card className="overflow-hidden group">
      {/* Decorative header gradient */}
      <div className="h-1 bg-gradient-to-r from-primary via-primary/80 to-primary/60" />
      
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <ShoppingCart className="h-5 w-5 text-primary" />
          </div>
          <span>Registrar Venda</span>
          {selectedProduct && (
            <Badge variant="outline" className="ml-auto animate-scale-in">
              {selectedProduct.stock_quantity} em estoque
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Product Select */}
            <div className="space-y-2 group/field">
              <Label htmlFor="product" className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                Produto *
              </Label>
              <Select
                value={formData.product_id}
                onValueChange={(value) => setFormData({ ...formData, product_id: value })}
              >
                <SelectTrigger id="product" className="transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Selecione o produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem 
                      key={product.id} 
                      value={product.id}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2 w-full">
                        <span>{product.name}</span>
                        <span className="text-muted-foreground text-sm">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Barber Select */}
            <div className="space-y-2 group/field">
              <Label htmlFor="barber" className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground group-focus-within/field:text-primary transition-colors" />
                Barbeiro *
              </Label>
              <Select
                value={formData.barber_id}
                onValueChange={(value) => setFormData({ ...formData, barber_id: value })}
              >
                <SelectTrigger id="barber" className="transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20">
                  <SelectValue placeholder="Selecione o barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  {barbers.map((barber) => (
                    <SelectItem key={barber.id} value={barber.id} className="cursor-pointer">
                      {barber.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Quantity Input */}
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantidade *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={selectedProduct?.stock_quantity || 999}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                className="transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Total Display */}
            <div className="space-y-2">
              <Label>Total da Venda</Label>
              <div 
                className={`h-10 px-4 py-2 border-2 rounded-lg flex items-center justify-between transition-all ${
                  selectedProduct 
                    ? 'border-primary/30 bg-primary/5' 
                    : 'border-muted bg-muted/50'
                }`}
              >
                <Sparkles className={`h-4 w-4 transition-colors ${selectedProduct ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className={`font-bold text-xl transition-all ${selectedProduct ? 'text-primary scale-105' : 'text-muted-foreground'}`}>
                  R$ {totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              placeholder="Informações adicionais sobre a venda..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20 resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className={`w-full md:w-auto min-w-[200px] transition-all duration-300 ${
              isSuccess 
                ? 'bg-green-500 hover:bg-green-600' 
                : ''
            } ${isFormValid && !isSubmitting ? 'hover:shadow-lg hover:scale-[1.02]' : ''}`}
            disabled={isSubmitting || !isFormValid}
          >
            {isSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4 animate-scale-in" />
                Venda Registrada!
              </>
            ) : isSubmitting ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Registrando...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Registrar Venda
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
