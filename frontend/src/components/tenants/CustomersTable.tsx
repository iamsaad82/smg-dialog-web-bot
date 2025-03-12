import React from "react"
import Link from "next/link"
import { MoreHorizontal, ExternalLink, Settings, Bot, FileText, Trash2, Users, Building } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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

interface CustomersTableProps {
  tenants: Tenant[]
  onDelete?: (tenant: Tenant) => void
  showAgency?: boolean
}

export function CustomersTable({ tenants, onDelete, showAgency = true }: CustomersTableProps) {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);
  
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Status</TableHead>
            {showAgency && <TableHead>Agentur</TableHead>}
            <TableHead>Dokumente</TableHead>
            <TableHead>Zuletzt aktiv</TableHead>
            <TableHead>API-Schlüssel</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tenants.map((tenant) => (
            <TableRow key={tenant.id}>
              <TableCell className="font-medium">
                <Link href={`/tenants/${tenant.id}`} className="hover:underline">
                  {tenant.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                  Aktiv
                </Badge>
              </TableCell>
              {showAgency && (
                <TableCell>
                  <div className="flex items-center">
                    <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Media GmbH</span>
                  </div>
                </TableCell>
              )}
              <TableCell>42</TableCell>
              <TableCell>{mounted ? "Heute, 14:30" : "-"}</TableCell>
              <TableCell>
                <code className="rounded bg-muted px-1 py-0.5 text-xs">
                  {tenant.api_key.substring(0, 8)}...
                </code>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Menü öffnen</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Aktionen</DropdownMenuLabel>
                    <DropdownMenuItem asChild>
                      <Link href={`/tenants/${tenant.id}`}>
                        <Bot className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/tenants/${tenant.id}/documents`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Dokumente
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/tenants/${tenant.id}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Einstellungen
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/tenants/${tenant.id}/editors`}>
                        <Users className="mr-2 h-4 w-4" />
                        Redakteure verwalten
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/tenants/${tenant.id}/agency`}>
                        <Building className="mr-2 h-4 w-4" />
                        Agentur zuweisen
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete && onDelete(tenant)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Löschen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
} 