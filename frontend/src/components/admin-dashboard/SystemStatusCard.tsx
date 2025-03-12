import React from "react"
import { CheckCircle, XCircle, AlertCircle, Clock } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SystemStatus {
  name: string
  status: "online" | "offline" | "warning" | "maintenance"
  lastChecked: string
  message?: string
}

interface SystemStatusCardProps {
  systems: SystemStatus[]
}

export function SystemStatusCard({ systems }: SystemStatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Systemstatus</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {systems.map((system) => (
            <div key={system.name} className="flex items-center justify-between border-b pb-2 last:border-0">
              <div className="flex items-center gap-2">
                <StatusIcon status={system.status} />
                <div>
                  <div className="font-medium">{system.name}</div>
                  {system.message && (
                    <div className="text-sm text-muted-foreground">{system.message}</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={system.status} />
                <span className="text-xs text-muted-foreground">{system.lastChecked}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusIcon({ status }: { status: SystemStatus["status"] }) {
  switch (status) {
    case "online":
      return <CheckCircle className="h-5 w-5 text-green-500" />
    case "offline":
      return <XCircle className="h-5 w-5 text-red-500" />
    case "warning":
      return <AlertCircle className="h-5 w-5 text-amber-500" />
    case "maintenance":
      return <Clock className="h-5 w-5 text-blue-500" />
  }
}

function StatusBadge({ status }: { status: SystemStatus["status"] }) {
  const variants = {
    online: "bg-green-50 text-green-700 hover:bg-green-50",
    offline: "bg-red-50 text-red-700 hover:bg-red-50",
    warning: "bg-amber-50 text-amber-700 hover:bg-amber-50",
    maintenance: "bg-blue-50 text-blue-700 hover:bg-blue-50",
  }

  const labels = {
    online: "Online",
    offline: "Offline",
    warning: "Warnung",
    maintenance: "Wartung",
  }

  return (
    <Badge variant="outline" className={variants[status]}>
      {labels[status]}
    </Badge>
  )
} 