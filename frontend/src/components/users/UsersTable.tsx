import React from "react"
import Link from "next/link"
import { MoreHorizontal, UserCircle, Settings, Building, FileText, Trash2 } from "lucide-react"

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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { User, UserRole } from "@/types/api"

interface UsersTableProps {
  users: User[]
  onDelete?: (user: User) => void
  showAgency?: boolean
}

export function UsersTable({ users, onDelete, showAgency = true }: UsersTableProps) {
  const [mounted, setMounted] = React.useState(false);
  
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Rollenbezeichnungen für das Frontend
  const roleLabels: Record<UserRole, string> = {
    [UserRole.ADMIN]: "Administrator",
    [UserRole.AGENCY_ADMIN]: "Agentur-Admin",
    [UserRole.EDITOR]: "Redakteur",
    [UserRole.VIEWER]: "Betrachter"
  }

  // Style-Klassen für Rollen-Badges
  const roleBadgeStyles: Record<UserRole, string> = {
    [UserRole.ADMIN]: "bg-red-50 text-red-700 hover:bg-red-50",
    [UserRole.AGENCY_ADMIN]: "bg-orange-50 text-orange-700 hover:bg-orange-50",
    [UserRole.EDITOR]: "bg-blue-50 text-blue-700 hover:bg-blue-50",
    [UserRole.VIEWER]: "bg-gray-50 text-gray-700 hover:bg-gray-50"
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead>Rolle</TableHead>
            {showAgency && <TableHead>Agentur</TableHead>}
            <TableHead>Kunden</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>E-Mail</TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={`https://avatar.vercel.sh/${user.username}`} alt={user.username} />
                    <AvatarFallback>{user.first_name.charAt(0)}{user.last_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <Link href={`/users/${user.id}`} className="hover:underline">
                    {user.first_name} {user.last_name}
                  </Link>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={roleBadgeStyles[user.role]}>
                  {roleLabels[user.role]}
                </Badge>
              </TableCell>
              {showAgency && (
                <TableCell>
                  {user.agency_id ? (
                    <Link href={`/agencies/${user.agency_id}`} className="flex items-center text-primary hover:underline">
                      <Building className="mr-2 h-4 w-4" />
                      Media GmbH
                    </Link>
                  ) : (
                    <span className="text-muted-foreground text-sm">Keine Agentur</span>
                  )}
                </TableCell>
              )}
              <TableCell>
                <Badge variant="secondary">{user.assigned_tenant_ids.length}</Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline" 
                  className={user.is_active ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}
                >
                  {user.is_active ? "Aktiv" : "Inaktiv"}
                </Badge>
              </TableCell>
              <TableCell>
                <a href={`mailto:${user.email}`} className="text-primary hover:underline">
                  {user.email}
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
                      <Link href={`/users/${user.id}`}>
                        <UserCircle className="mr-2 h-4 w-4" />
                        Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/users/${user.id}/customers`}>
                        <FileText className="mr-2 h-4 w-4" />
                        Kunden zuweisen
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/users/${user.id}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Einstellungen
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => onDelete && onDelete(user)}
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