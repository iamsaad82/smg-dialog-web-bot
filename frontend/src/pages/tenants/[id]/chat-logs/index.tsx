import React from "react"
import { useRouter } from "next/router"

import { AdminLayout } from "@/components/layouts/admin-layout"
import { ChatLogsOverview } from "@/components/chat-logs/ChatLogsOverview"

export default function ChatLogsPage() {
  const router = useRouter()
  const { id } = router.query

  return (
    <AdminLayout>
      <ChatLogsOverview tenantId={id as string} />
    </AdminLayout>
  )
} 