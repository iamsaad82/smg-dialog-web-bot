import React, { useState } from "react"
import Link from "next/link"
import { Tenant } from "@/types/api"
import { FileText, MessageSquare, Settings } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatisticsOverview } from "./StatisticsOverview"
import { RecentActivities } from "./RecentActivities"

interface TenantDashboardProps {
  tenant: Tenant
  isLoading: boolean
  error: string | null
}

export function TenantDashboard({ tenant, isLoading, error }: TenantDashboardProps) {
  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive p-4 text-destructive">
        <p>{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{tenant.name}</h1>
        <p className="text-muted-foreground">
          Dashboard und Übersicht für Ihren Tenant
        </p>
      </div>

      <StatisticsOverview />

      <div className="grid gap-4 md:grid-cols-2">
        <RecentActivities />
        
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Schnellzugriff</CardTitle>
            <CardDescription>
              Häufig verwendete Funktionen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button 
                className="w-full justify-start" 
                variant="outline"
                asChild
              >
                <Link href={`/tenants/${tenant.id}/documents`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Dokumente verwalten
                </Link>
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
                asChild
              >
                <Link href={`/tenants/${tenant.id}/chat-logs`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat-Logs ansehen
                </Link>
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
                asChild
              >
                <Link href={`/tenants/${tenant.id}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Einstellungen
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 