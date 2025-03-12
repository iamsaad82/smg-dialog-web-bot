import React from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import { ChevronRight } from "lucide-react"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface PageHeaderProps {
  breadcrumbItems?: {
    label: string
    href: string
    isCurrent?: boolean
  }[]
}

export function PageHeader({ breadcrumbItems = [] }: PageHeaderProps) {
  const router = useRouter()
  
  // Automatische Breadcrumb-Generierung basierend auf dem Pfad, wenn keine Items angegeben sind
  const path = router.asPath
  const pathSegments = path.split('/').filter(Boolean)
  
  // Nur generieren, wenn keine expliziten Items angegeben wurden
  const generatedItems = breadcrumbItems.length === 0 && pathSegments.length > 0
    ? pathSegments.map((segment, index) => {
        const isId = segment.includes('[') || segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const label = isId ? "Detail" : segment.charAt(0).toUpperCase() + segment.slice(1);
        const isCurrent = index === pathSegments.length - 1;
        
        return { 
          label, 
          href, 
          isCurrent 
        };
      })
    : breadcrumbItems;

  return (
    <header className="flex h-16 shrink-0 items-center gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink href="/" asChild>
                <Link href="/">
                  Dashboard
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            
            {generatedItems.map((item, index) => (
              <React.Fragment key={item.href}>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  {item.isCurrent ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={item.href} asChild>
                      <Link href={item.href}>
                        {item.label}
                      </Link>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </header>
  )
} 