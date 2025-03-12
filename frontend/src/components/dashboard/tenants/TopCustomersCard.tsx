import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { apiClient } from '@/utils/api';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, MessageSquare, RefreshCw } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

// Top-Kunden-Typ mit zusätzlichen Metriken
interface TopCustomer {
  id: string;
  name: string;
  api_key: string;
  chatCount: number;
  documentCount: number;
  created_at: string;
}

export function TopCustomersCard() {
  const [customers, setCustomers] = useState<TopCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Kunden beim Laden der Komponente abrufen
  useEffect(() => {
    const fetchTopCustomers = async () => {
      setIsLoading(true);
      
      try {
        // Hier sollten die echten Daten von der API kommen
        // Im Echtsystem würde hier eine API-Anfrage stehen
        // apiClient.getTopCustomers() o.ä.
        
        // Für den Prototyp verwenden wir die Standard-Kunden-API,
        // die reale Kunden holt, und fügen simulierte Statistiken hinzu
        try {
          const response = await fetch('http://localhost:8000/api/v1/tenants', {
            headers: {
              'Content-Type': 'application/json',
            }
          });
        
          if (!response.ok) {
            throw new Error(`Fehler beim Laden der Kunden: ${response.status} ${response.statusText}`);
          }
        
          const customersData = await response.json();
          
          // Nur die Top 5 anzeigen und mit simulierten Statistiken anreichern
          const enrichedCustomers = customersData.slice(0, 5).map((customer: any, index: number) => ({
            ...customer,
            chatCount: Math.floor(Math.random() * 1500) + 500,
            documentCount: Math.floor(Math.random() * 50) + 10
          }));
        
          setCustomers(enrichedCustomers);
          setError(null);
        } catch (err) {
          console.error(err);
          // Bei Fehler: Simulierte Daten anzeigen
          const simulatedCustomers: TopCustomer[] = [
            { id: 'tenant1', name: 'AOK Bayern', api_key: 'ak_123456', chatCount: 1250, documentCount: 42, created_at: '2023-01-01' },
            { id: 'tenant2', name: 'Stadtwerke München', api_key: 'ak_234567', chatCount: 980, documentCount: 36, created_at: '2023-02-15' },
            { id: 'tenant3', name: 'BMW Group', api_key: 'ak_345678', chatCount: 850, documentCount: 29, created_at: '2023-03-10' },
            { id: 'tenant4', name: 'TK Krankenkasse', api_key: 'ak_456789', chatCount: 720, documentCount: 22, created_at: '2023-05-05' },
            { id: 'tenant5', name: 'Allianz Versicherung', api_key: 'ak_567890', chatCount: 650, documentCount: 18, created_at: '2023-06-20' }
          ];
          
          setCustomers(simulatedCustomers);
        }
      } catch (err) {
        console.error("Fehler beim Laden der Top-Kunden:", err);
        setError("Fehler beim Laden der Top-Kunden");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTopCustomers();
  }, []);

  // Handler für Kunden-Klick
  const handleCustomerClick = (customer: TopCustomer) => {
    // API-Key setzen und zur Detailseite navigieren
    apiClient.setApiKey(customer.api_key);
    // Zur Kunden-Detailseite navigieren
    router.push(`/tenants/${customer.id}`);
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-0.5">
          <CardTitle>Top-Kunden</CardTitle>
          <CardDescription>
            Die aktivsten Kunden nach Chat-Anfragen
          </CardDescription>
        </div>
        <Button asChild variant="ghost" className="h-8 w-8 p-0">
          <Link href="/tenants">
            <span className="sr-only">Alle Kunden anzeigen</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <div className="ml-auto">
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-4 text-gray-500">
            <p>{error}</p>
            <Button onClick={() => window.location.reload()} variant="ghost" className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Neu laden
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {customers.map((customer) => (
              <div 
                key={customer.id}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900 p-2 rounded-md transition-all"
                onClick={() => handleCustomerClick(customer)}
              >
                <Avatar className="h-9 w-9 border">
                  <AvatarImage src={`https://avatar.vercel.sh/${customer.id}.png`} alt={customer.name} />
                  <AvatarFallback>{customer.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <p className="text-sm font-medium">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.documentCount} Dokumente
                  </p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                  <MessageSquare className="h-3 w-3 mr-1 inline-block" />
                  <p className="text-sm font-medium">{customer.chatCount}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 