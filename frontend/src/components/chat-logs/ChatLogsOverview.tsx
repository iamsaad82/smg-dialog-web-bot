import React, { useState } from "react"
import { Search, Download, Trash2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { ChatLogTable } from "./ChatLogTable"
import { ChatLogDetails } from "./ChatLogDetails"
import { toast } from "@/utils/toast"

// Demo-Daten
import { demoData } from "./demo-data"

interface ChatLogsOverviewProps {
  tenantId: string
}

export function ChatLogsOverview({ tenantId }: ChatLogsOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChatLog, setSelectedChatLog] = useState<typeof demoData.chatLogs[0] | null>(null)
  const [viewingChatLog, setViewingChatLog] = useState<typeof demoData.chatLogs[0] | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filtere Chatverläufe basierend auf der Suchanfrage
  const filteredChatLogs = demoData.chatLogs.filter((log) => {
    const lowerCaseQuery = searchQuery.toLowerCase()
    return (
      log.sessionId.toLowerCase().includes(lowerCaseQuery) ||
      log.clientInfo.toLowerCase().includes(lowerCaseQuery) ||
      log.topics?.some((topic) => topic.toLowerCase().includes(lowerCaseQuery))
    )
  })

  const handleViewDetails = (chatLog: typeof demoData.chatLogs[0]) => {
    setViewingChatLog(chatLog)
  }

  const handleExportChat = (chatLog: typeof demoData.chatLogs[0]) => {
    toast.info(`Chatlog für Session ${chatLog.sessionId} wird exportiert (Demo)`)
  }

  const handleDeleteChat = async () => {
    if (!selectedChatLog) return

    try {
      setIsDeleting(true)
      // Simuliere Löschvorgang
      await new Promise((resolve) => setTimeout(resolve, 500))
      toast.success(`Chatlog für Session ${selectedChatLog.sessionId} wurde gelöscht`)
    } catch (error) {
      console.error("Fehler beim Löschen:", error)
      toast.error("Fehler beim Löschen des Chat-Logs")
    } finally {
      setIsDeleting(false)
      setSelectedChatLog(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chatverläufe</h1>
          <p className="text-muted-foreground">
            Verwalten und analysieren Sie Chatverläufe für diesen Tenant
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" /> Alle Logs exportieren
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Suche nach Session ID, Client oder Themen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <ChatLogTable
        chatLogs={filteredChatLogs}
        onViewDetails={handleViewDetails}
        onExport={handleExportChat}
        onDelete={setSelectedChatLog}
      />

      <ChatLogDetails
        chatLog={viewingChatLog}
        open={!!viewingChatLog}
        onClose={() => setViewingChatLog(null)}
        onExport={() => viewingChatLog && handleExportChat(viewingChatLog)}
      />

      <AlertDialog open={!!selectedChatLog} onOpenChange={(open) => !open && setSelectedChatLog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chatverlauf löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie wirklich den Chatverlauf für die Session &quot;{selectedChatLog?.sessionId}&quot; löschen?
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteChat}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Löschen..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 