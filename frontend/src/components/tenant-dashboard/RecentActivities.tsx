import React from "react"
import { FileText, MessageSquare, Upload, AlertCircle } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface Activity {
  id: string
  type: "document" | "chat" | "upload" | "alert"
  title: string
  description: string
  timestamp: string
}

interface RecentActivitiesProps {
  activities?: Activity[]
}

export function RecentActivities({ activities = defaultActivities }: RecentActivitiesProps) {
  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle>Letzte Aktivitäten</CardTitle>
        <CardDescription>
          Die neuesten Ereignisse in Ihrem Tenant
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <ActivityIcon type={activity.type} />
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityIcon({ type }: { type: Activity["type"] }) {
  switch (type) {
    case "document":
      return <FileText className="h-5 w-5 text-blue-500" />
    case "chat":
      return <MessageSquare className="h-5 w-5 text-green-500" />
    case "upload":
      return <Upload className="h-5 w-5 text-purple-500" />
    case "alert":
      return <AlertCircle className="h-5 w-5 text-orange-500" />
    default:
      return null
  }
}

const defaultActivities: Activity[] = [
  {
    id: "1",
    type: "upload",
    title: "Neues Dokument hochgeladen",
    description: "Produktkatalog-2023.pdf (4.2 MB)",
    timestamp: "Vor 25 Minuten"
  },
  {
    id: "2",
    type: "chat",
    title: "Neue Chatkonversation",
    description: "15 Nachrichten ausgetauscht mit Nutzer #45892",
    timestamp: "Vor 2 Stunden"
  },
  {
    id: "3",
    type: "document",
    title: "Dokument aktualisiert",
    description: "FAQ-Dokument wurde überarbeitet",
    timestamp: "Heute, 10:34 Uhr"
  },
  {
    id: "4",
    type: "alert",
    title: "Indizierungsfehler",
    description: "Ein Dokument konnte nicht vollständig indiziert werden",
    timestamp: "Gestern, 15:20 Uhr"
  },
  {
    id: "5",
    type: "chat",
    title: "Häufige Anfrage erkannt",
    description: "Mehrere Nutzer fragten nach Lieferzeiten",
    timestamp: "Gestern, 09:15 Uhr"
  }
] 