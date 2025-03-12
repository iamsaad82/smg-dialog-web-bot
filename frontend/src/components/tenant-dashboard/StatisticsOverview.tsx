import React from "react"
import { FileText, MessageSquare, Database, Users } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface StatType {
  title: string
  value: string
  description: string
  icon: React.ElementType
  change?: { value: string; positive: boolean }
}

interface StatisticsOverviewProps {
  stats?: StatType[]
}

export function StatisticsOverview({ stats = defaultStats }: StatisticsOverviewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  )
}

function StatCard({ title, value, description, icon: Icon, change }: StatType) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {change && (
          <div className={`mt-2 text-xs ${change.positive ? 'text-green-500' : 'text-red-500'}`}>
            {change.positive ? '↗' : '↘'} {change.value}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const defaultStats: StatType[] = [
  {
    title: "Dokumente",
    value: "49",
    description: "Total im System",
    icon: FileText,
    change: { value: "+12% seit letztem Monat", positive: true }
  },
  {
    title: "Chatverläufe",
    value: "2,345",
    description: "Letzte 30 Tage",
    icon: MessageSquare,
    change: { value: "+5% seit letztem Monat", positive: true }
  },
  {
    title: "Datenmenge",
    value: "15.4 MB",
    description: "Indizierter Textinhalt",
    icon: Database,
    change: { value: "+8% seit letztem Monat", positive: true }
  },
  {
    title: "Nutzer",
    value: "128",
    description: "Aktive Chatnutzer",
    icon: Users,
    change: { value: "+22% seit letztem Monat", positive: true }
  }
] 