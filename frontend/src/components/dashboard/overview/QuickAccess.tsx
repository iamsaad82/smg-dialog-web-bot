import React from 'react';
import Link from 'next/link';
import { Users, Terminal, Grid, Settings, Shield, RefreshCw, UserPlus } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface QuickAccessItem {
  id: string;
  label: string;
  icon: React.ElementType;
  href: string;
  variant?: 'default' | 'outline';
  onClick?: () => void;
}

export function QuickAccess() {
  // Quick-Access-Items definieren
  const quickAccessItems: QuickAccessItem[] = [
    {
      id: 'create-tenant',
      label: 'Neuen Kunden anlegen',
      icon: UserPlus,
      href: '/tenants/create',
      variant: 'default'
    },
    {
      id: 'all-tenants',
      label: 'Alle Kunden',
      icon: Users,
      href: '/tenants',
      variant: 'outline'
    },
    {
      id: 'system-logs',
      label: 'System-Logs',
      icon: Terminal,
      href: '/system/logs',
      variant: 'outline'
    },
    {
      id: 'system-settings',
      label: 'Einstellungen',
      icon: Settings,
      href: '/system/settings',
      variant: 'outline'
    },
    {
      id: 'backup',
      label: 'Backup erstellen',
      icon: Shield,
      href: '/system/backup',
      variant: 'outline'
    },
    {
      id: 'clear-cache',
      label: 'Cache leeren',
      icon: RefreshCw,
      href: '/system/cache',
      variant: 'outline'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schnellzugriff</CardTitle>
        <CardDescription>
          Häufig verwendete Funktionen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {quickAccessItems.map((item) => (
            <Button
              key={item.id}
              variant={item.variant || 'outline'}
              className="h-auto py-4 flex flex-col items-center justify-center gap-2"
              asChild
            >
              <Link href={item.href}>
                <item.icon className="h-8 w-8 mb-1" />
                <span className="text-center text-sm">{item.label}</span>
              </Link>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 