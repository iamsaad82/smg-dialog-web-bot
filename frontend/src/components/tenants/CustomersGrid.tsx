import React from "react"
import Link from "next/link"
import { MoreHorizontal, ExternalLink, Settings, Bot, FileText, Trash2, Puzzle } from "lucide-react"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
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

import { Tenant } from "@/types/api"

interface CustomersGridProps {
  tenants: Tenant[]
  onDelete?: (tenant: Tenant) => void
  onTenantClick?: (tenant: Tenant) => void
}

export function CustomersGrid({ tenants, onDelete, onTenantClick }: CustomersGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tenants.map((tenant) => (
        <Card 
          key={tenant.id} 
          className={`overflow-hidden hover:shadow-md transition-shadow ${onTenantClick ? 'cursor-pointer' : ''}`} 
          onClick={() => onTenantClick && onTenantClick(tenant)}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between">
              <Link 
                href={`/tenants/${tenant.id}`} 
                className="hover:underline truncate max-w-[200px]"
                onClick={(e) => onTenantClick && e.preventDefault()}
              >
                {tenant.name}
              </Link>
              <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                Aktiv
              </Badge>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              ID: {tenant.id.substring(0, 8)}...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">API-Key:</span>
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  {tenant.api_key.substring(0, 8)}...
                </code>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dokumente:</span>
                <span>0</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Zuletzt aktiv:</span>
                <span className="text-xs">Heute, 14:30</span>
              </div>
            </div>
            
            <div className="flex justify-between mt-4 pt-2 border-t">
              <Button 
                variant="outline" 
                size="sm" 
                asChild={!onTenantClick}
                onClick={(e) => onTenantClick && e.stopPropagation()}
              >
                {onTenantClick ? (
                  <div className="flex items-center">
                    <Bot className="mr-2 h-4 w-4" />
                    Dashboard
                  </div>
                ) : (
                  <Link href={`/tenants/${tenant.id}`}>
                    <Bot className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                )}
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                  <DropdownMenuItem 
                    asChild={!onTenantClick}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onTenantClick) {
                        onTenantClick(tenant);
                      }
                    }}
                  >
                    {onTenantClick ? (
                      <div className="flex items-center">
                        <Bot className="mr-2 h-4 w-4" />
                        Dashboard
                      </div>
                    ) : (
                      <Link href={`/tenants/${tenant.id}`}>
                        <Bot className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    asChild 
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/tenants/${tenant.id}/documents`}>
                      <FileText className="mr-2 h-4 w-4" />
                      Dokumente
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/tenants/${tenant.id}/interactive`}>
                      <Puzzle className="mr-2 h-4 w-4" />
                      UI-Komponenten
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    asChild
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/tenants/${tenant.id}/settings`}>
                      <Settings className="mr-2 h-4 w-4" />
                      Einstellungen
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete && onDelete(tenant);
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Löschen
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 