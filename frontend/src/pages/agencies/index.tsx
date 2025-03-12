import React, { useState, useEffect } from "react"
import api from "@/api"
import { Agency } from "@/types/api"
import { toast } from "@/utils/toast"

import { AdminLayout } from "@/components/layouts/admin-layout"
import { AgenciesTable } from "@/components/agencies/AgenciesTable"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import Link from "next/link"
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

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [agencyToDelete, setAgencyToDelete] = useState<Agency | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const loadAgencies = async () => {
      try {
        setLoading(true)
        // Simulierte Agenturen für die Entwicklungsphase
        // TODO: Durch echte API-Anfrage ersetzen, wenn Backend bereit ist
        const dummyAgencies: Agency[] = [
          {
            id: "agency1",
            name: "Media GmbH",
            description: "Digital Marketing und Contentstrategie",
            contact_email: "info@media-gmbh.de",
            logo_url: "https://via.placeholder.com/150",
            address: "Musterstraße 123, 10115 Berlin",
            phone: "+49 30 123456789",
            website: "https://media-gmbh.de",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            managed_tenant_ids: ["tenant1", "tenant2", "tenant3"]
          },
          {
            id: "agency2",
            name: "Content Factory",
            description: "Content Creation und Textproduktion",
            contact_email: "kontakt@contentfactory.de",
            logo_url: "",
            address: "Hauptstraße 45, 60313 Frankfurt",
            phone: "+49 69 987654321",
            website: "https://contentfactory.de",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            managed_tenant_ids: ["tenant4"]
          }
        ];
        
        // Auskommentiert, bis Backend-Route implementiert ist
        // const agenciesData = await api.getAllAgencies()
        setAgencies(dummyAgencies);
        setError(null)
      } catch (err) {
        console.error("Fehler beim Laden der Agenturen:", err)
        setError("Fehler beim Laden der Agenturen")
      } finally {
        setLoading(false)
      }
    }

    loadAgencies()
  }, [])

  const handleDeleteAgency = async (agency: Agency) => {
    setAgencyToDelete(agency)
  }

  const confirmDelete = async () => {
    if (!agencyToDelete) return

    try {
      setIsDeleting(true)
      // Auskommentiert, bis Backend-Route implementiert ist
      // await api.deleteAgency(agencyToDelete.id)
      setAgencies((prev) => prev.filter((a) => a.id !== agencyToDelete.id))
      toast.success("Agentur erfolgreich gelöscht")
    } catch (error) {
      console.error("Fehler beim Löschen der Agentur:", error)
      toast.error("Fehler beim Löschen der Agentur", {
        description: "Bitte versuchen Sie es später erneut."
      })
    } finally {
      setIsDeleting(false)
      setAgencyToDelete(null)
    }
  }

  // Client-seitiges Rendering
  if (!mounted) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    )
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="rounded-lg border border-destructive p-4 text-destructive">
          <p>{error}</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agenturen</h1>
            <p className="text-muted-foreground mt-1">
              Verwalten Sie Ihre Partner-Agenturen im System
            </p>
          </div>
          <Button variant="default">
            <Link href="/agencies/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Agentur anlegen
            </Link>
          </Button>
        </div>

        <AgenciesTable 
          agencies={agencies} 
          onDelete={handleDeleteAgency} 
        />

        <AlertDialog open={!!agencyToDelete} onOpenChange={(open) => !open && setAgencyToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Agentur löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie wirklich die Agentur &quot;{agencyToDelete?.name}&quot; löschen? Diese Aktion kann nicht rückgängig gemacht werden
                und alle zugehörigen Daten werden dauerhaft gelöscht.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {isDeleting ? "Löschen..." : "Löschen"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  )
} 