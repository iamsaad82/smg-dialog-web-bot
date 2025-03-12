import React from 'react';
import Link from 'next/link';
import { Terminal, Shield, RefreshCw, ArrowUpRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// System-Service-Typ
interface SystemServiceDetail {
  name: string;
  status: 'online' | 'warning' | 'offline';
  latency: string;
  message?: string;
  lastChecked: string;
}

export function SystemTab() {
  // Detaillierte System-Service-Informationen
  const systemServices: SystemServiceDetail[] = [
    { name: "API-Server", status: "online", latency: "42ms", lastChecked: "Gerade eben" },
    { name: "Datenbank", status: "online", latency: "23ms", lastChecked: "Gerade eben" },
    { name: "Weaviate Vector-DB", status: "online", latency: "65ms", lastChecked: "Vor 5 Minuten" },
    { name: "Embedding-Service", status: "warning", latency: "230ms", message: "Erhöhte Latenz", lastChecked: "Vor 10 Minuten" },
    { name: "LLM-Service", status: "online", latency: "85ms", lastChecked: "Vor 2 Minuten" }
  ];

  // Wartungsoptionen
  const maintenanceOptions = [
    {
      id: 'logs',
      label: 'System-Logs anzeigen',
      icon: Terminal,
      href: '/system/logs',
    },
    {
      id: 'backup',
      label: 'Backup erstellen',
      icon: Shield,
      href: '/system/backup',
    },
    {
      id: 'cache',
      label: 'Cache leeren',
      icon: RefreshCw,
      href: '/system/cache',
    },
    {
      id: 'updates',
      label: 'Nach Updates suchen',
      icon: ArrowUpRight,
      href: '/system/updates',
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* System-Status */}
      <Card>
        <CardHeader>
          <CardTitle>Dienst-Status</CardTitle>
          <CardDescription>
            Detaillierte Status aller System-Komponenten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemServices.map((service) => (
              <div key={service.name} className="p-3 border rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {service.status === 'online' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : service.status === 'warning' ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium">{service.name}</p>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4">
                      <span>Latenz: {service.latency}</span>
                      <span>Zuletzt geprüft: {service.lastChecked}</span>
                      {service.message && <span className="text-yellow-600">{service.message}</span>}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  Details
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* System-Wartung */}
      <Card>
        <CardHeader>
          <CardTitle>System-Wartung</CardTitle>
          <CardDescription>
            Wartungsoptionen und System-Aktionen
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {maintenanceOptions.map((option) => (
              <Button 
                key={option.id}
                asChild 
                variant="outline" 
                className="w-full text-left justify-between"
              >
                <Link href={option.href}>
                  <div className="flex items-center">
                    <option.icon className="mr-2 h-4 w-4" />
                    {option.label}
                  </div>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 