import React, { useState } from "react"
import { Tenant } from "@/types/api"
import Link from "next/link"
import { PlusCircle, GridIcon, List } from "lucide-react"

import { CustomersTable } from "./CustomersTable"
import { CustomersGrid } from "./CustomersGrid"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CustomersOverviewProps {
  tenants: Tenant[]
  onDeleteTenant: (tenant: Tenant) => Promise<void>
}

export function CustomersOverview({ tenants, onDeleteTenant }: CustomersOverviewProps) {
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table')

  const handleDelete = async () => {
    if (!tenantToDelete) return

    try {
      setIsDeleting(true)
      await onDeleteTenant(tenantToDelete)
    } catch (error) {
      console.error("Fehler beim Löschen des Tenants:", error)
    } finally {
      setIsDeleting(false)
      setTenantToDelete(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kunden</h1>
          <p className="text-muted-foreground mt-1">
            Verwalten Sie Ihre Kunden-Unternehmen im System
          </p>
        </div>
        <Button variant="default">
          <Link href="/tenants/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Kunden anlegen
          </Link>
        </Button>
      </div>

      <div className="flex justify-end mb-4">
        <div className="border rounded-md overflow-hidden flex">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            onClick={() => setViewMode('table')}
            className="rounded-r-none border-0"
            size="sm"
          >
            <List className="mr-2 h-4 w-4" /> Tabelle
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            onClick={() => setViewMode('grid')}
            className="rounded-l-none border-0"
            size="sm"
          >
            <GridIcon className="mr-2 h-4 w-4" /> Kacheln
          </Button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <CustomersTable 
          tenants={tenants} 
          onDelete={(tenant) => setTenantToDelete(tenant)} 
        />
      ) : (
        <CustomersGrid 
          tenants={tenants} 
          onDelete={(tenant) => setTenantToDelete(tenant)} 
        />
      )}

      <AlertDialog open={!!tenantToDelete} onOpenChange={(open) => !open && setTenantToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kunden löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie wirklich den Kunden &quot;{tenantToDelete?.name}&quot; löschen? Diese Aktion kann nicht rückgängig gemacht werden
              und alle zugehörigen Daten werden dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? "Löschen..." : "Löschen"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 