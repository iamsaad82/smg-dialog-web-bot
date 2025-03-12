import React from "react"
import { User, Bot, FileText, PlusCircle, Trash2, RefreshCw, Settings } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface Activity {
  id: string
  type: "create_tenant" | "delete_tenant" | "create_document" | "update_settings" | "reindex" | "login"
  tenant?: string
  user: string
  timestamp: string
  description: string
}

interface RecentActivityProps {
  activities?: Activity[]
}

export function RecentActivity({ activities = defaultActivities }: RecentActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Letzte Aktivitäten</CardTitle>
        <CardDescription>Kürzlich durchgeführte Aktionen im System</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <ActivityIcon type={activity.type} />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{activity.user}</span>
                  {activity.tenant && (
                    <>
                      <span className="text-muted-foreground">in</span>
                      <span className="font-medium">{activity.tenant}</span>
                    </>
                  )}
                </div>
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
    case "create_tenant":
      return (
        <Avatar className="h-8 w-8 bg-green-100">
          <AvatarFallback className="bg-green-100 text-green-700">
            <PlusCircle className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )
    case "delete_tenant":
      return (
        <Avatar className="h-8 w-8 bg-red-100">
          <AvatarFallback className="bg-red-100 text-red-700">
            <Trash2 className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )
    case "create_document":
      return (
        <Avatar className="h-8 w-8 bg-blue-100">
          <AvatarFallback className="bg-blue-100 text-blue-700">
            <FileText className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )
    case "update_settings":
      return (
        <Avatar className="h-8 w-8 bg-amber-100">
          <AvatarFallback className="bg-amber-100 text-amber-700">
            <Settings className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )
    case "reindex":
      return (
        <Avatar className="h-8 w-8 bg-purple-100">
          <AvatarFallback className="bg-purple-100 text-purple-700">
            <RefreshCw className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )
    case "login":
      return (
        <Avatar className="h-8 w-8 bg-gray-100">
          <AvatarFallback className="bg-gray-100 text-gray-700">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )
    default:
      return (
        <Avatar className="h-8 w-8">
          <AvatarFallback>?</AvatarFallback>
        </Avatar>
      )
  }
}

const defaultActivities: Activity[] = [
  {
    id: "1",
    type: "create_tenant",
    user: "Admin",
    tenant: "Neu: Acme Corp",
    timestamp: "Vor 25 Minuten",
    description: "Tenant erstellt und API-Schlüssel generiert"
  },
  {
    id: "2",
    type: "login",
    user: "admin@example.com",
    timestamp: "Vor 1 Stunde",
    description: "Erfolgreicher Login"
  },
  {
    id: "3",
    type: "update_settings",
    user: "Admin",
    tenant: "Globex GmbH",
    timestamp: "Heute, 09:45 Uhr",
    description: "Bot-Einstellungen aktualisiert"
  },
  {
    id: "4",
    type: "create_document",
    user: "Benutzer: max.mustermann",
    tenant: "Umbrella AG",
    timestamp: "Gestern, 15:20 Uhr",
    description: "10 neue Dokumente hochgeladen"
  },
  {
    id: "5",
    type: "reindex",
    user: "Admin",
    tenant: "Stark Industries",
    timestamp: "Gestern, 12:15 Uhr",
    description: "Vollständige Neuindizierung durchgeführt"
  }
] 