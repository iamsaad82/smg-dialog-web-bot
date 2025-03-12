import React from "react"

import { SystemStatusCard } from "./SystemStatusCard"
import { TenantStatsCard } from "./TenantStatsCard"
import { RecentActivity } from "./RecentActivity"
import { Button } from "@/components/ui/button"
import { DownloadIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export function AdminDashboard() {
  // Beispiel-Daten für Systemstatus
  const systemStatus = [
    {
      name: "API-Server",
      status: "online" as const,
      lastChecked: "Gerade eben",
    },
    {
      name: "Datenbank",
      status: "online" as const,
      lastChecked: "Gerade eben",
    },
    {
      name: "Weaviate Vector-DB",
      status: "online" as const,
      lastChecked: "Vor 5 Minuten",
    },
    {
      name: "Embedding-Service",
      status: "warning" as const,
      lastChecked: "Vor 10 Minuten",
      message: "Erhöhte Latenz"
    },
    {
      name: "LLM-Service",
      status: "online" as const,
      lastChecked: "Vor 2 Minuten",
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Übersicht über das System und alle Kunden
        </p>
      </div>

      <TenantStatsCard />

      <div className="grid gap-6 md:grid-cols-2">
        <SystemStatusCard systems={systemStatus} />
        <RecentActivity />
      </div>

      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <Button>
              <DownloadIcon className="mr-2 h-4 w-4" />
              Download
            </Button>
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Übersicht</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Systemübersicht</CardTitle>
                  <CardDescription>
                    Übersicht über das System und alle Kunden
                  </CardDescription>
                </CardHeader>
                // ... existing code ...
              </Card>
              // ... existing code ...
            </div>
            // ... existing code ...
          </TabsContent>
          // ... existing code ...
        </Tabs>
      </div>
    </div>
  )
} 