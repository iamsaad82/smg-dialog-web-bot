import React, { ReactNode } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { PageContent } from "@/components/layouts/content/page-content"
import { useIsMobile } from "@/hooks/use-mobile"

interface AdminLayoutProps {
  children: ReactNode
  breadcrumbItems?: {
    label: string
    href: string
    isCurrent?: boolean
  }[]
}

export function AdminLayout({ children, breadcrumbItems }: AdminLayoutProps) {
  const isMobile = useIsMobile()

  return (
    <div className="flex min-h-screen bg-background">
      <SidebarProvider defaultOpen={!isMobile}>
        <AppSidebar />
        <PageContent breadcrumbItems={breadcrumbItems}>
          {children}
        </PageContent>
      </SidebarProvider>
    </div>
  )
} 