import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Plus, Settings, Copy, FileUp, PlusCircle, FileText, Upload } from 'lucide-react';
import { TopCustomersCard } from './TopCustomersCard';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function CustomersTab() {
  const router = useRouter();

  // Tenant erstellen
  const handleCreateTenant = () => {
    router.push('/tenants/create');
  };

  // Schnellaktion für Kunden definieren
  const tenantActions = [
    {
      id: 'create',
      icon: PlusCircle,
      label: 'Neuen Kunden anlegen',
      description: 'Erstellen Sie einen neuen Kunden',
      onClick: handleCreateTenant,
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Kunden-Einstellungen',
      description: 'Globale Einstellungen für Kunden verwalten',
      href: '/system/tenants/settings',
    },
    {
      id: 'templates',
      icon: FileText,
      label: 'Kunden-Vorlagen',
      description: 'Vordefinierte Vorlagen für Kunden',
      href: '/system/tenants/templates',
    },
    {
      id: 'import',
      icon: Upload,
      label: 'Kunden importieren',
      description: 'Kunden aus einer CSV-Datei importieren',
      href: '/system/tenants/import',
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <div className="space-y-4 md:col-span-2">
        {/* Top-Kunden */}
        <div className="md:col-span-2 lg:col-span-1">
          <TopCustomersCard />
        </div>

        {/* Schnellzugriff für Kunden */}
        <Card>
          <CardHeader>
            <CardTitle>Kunden-Verwaltung</CardTitle>
            <CardDescription>
              Schnellzugriff auf häufig verwendete Aktionen
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {tenantActions.map((action) => (
              action.href ? (
                <Button 
                  key={action.id}
                  asChild 
                  variant="outline"
                  className="w-full"
                >
                  <Link href={action.href}>
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Link>
                </Button>
              ) : (
                <Button 
                  key={action.id}
                  onClick={action.onClick}
                  variant="outline"
                  className="w-full"
                >
                  <action.icon className="mr-2 h-4 w-4" />
                  {action.label}
                </Button>
              )
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 