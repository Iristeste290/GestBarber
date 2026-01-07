import { Card, CardContent } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Wallet } from "lucide-react";

interface SessionHeaderProps {
  dailyBalance: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  dailyEntries: number;
  dailyExits: number;
}

export const SessionHeader = ({
  dailyBalance,
  weeklyRevenue,
  monthlyRevenue,
  dailyEntries,
  dailyExits,
}: SessionHeaderProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Saldo do Dia</p>
              <p className="text-xl md:text-2xl font-bold">
                R$ {dailyBalance.toFixed(2)}
              </p>
            </div>
            <Wallet className="h-7 w-7 md:h-8 md:w-8 text-primary" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Entradas Hoje</p>
              <p className="text-xl md:text-2xl font-bold text-green-600">
                R$ {dailyEntries.toFixed(2)}
              </p>
            </div>
            <TrendingUp className="h-7 w-7 md:h-8 md:w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Saídas Hoje</p>
              <p className="text-xl md:text-2xl font-bold text-red-600">
                R$ {dailyExits.toFixed(2)}
              </p>
            </div>
            <TrendingDown className="h-7 w-7 md:h-8 md:w-8 text-red-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Semana</p>
              <p className="text-xl md:text-2xl font-bold">
                R$ {weeklyRevenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-7 w-7 md:h-8 md:w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs md:text-sm font-medium text-muted-foreground">Mês</p>
              <p className="text-xl md:text-2xl font-bold">
                R$ {monthlyRevenue.toFixed(2)}
              </p>
            </div>
            <DollarSign className="h-7 w-7 md:h-8 md:w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};