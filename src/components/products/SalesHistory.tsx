import { memo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, TrendingUp, Package, Calendar } from "lucide-react";
import { useFormatters } from "@/hooks/usePerformance";
import { useLazyList, InfiniteScrollTrigger } from "@/components/ui/virtualized-list";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type SalesPeriod } from "@/hooks/useProductSales";

interface SalesHistoryProps {
  sales: any[];
  period: SalesPeriod;
  onPeriodChange: (period: SalesPeriod) => void;
  isLoading?: boolean;
}

const periodLabels: Record<SalesPeriod, string> = {
  "7d": "7 dias",
  "30d": "30 dias",
  "3m": "3 meses",
  "all": "Todo período",
};

// Memoized sale row component with animations
const SaleRow = memo(function SaleRow({
  sale,
  formatCurrency,
  formatDate,
  index
}: {
  sale: any;
  formatCurrency: (value: number) => string;
  formatDate: (date: string) => string;
  index: number;
}) {
  return (
    <div 
      className="flex flex-wrap items-center gap-2 p-3 border-b last:border-b-0 text-sm hover:bg-muted/50 transition-colors animate-fade-in group"
      style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
    >
      <span className="w-20 text-muted-foreground whitespace-nowrap">
        {formatDate(sale.sale_date)}
      </span>
      <div className="flex-1 min-w-[120px] flex items-center gap-2">
        <Package className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
        <span className="font-medium truncate group-hover:text-primary transition-colors">
          {sale.products?.name}
        </span>
      </div>
      <span className="w-24 text-muted-foreground truncate hidden sm:block">
        {sale.barbers?.name}
      </span>
      <Badge variant="outline" className="w-10 justify-center group-hover:border-primary/50 transition-colors">
        {sale.quantity}
      </Badge>
      <span className="w-20 text-right hidden md:block text-muted-foreground">
        {formatCurrency(sale.unit_price)}
      </span>
      <span className="w-24 text-right font-bold text-primary group-hover:scale-105 transition-transform origin-right">
        {formatCurrency(sale.total_price)}
      </span>
    </div>
  );
});

export const SalesHistory = memo(function SalesHistory({ 
  sales, 
  period, 
  onPeriodChange,
  isLoading 
}: SalesHistoryProps) {
  const { formatCurrency, formatDate } = useFormatters();
  const { visibleItems, hasMore, loadMore } = useLazyList(sales, 20, 15);

  // Calculate total from visible sales
  const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total_price), 0);

  const renderSaleItem = useCallback((sale: any, index: number) => (
    <SaleRow
      key={sale.id}
      sale={sale}
      formatCurrency={formatCurrency}
      formatDate={formatDate}
      index={index}
    />
  ), [formatCurrency, formatDate]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-muted/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <History className="h-5 w-5 text-primary" />
            </div>
            <span>Histórico de Vendas</span>
            {sales.length > 0 && (
              <Badge variant="secondary" className="ml-2 animate-scale-in">
                {sales.length}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-3">
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-[140px]">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">{periodLabels["7d"]}</SelectItem>
                <SelectItem value="30d">{periodLabels["30d"]}</SelectItem>
                <SelectItem value="3m">{periodLabels["3m"]}</SelectItem>
                <SelectItem value="all">{periodLabels["all"]}</SelectItem>
              </SelectContent>
            </Select>

            {sales.length > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-sm animate-fade-in">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-muted-foreground">Total:</span>
                <span className="font-bold text-primary">{formatCurrency(totalRevenue)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile total */}
        {sales.length > 0 && (
          <div className="sm:hidden flex items-center gap-2 text-sm mt-2 animate-fade-in">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-muted-foreground">Total do período:</span>
            <span className="font-bold text-primary">{formatCurrency(totalRevenue)}</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-0">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Carregando vendas...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-12 px-4 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <History className="h-8 w-8 text-muted-foreground/50" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">Nenhuma venda registrada</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {period === "all" 
                ? "As vendas aparecerão aqui após serem registradas"
                : `Nenhuma venda nos últimos ${periodLabels[period]}`
              }
            </p>
          </div>
        ) : (
          <div className="contain-layout">
            {/* Header */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 text-xs font-medium text-muted-foreground sticky top-0 z-10">
              <span className="w-20">Data</span>
              <span className="flex-1 min-w-[120px]">Produto</span>
              <span className="w-24 hidden sm:block">Barbeiro</span>
              <span className="w-10 text-center">Qtd</span>
              <span className="w-20 text-right hidden md:block">Unitário</span>
              <span className="w-24 text-right">Total</span>
            </div>
            
            {/* Virtualized list */}
            <div className="max-h-[400px] overflow-auto scrollbar-thin">
              {visibleItems.map((sale, index) => renderSaleItem(sale, index))}
              <InfiniteScrollTrigger onLoadMore={loadMore} hasMore={hasMore} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
