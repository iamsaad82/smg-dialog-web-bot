"use client"

import * as React from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import {
  Bot,
  ChevronRight,
  FileText,
  MessageSquare,
  Settings,
  LogOut,
  Code,
  PlayCircle,
  Building,
  Home,
  SquareTerminal,
  BookOpen,
  LifeBuoy,
  Send,
  MoreHorizontal,
  Layers,
  FileBarChart,
  DollarSign,
  Users,
} from "lucide-react"

import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const router = useRouter()
  const tenantId = router.query.id as string
  const [mounted, setMounted] = React.useState(false)

  // useEffect für Client-seitiges Rendering
  React.useEffect(() => {
    setMounted(true)
  }, [])

  // Platform Navigation Items
  const platformItems = [
    {
      title: "Dashboard",
      url: "/",
      icon: Home,
      isActive: mounted && (router.pathname === "/" || router.pathname === "/admin"),
    },
    {
      title: "Kunden",
      url: "/tenants",
      icon: Building,
      isActive: mounted && (router.pathname === "/tenants" || router.pathname === "/tenants/create"),
      badge: "Neu",
      items: [
        {
          title: "Alle Kunden",
          url: "/tenants",
        },
        {
          title: "Neuen Kunden anlegen",
          url: "/tenants/create",
        },
      ],
    },
    {
      title: "Agenturen",
      url: "/agencies",
      icon: Building,
      isActive: mounted && (router.pathname === "/agencies" || router.pathname === "/agencies/create"),
      items: [
        {
          title: "Alle Agenturen",
          url: "/agencies",
        },
        {
          title: "Neue Agentur anlegen",
          url: "/agencies/create",
        },
      ],
    },
    {
      title: "Benutzer",
      url: "/users",
      icon: Users,
      isActive: mounted && (router.pathname === "/users" || router.pathname === "/users/create"),
      items: [
        {
          title: "Alle Benutzer",
          url: "/users",
        },
        {
          title: "Redakteure",
          url: "/users?tab=editors",
        },
        {
          title: "Agentur-Admins",
          url: "/users?tab=agency_admins",
        },
        {
          title: "Neuen Benutzer anlegen",
          url: "/users/create",
        },
      ],
    },
    {
      title: "Dokumentation",
      url: "/system/documentation",
      icon: BookOpen,
      isActive: mounted && router.pathname === "/system/documentation",
    },
  ]

  // Systemtools Navigation
  const systemItems = [
    {
      title: "System-Logs",
      url: "/system/logs",
      icon: FileBarChart,
      isActive: mounted && router.pathname === "/system/logs",
    },
    {
      title: "API-Kosten",
      url: "/system/costs",
      icon: DollarSign,
      isActive: mounted && router.pathname === "/system/costs",
    },
    {
      title: "Einstellungen",
      url: "/system/settings",
      icon: Settings,
      isActive: mounted && router.pathname === "/system/settings",
    },
  ]

  // Nur anzeigen, wenn ein Tenant ausgewählt ist
  const projectItems = tenantId
    ? [
        {
          title: "Kunden-Dashboard",
          url: `/tenants/${tenantId}`,
          icon: Bot,
          isActive: mounted && router.pathname === `/tenants/${tenantId}`,
        },
        {
          title: "Dokumente",
          url: `/tenants/${tenantId}/documents`,
          icon: FileText,
          isActive: mounted && router.pathname.includes("/documents"),
        },
        {
          title: "Chatverläufe",
          url: `/tenants/${tenantId}/chat-logs`,
          icon: MessageSquare,
          isActive: mounted && router.pathname.includes("/chat-logs"),
        },
        {
          title: "UI-Komponenten",
          url: `/tenants/${tenantId}/interactive`,
          icon: Layers,
          isActive: mounted && router.pathname.includes("/interactive"),
        },
        {
          title: "Bot testen",
          url: `/tenants/${tenantId}/demo`,
          icon: PlayCircle,
          isActive: mounted && router.pathname.includes("/demo"),
          badge: "Demo",
        },
        {
          title: "Einstellungen",
          url: `/tenants/${tenantId}/settings`,
          icon: Settings,
          isActive: mounted && router.pathname.includes("/settings"),
        },
      ]
    : []

  // Support-Links und ergänzende Funktionen
  const supportItems = [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ]

  const userData = {
    name: "Admin",
    email: "admin@example.com",
    avatar: "",  // Leerer Avatar-Pfad, um das Fallback zu verwenden
  }

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Bot className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SMG Dialog</span>
                  <span className="truncate text-xs text-muted-foreground">Admin Dashboard</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Platform Navigation */}
        <NavMain items={platformItems} />
        
        {/* Tenant/Projects Navigation */}
        {projectItems.length > 0 && (
          <NavProjects items={projectItems} />
        )}
        
        {/* Systemtools Navigation */}
        <NavSystem items={systemItems} />
        
        {/* Support & Extras (at the bottom of sidebar content) */}
        <NavSecondary items={supportItems} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}

function NavMain({ items }: { 
  items: {
    title: string
    url: string
    icon: React.ElementType
    isActive?: boolean
    badge?: string
    items?: {
      title: string
      url: string
      badge?: string
    }[]
  }[] 
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible key={item.title} asChild defaultOpen={item.isActive}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip={item.title}>
                <Link href={item.url}>
                  <item.icon className="size-4" />
                  <span>{item.title}</span>
                  {item.badge && (
                    <Badge variant="outline" className="ml-auto">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight className="size-4" />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items?.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <Link href={subItem.url}>
                              <span>{subItem.title}</span>
                              {subItem.badge && (
                                <Badge variant="outline" className="ml-auto">
                                  {subItem.badge}
                                </Badge>
                              )}
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavProjects({ items }: {
  items: {
    title: string
    url: string
    icon: React.ElementType
    isActive?: boolean
    badge?: string
  }[]
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Projects</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link href={item.url}>
                <item.icon className="size-4" />
                <span>{item.title}</span>
                {item.badge && (
                  <Badge variant="outline" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton asChild>
            <Link href="#">
              <MoreHorizontal className="size-4" />
              <span>More</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavSystem({ items }: {
  items: {
    title: string
    url: string
    icon: React.ElementType
    isActive?: boolean
  }[]
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>System</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild tooltip={item.title}>
              <Link href={item.url}>
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}

function NavSecondary({ items, className }: {
  items: {
    title: string
    url: string
    icon: React.ElementType
  }[]
  className?: string
}) {
  return (
    <SidebarGroup className={className}>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton asChild size="sm">
              <Link href={item.url}>
                <item.icon className="size-4" />
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
