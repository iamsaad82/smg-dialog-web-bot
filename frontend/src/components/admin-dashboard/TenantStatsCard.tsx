import React from "react"
import { Users, ArrowUp, ArrowDown, Building, Bot } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface TenantStat {
  title: string
  value: string | number
  description?: string
  change?: { value: string; positive: boolean }
  icon: React.ElementType
}

interface TenantStatsCardProps {
  stats?: TenantStat[]
}

export function TenantStatsCard({ stats = defaultStats }: TenantStatsCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon && <stat.icon className="h-4 w-4 text-muted-foreground" />}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            {stat.description && (
              <CardDescription>{stat.description}</CardDescription>
            )}
            {stat.change && (
              <div className={`mt-2 flex items-center text-xs ${stat.change.positive ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change.positive ? (
                  <ArrowUp className="mr-1 h-3 w-3" />
                ) : (
                  <ArrowDown className="mr-1 h-3 w-3" />
                )}
                {stat.change.value}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

const defaultStats: TenantStat[] = [
  {
    title: "Aktive Kunden",
    value: "12",
    description: "Gesamt im System",
    icon: Building,
    change: { value: "+2 (letzten 30 Tage)", positive: true }
  },
  {
    title: "Aktive Bots",
    value: "24",
    description: "Gesamt im System",
    icon: Bot,
    change: { value: "+5 (letzten 30 Tage)", positive: true }
  },
  {
    title: "Benutzer",
    value: "512",
    description: "Über alle Kunden",
    icon: Users,
    change: { value: "+48 (letzten 30 Tage)", positive: true }
  }
] 