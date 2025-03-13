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
import { DemoChatLog } from "./ChatLogTable"

interface ChatLogDetailsProps {
  chatLog: DemoChatLog | null
  onClose: () => void
}

export function ChatLogDetails({
  chatLog,
  onClose,
}: ChatLogDetailsProps) {
  if (!chatLog) return null

  return (
    <Dialog open={!!chatLog} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Chat-Verlauf Details</DialogTitle>
          <DialogDescription>
            Session: <code className="font-mono bg-muted px-1 rounded">{chatLog.sessionId}</code>
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-3 gap-4 py-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Client:</p>
            <p className="text-sm text-muted-foreground">{chatLog.clientInfo}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Startzeit:</p>
            <p className="text-sm text-muted-foreground">{chatLog.startTime}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Dauer:</p>
            <p className="text-sm text-muted-foreground">{chatLog.duration}</p>
          </div>
        </div>
        
        {chatLog.topics && chatLog.topics.length > 0 && (
          <div className="space-y-2 border-t pt-4">
            <p className="text-sm font-medium">Erkannte Themen:</p>
            <div className="flex flex-wrap gap-1">
              {chatLog.topics.map((topic) => (
                <Badge key={topic} variant="secondary">{topic}</Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Nachrichtenverlauf:</p>
          
          <ScrollArea className="h-[400px] rounded-md border p-4">
            <div className="space-y-4">
              {chatLog.messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}>
                  {message.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  
                  <div className={`rounded-lg px-3 py-2 max-w-[80%] ${
                    message.role === 'user' 
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}>
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                      <span className="text-xs opacity-50 shrink-0 mt-1">
                        {message.timestamp}
                      </span>
                    </div>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Schließen
          </Button>
          <Button onClick={() => {
            // Handle export logic here
            onClose();
          }}>
            Exportieren
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 