import React from "react"
import Link from "next/link"
import { MoreHorizontal, Building, Settings, Users, FileText, Trash2 } from "lucide-react"

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

import { Agency } from "@/types/api"

interface AgenciesTableProps {
  agencies: Agency[]
  onDelete?: (agency: Agency) => void
}

export function AgenciesTable({ agencies, onDelete }: AgenciesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Kunden</TableHead>
            <TableHead>Redakteure</TableHead>
            <TableHead>Kontakt</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agencies.map((agency) => (
            <TableRow key={agency.id}>
              <TableCell className="font-medium">
                <Link href={`/agencies/${agency.id}`} className="hover:underline flex items-center">
                  {agency.logo_url && (
                    <img 
                      src={agency.logo_url} 
                      alt={agency.name} 
                      className="w-6 h-6 mr-2 rounded-full"
                    />
                  )}
                  {!agency.logo_url && (
                    <Building className="w-5 h-5 mr-2 text-muted-foreground" />
                  )}
                  {agency.name}
                </Link>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50">
                  Aktiv
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant="secondary">{agency.managed_tenant_ids.length}</Badge>
              </TableCell>
              <TableCell>8</TableCell>
              <TableCell>
                <a href={`mailto:${agency.contact_email}`} className="text-primary hover:underline">
                  {agency.contact_email}
                </a>
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
                      <Link href={`/agencies/${agency.id}`}>
                        <Building className="mr-2 h-4 w-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/agencies/${agency.id}/customers`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Kunden verwalten
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/agencies/${agency.id}/editors`}>
                        <Users className="mr-2 h-4 w-4" />
                        Redakteure verwalten
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/agencies/${agency.id}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Einstellungen
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete && onDelete(agency)}
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