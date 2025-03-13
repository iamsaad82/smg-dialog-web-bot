import React from "react"
import { MessageSquare, MoreHorizontal, ExternalLink, Download, Trash2 } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { demoData } from "./demo-data"

// Verwende den vollständigen Chatlog-Typ aus den Demo-Daten
export type DemoChatLog = typeof demoData.chatLogs[0];

interface ChatLogTableProps {
  chatLogs: DemoChatLog[]
  onViewDetails: (chatLog: DemoChatLog) => void
  onExport: (chatLog: DemoChatLog) => void
  onDelete: (chatLog: DemoChatLog) => void
}

export function ChatLogTable({
  chatLogs,
  onViewDetails,
  onExport,
  onDelete,
}: ChatLogTableProps) {
  if (chatLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">Keine Chat-Logs gefunden</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Es wurden keine Chat-Logs mit den aktuellen Filterkriterien gefunden.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Session ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>Dauer</TableHead>
            <TableHead>Nachrichten</TableHead>
            <TableHead>Themen</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chatLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-xs">
                {log.sessionId}
              </TableCell>
              <TableCell>{log.clientInfo}</TableCell>
              <TableCell>{log.startTime}</TableCell>
              <TableCell>{log.duration}</TableCell>
              <TableCell>{log.messageCount}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {log.topics?.map((topic) => (
                    <Badge key={topic} variant="outline">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Menü öffnen</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onViewDetails(log)}>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Details anzeigen
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onExport(log)}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportieren
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete(log)}
                      className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 