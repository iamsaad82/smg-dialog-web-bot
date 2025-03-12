import React from 'react';
import Link from 'next/link';
import { Grid, PuzzleIcon, Copy, Settings } from 'lucide-react';
import { ComponentsStatsCard } from './ComponentsStatsCard';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ComponentsTab() {
  // Schnellzugriff auf UI-Komponenten-Funktionen
  const quickActions = [
    {
      id: 'gallery',
      label: 'Komponenten-Galerie',
      icon: Grid,
      href: '/system/components/gallery',
      variant: 'default' as const
    },
    {
      id: 'editor',
      label: 'Komponenten-Editor',
      icon: PuzzleIcon,
      href: '/system/components/editor',
      variant: 'outline' as const
    },
    {
      id: 'templates',
      label: 'Komponenten-Vorlagen',
      icon: Copy,
      href: '/system/components/templates',
      variant: 'outline' as const
    },
    {
      id: 'settings',
      label: 'Komponenten-Einstellungen',
      icon: Settings,
      href: '/system/components/settings',
      variant: 'outline' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* UI-Komponenten-Statistiken */}
      <div className="md:col-span-2">
        <ComponentsStatsCard />
      </div>
      
      {/* UI-Komponenten Schnellaktionen */}
      <div>
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Komponenten-Verwaltung</CardTitle>
            <CardDescription>
              Schnelle Aktionen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quickActions.map((action) => (
                <Button 
                  key={action.id}
                  asChild 
                  variant={action.variant}
                  className="w-full"
                >
                  <Link href={action.href}>
                    <action.icon className="mr-2 h-4 w-4" />
                    {action.label}
                  </Link>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 