import React, { ReactNode } from "react"

import { SidebarInset } from "@/components/ui/sidebar"
import { PageHeader } from "@/components/layouts/header/page-header"

interface PageContentProps {
  children: ReactNode
  breadcrumbItems?: {
    label: string
    href: string
    isCurrent?: boolean
  }[]
}

export function PageContent({ children, breadcrumbItems }: PageContentProps) {
  return (
    <SidebarInset>
      <PageHeader breadcrumbItems={breadcrumbItems} />
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {children}
      </div>
    </SidebarInset>
  )
} 