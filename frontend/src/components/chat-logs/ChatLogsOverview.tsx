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

// Die vollständige Demo-Chatlog-Struktur
type DemoChatLog = typeof demoData.chatLogs[0];

interface ChatLogsOverviewProps {
  tenantId: string
}

export function ChatLogsOverview({ tenantId }: ChatLogsOverviewProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedChatLog, setSelectedChatLog] = useState<DemoChatLog | null>(null)
  const [viewingChatLog, setViewingChatLog] = useState<DemoChatLog | null>(null)
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

  const handleViewDetails = (chatLog: DemoChatLog) => {
    setViewingChatLog(chatLog)
  }

  const handleExportChat = (chatLog: DemoChatLog) => {
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

      {viewingChatLog && (
        <ChatLogDetails
          chatLog={viewingChatLog}
          onClose={() => setViewingChatLog(null)}
        />
      )}

      <AlertDialog open={!!selectedChatLog} onOpenChange={() => selectedChatLog && setSelectedChatLog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Chat-Log löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Sind Sie sicher, dass Sie diesen Chat-Verlauf löschen möchten?
              Dies kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteChat()
              }}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Trash2 className="mr-2 h-4 w-4 animate-spin" />
                  Löschen...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Löschen
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 