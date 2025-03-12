import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { apiClient } from '../utils/api';
import { Tenant } from '../types/api';
import { AdminLayout } from "@/components/layouts/admin-layout";
import { 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  Server, 
  Database, 
  Bot, 
  FileText, 
  Users, 
  PuzzleIcon, 
  PieChart, 
  Settings, 
  Plus,
  Clock,
  ArrowUpRight,
  BarChart3,
  FileUp,
  MessageSquare,
  Grid,
  Shield,
  Terminal,
  HelpCircle,
  Copy
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DashboardLayout, 
  StatsHeader, 
  OverviewTab, 
  CustomersTab, 
  ComponentsTab, 
  SystemTab 
} from '@/components/dashboard';

export default function Home() {
  const [customers, setCustomers] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        
        // Admin-API-Key für den Zugriff auf die Kunden-Verwaltung
        const adminApiKey = "admin-secret-key-12345";
        
        // Direkte Anfrage mit Admin-API-Key
        const response = await fetch('http://localhost:8000/api/v1/tenants', {
          headers: {
            'X-API-Key': adminApiKey
          }
        });
        
        if (!response.ok) {
          throw new Error(`Fehler beim Laden der Kunden: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setCustomers(data);
        setError(null);
      } catch (err) {
        console.error('Fehler beim Laden der Kunden:', err);
        setError('Fehler beim Laden der Kunden');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  const handleCustomerClick = (customer: Tenant) => {
    // API-Key im Client speichern
    apiClient.setApiKey(customer.api_key);
    // Zur Kunden-Detailseite navigieren
    router.push(`/tenants/${customer.id}`);
  };

  const handleCreateCustomer = () => {
    router.push('/tenants/create');
  };

  // Mock-Daten für das Dashboard
  const systemStatus = [
    { name: "API-Server", status: "online", latency: "42ms" },
    { name: "Datenbank", status: "online", latency: "23ms" },
    { name: "Vector-DB", status: "online", latency: "65ms" },
    { name: "LLM-Service", status: "warning", latency: "230ms" },
    { name: "Embedding-Service", status: "online", latency: "85ms" }
  ];

  // Mock-Daten für Systemauslastung
  const systemLoad = {
    cpu: 42,
    memory: 58,
    storage: 34,
    network: 67
  };

  // Mock-Daten für Aktivitäten
  const recentActivities = [
    { type: "customer", text: "Neuer Kunde erstellt: AOK Bayern", time: "Vor 12 Minuten" },
    { type: "document", text: "48 Dokumente neu indexiert für Stadtwerke München", time: "Vor 28 Minuten" },
    { type: "component", text: "UI-Komponente 'OpeningHoursTable' aktualisiert", time: "Vor 42 Minuten" },
    { type: "chat", text: "Spitzenbelastung: 128 gleichzeitige Chat-Sessions", time: "Vor 1 Stunde" },
    { type: "system", text: "System-Update erfolgreich abgeschlossen", time: "Vor 3 Stunden" }
  ];

  // Top-Kunden basierend auf Chatvolumen
  const topCustomers = customers.slice(0, 5).map((customer, index) => ({
    ...customer,
    chatCount: 1250 - (index * 212),
    documentCount: 42 - (index * 6)
  }));

  // UI-Komponenten-Nutzungsstatistiken
  const componentStats = [
    { name: "OpeningHoursTable", count: 12, success: 96 },
    { name: "StoreMap", count: 8, success: 94 },
    { name: "ProductShowcase", count: 15, success: 98 },
    { name: "ContactCard", count: 22, success: 92 }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>KI-Bot Admin Dashboard</title>
        <meta name="description" content="Admin-Dashboard für das KI-Bot-System" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AdminLayout>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        ) : (
          <>
            {/* Statistik-Header */}
            <StatsHeader />
            
            {/* Haupt-Dashboard mit Tabs */}
            <DashboardLayout
              title="System-Dashboard"
              description="Übersicht und Status aller System-Komponenten"
              defaultTab="overview"
              tabs={[
                { id: "overview", label: "Übersicht" },
                { id: "tenants", label: "Kunden" },
                { id: "components", label: "UI-Komponenten" },
                { id: "status", label: "System-Status" }
              ]}
              tabContent={{
                overview: <OverviewTab />,
                tenants: <CustomersTab />,
                components: <ComponentsTab />,
                status: <SystemTab />
              }}
            />
          </>
        )}
      </AdminLayout>

      <footer className="bg-white dark:bg-gray-800 shadow mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} KI-Bot-System. Alle Rechte vorbehalten.
          </p>
        </div>
      </footer>
    </div>
  );
}