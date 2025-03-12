import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerCostsCardProps {
  customerId: string;
  customerName: string;
}

interface DailyCost {
  date: string;
  cost: number;
}

export function CustomerCostsCard({ customerId, customerName }: CustomerCostsCardProps) {
  const [dailyCosts, setDailyCosts] = useState<DailyCost[]>([]);
  const [totalCost, setTotalCost] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCustomerCosts = async () => {
      setIsLoading(true);
      
      try {
        // Hier würde der tatsächliche API-Aufruf stehen
        // const response = await apiClient.getCustomerCosts(customerId);
        // const data = await response.json();
        
        // Simulierte Daten für den Prototyp
        const today = new Date();
        const mockDailyCosts: DailyCost[] = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(today.getDate() - (29 - i));
          
          // Zufällige Kosten zwischen 0 und 20 Euro, mit höheren Werten an Wochentagen
          const dayOfWeek = date.getDay();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
          const baseCost = isWeekend ? 2 : 8;
          const randomFactor = Math.random() * 0.5 + 0.75; // 0.75 bis 1.25
          
          return {
            date: date.toISOString().split('T')[0],
            cost: parseFloat((baseCost * randomFactor).toFixed(2))
          };
        });
        
        // Gesamtkosten berechnen
        const total = mockDailyCosts.reduce((sum, entry) => sum + entry.cost, 0);
        
        // Monatlicher Durchschnitt (basierend auf 30 Tagen)
        const average = (total / 30) * 30;
        
        setDailyCosts(mockDailyCosts);
        setTotalCost(total);
        setMonthlyAverage(average);
        setError(null);
      } catch (err) {
        console.error('Fehler beim Laden der Kundenkostendaten:', err);
        setError('Fehler beim Laden der Kostendaten');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCustomerCosts();
  }, [customerId]);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>API-Kosten</CardTitle>
            <CardDescription>
              Kostenübersicht der letzten 30 Tage
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Details anzeigen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="h-[300px] flex flex-col items-center justify-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mb-2" />
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gesamtkosten</p>
                  <p className="text-2xl font-bold">{totalCost.toFixed(2)} €</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Monatlicher Durchschnitt</p>
                  <p className="text-2xl font-bold">{monthlyAverage.toFixed(2)} €</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Heutiger Verbrauch</p>
                  <p className="text-2xl font-bold">
                    {dailyCosts.length > 0 ? dailyCosts[dailyCosts.length - 1].cost.toFixed(2) : "0.00"} €
                  </p>
                </div>
              </div>
            </div>
            
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={dailyCosts}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value: string) => {
                      const date = new Date(value);
                      return `${date.getDate()}.${date.getMonth() + 1}`;
                    }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value} €`, 'Kosten']}
                    labelFormatter={(label: string) => {
                      const date = new Date(label);
                      return date.toLocaleDateString('de-DE');
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="cost" 
                    name="API-Kosten" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 