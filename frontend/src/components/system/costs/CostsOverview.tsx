import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Download, Filter, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';

// Typen für die API-Kosten
interface ApiCostEntry {
  id: string;
  date: string;
  customer: string;
  service: 'chat' | 'embedding' | 'vector-search';
  tokens: number;
  cost: number;
}

interface CustomerCosts {
  customer: string;
  totalCost: number;
  chatCost: number;
  embeddingCost: number;
  searchCost: number;
}

interface MonthlyCosts {
  month: string;
  totalCost: number;
  chatCost: number;
  embeddingCost: number;
  searchCost: number;
}

export function CostsOverview() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'year'>('30d');
  const [costEntries, setCostEntries] = useState<ApiCostEntry[]>([]);
  const [customerCosts, setCustomerCosts] = useState<CustomerCosts[]>([]);
  const [monthlyCosts, setMonthlyCosts] = useState<MonthlyCosts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const fetchCostData = async () => {
      setIsLoading(true);
      
      try {
        // Hier würde der tatsächliche API-Aufruf stehen
        // const response = await apiClient.getApiCosts(period);
        // const data = await response.json();
        
        // Simulierte Daten für den Prototyp
        const mockCostEntries: ApiCostEntry[] = [
          { id: '1', date: '2023-03-01', customer: 'AOK Bayern', service: 'chat', tokens: 15420, cost: 0.32 },
          { id: '2', date: '2023-03-01', customer: 'Stadtwerke München', service: 'embedding', tokens: 45000, cost: 0.90 },
          { id: '3', date: '2023-03-02', customer: 'BMW Group', service: 'chat', tokens: 28300, cost: 0.57 },
          { id: '4', date: '2023-03-03', customer: 'TK Krankenkasse', service: 'vector-search', tokens: 0, cost: 0.15 },
          { id: '5', date: '2023-03-04', customer: 'AOK Bayern', service: 'chat', tokens: 18200, cost: 0.36 },
          { id: '6', date: '2023-03-05', customer: 'Allianz Versicherung', service: 'embedding', tokens: 62000, cost: 1.24 },
          { id: '7', date: '2023-03-06', customer: 'BMW Group', service: 'vector-search', tokens: 0, cost: 0.22 },
          { id: '8', date: '2023-03-07', customer: 'Stadtwerke München', service: 'chat', tokens: 9800, cost: 0.20 },
          { id: '9', date: '2023-03-08', customer: 'TK Krankenkasse', service: 'chat', tokens: 12500, cost: 0.25 },
          { id: '10', date: '2023-03-09', customer: 'Allianz Versicherung', service: 'chat', tokens: 31200, cost: 0.62 },
        ];
        
        // Kosten nach Kunden aggregieren
        const customerCostsMap = new Map<string, CustomerCosts>();
        mockCostEntries.forEach(entry => {
          if (!customerCostsMap.has(entry.customer)) {
            customerCostsMap.set(entry.customer, {
              customer: entry.customer,
              totalCost: 0,
              chatCost: 0,
              embeddingCost: 0,
              searchCost: 0
            });
          }
          
          const customerData = customerCostsMap.get(entry.customer)!;
          customerData.totalCost += entry.cost;
          
          if (entry.service === 'chat') {
            customerData.chatCost += entry.cost;
          } else if (entry.service === 'embedding') {
            customerData.embeddingCost += entry.cost;
          } else if (entry.service === 'vector-search') {
            customerData.searchCost += entry.cost;
          }
        });
        
        // Monatliche Kosten simulieren
        const mockMonthlyCosts: MonthlyCosts[] = [
          { month: 'Jan', totalCost: 320.45, chatCost: 180.20, embeddingCost: 95.25, searchCost: 45.00 },
          { month: 'Feb', totalCost: 345.80, chatCost: 195.30, embeddingCost: 102.50, searchCost: 48.00 },
          { month: 'Mär', totalCost: 436.72, chatCost: 245.42, embeddingCost: 128.30, searchCost: 63.00 },
          { month: 'Apr', totalCost: 0, chatCost: 0, embeddingCost: 0, searchCost: 0 },
          { month: 'Mai', totalCost: 0, chatCost: 0, embeddingCost: 0, searchCost: 0 },
          { month: 'Jun', totalCost: 0, chatCost: 0, embeddingCost: 0, searchCost: 0 },
        ];
        
        // Gesamtkosten berechnen
        const total = mockCostEntries.reduce((sum, entry) => sum + entry.cost, 0);
        
        setCostEntries(mockCostEntries);
        setCustomerCosts(Array.from(customerCostsMap.values()));
        setMonthlyCosts(mockMonthlyCosts);
        setTotalCost(total);
      } catch (error) {
        console.error('Fehler beim Laden der Kostendaten:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCostData();
  }, [period]);

  // Farben für die Diagramme
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API-Kostenübersicht</h1>
          <p className="text-muted-foreground mt-1">
            Detaillierte Übersicht über die API-Nutzungskosten
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(value) => setPeriod(value as any)}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Zeitraum wählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Letzte 7 Tage</SelectItem>
              <SelectItem value="30d">Letzte 30 Tage</SelectItem>
              <SelectItem value="90d">Letzte 90 Tage</SelectItem>
              <SelectItem value="year">Dieses Jahr</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportieren
          </Button>
        </div>
      </div>
      
      {/* Kosten-Übersichtskarten */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gesamtkosten</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCost.toFixed(2)} €</div>
            <p className="text-xs text-muted-foreground">
              Im ausgewählten Zeitraum
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Durchschnitt pro Kunde</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customerCosts.length > 0 
                ? (totalCost / customerCosts.length).toFixed(2) 
                : "0.00"} €
            </div>
            <p className="text-xs text-muted-foreground">
              {customerCosts.length} aktive Kunden
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.4%</div>
            <p className="text-xs text-muted-foreground">
              Im Vergleich zum Vormonat
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="customers">Nach Kunden</TabsTrigger>
          <TabsTrigger value="services">Nach Diensten</TabsTrigger>
          <TabsTrigger value="details">Detaillierte Auflistung</TabsTrigger>
        </TabsList>
        
        {/* Übersichts-Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monatliche Kostenentwicklung</CardTitle>
              <CardDescription>
                Entwicklung der API-Kosten über die letzten Monate
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyCosts}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [`${value} €`, 'Kosten']} />
                  <Legend />
                  <Bar dataKey="chatCost" name="Chat" stackId="a" fill="#0088FE" />
                  <Bar dataKey="embeddingCost" name="Embedding" stackId="a" fill="#00C49F" />
                  <Bar dataKey="searchCost" name="Vektorsuche" stackId="a" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Kunden-Tab */}
        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kosten nach Kunden</CardTitle>
              <CardDescription>
                Verteilung der API-Kosten auf die verschiedenen Kunden
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={customerCosts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="totalCost"
                      nameKey="customer"
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {customerCosts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`${value.toFixed(2)} €`, 'Kosten']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kunde</TableHead>
                      <TableHead className="text-right">Kosten</TableHead>
                      <TableHead className="text-right">Anteil</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customerCosts.map((customer) => (
                      <TableRow key={customer.customer}>
                        <TableCell>{customer.customer}</TableCell>
                        <TableCell className="text-right">{customer.totalCost.toFixed(2)} €</TableCell>
                        <TableCell className="text-right">
                          {totalCost > 0 
                            ? `${((customer.totalCost / totalCost) * 100).toFixed(1)}%` 
                            : '0%'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Dienste-Tab */}
        <TabsContent value="services" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kosten nach Diensten</CardTitle>
              <CardDescription>
                Verteilung der API-Kosten auf die verschiedenen Dienste
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Hier könnte eine ähnliche Darstellung wie im Kunden-Tab erfolgen, 
                  aber mit Fokus auf die verschiedenen Dienste */}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Details-Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detaillierte Kostenaufstellung</CardTitle>
              <CardDescription>
                Einzelne Kosteneinträge im ausgewählten Zeitraum
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Datum</TableHead>
                    <TableHead>Kunde</TableHead>
                    <TableHead>Dienst</TableHead>
                    <TableHead className="text-right">Tokens</TableHead>
                    <TableHead className="text-right">Kosten</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costEntries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.date).toLocaleDateString('de-DE')}</TableCell>
                      <TableCell>{entry.customer}</TableCell>
                      <TableCell>
                        {entry.service === 'chat' && 'Chat'}
                        {entry.service === 'embedding' && 'Embedding'}
                        {entry.service === 'vector-search' && 'Vektorsuche'}
                      </TableCell>
                      <TableCell className="text-right">{entry.tokens.toLocaleString('de-DE')}</TableCell>
                      <TableCell className="text-right">{entry.cost.toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 