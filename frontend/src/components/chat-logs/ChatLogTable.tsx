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

interface ChatLog {
  id: string
  sessionId: string
  clientInfo: string
  startTime: string
  duration: string
  messageCount: number
  topics?: string[]
}

interface ChatLogTableProps {
  chatLogs: ChatLog[]
  onViewDetails: (chatLog: ChatLog) => void
  onExport: (chatLog: ChatLog) => void
  onDelete: (chatLog: ChatLog) => void
}

export function ChatLogTable({
  chatLogs,
  onViewDetails,
  onExport,
  onDelete,
}: ChatLogTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Session ID</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Startzeit</TableHead>
            <TableHead>Dauer</TableHead>
            <TableHead>Nachrichten</TableHead>
            <TableHead>Themen</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {chatLogs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>{log.sessionId.substring(0, 8)}...</span>
                </div>
              </TableCell>
              <TableCell>{log.clientInfo}</TableCell>
              <TableCell>{log.startTime}</TableCell>
              <TableCell>{log.duration}</TableCell>
              <TableCell>{log.messageCount}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {log.topics?.map((topic) => (
                    <Badge key={topic} variant="outline" className="max-w-[120px] truncate">
                      {topic}
                    </Badge>
                  )) || "-"}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Menü öffnen</span>
                      <MoreHorizontal className="h-4 w-4" />
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
                      className="text-red-600 focus:text-red-600"
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