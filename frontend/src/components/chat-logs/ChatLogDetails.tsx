import React from "react"
import { User, Bot } from "lucide-react"

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system"
  content: string
  timestamp: string
}

interface ChatLog {
  id: string
  sessionId: string
  clientInfo: string
  startTime: string
  duration: string
  messageCount: number
  topics?: string[]
  messages: ChatMessage[]
}

interface ChatLogDetailsProps {
  chatLog: ChatLog | null
  open: boolean
  onClose: () => void
  onExport: () => void
}

export function ChatLogDetails({
  chatLog,
  open,
  onClose,
  onExport,
}: ChatLogDetailsProps) {
  if (!chatLog) return null

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Chat-Konversation</DialogTitle>
          <DialogDescription>
            Sitzung: {chatLog.sessionId} | Client: {chatLog.clientInfo} | Start: {chatLog.startTime}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex flex-wrap gap-1">
          {chatLog.topics?.map((topic) => (
            <Badge key={topic} variant="outline">
              {topic}
            </Badge>
          ))}
        </div>

        <ScrollArea className="mt-4 h-[60vh]">
          <div className="space-y-4 px-1">
            {chatLog.messages.map((message) => (
              <div 
                key={message.id}
                className={`flex ${message.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}
              >
                <div 
                  className={`
                    flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm
                    ${message.role === "assistant" ? "bg-primary/10" : "bg-muted"}
                  `}
                >
                  {message.role === "assistant" ? (
                    <Bot className="h-4 w-4" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                </div>
                <div 
                  className={`
                    ml-4 flex max-w-[80%] flex-col space-y-2 rounded-lg px-4 py-2 shadow-sm
                    ${message.role === "assistant" ? "bg-primary/10" : "bg-muted"}
                  `}
                >
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2 sm:space-x-2">
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
          <Button onClick={onExport}>
            Konversation exportieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 