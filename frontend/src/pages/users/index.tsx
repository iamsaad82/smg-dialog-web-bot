import React, { useState, useEffect } from "react"
import api from "@/api"
import { User } from "@/types/api"
import { toast } from "@/utils/toast"

import { AdminLayout } from "@/components/layouts/admin-layout"
import { UsersTable } from "@/components/users/UsersTable"
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const loadUsers = async () => {
      try {
        setLoading(true)
        // Simulierte Benutzer für die Entwicklungsphase
        // TODO: Durch echte API-Anfrage ersetzen, wenn Backend bereit ist
        const dummyUsers: User[] = [
          {
            id: "usr1",
            username: "johndoe",
            email: "john@example.com",
            first_name: "John",
            last_name: "Doe",
            role: "editor" as any,
            agency_id: "agency1",
            assigned_tenant_ids: ["tenant1", "tenant2"],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "usr2",
            username: "janesmith",
            email: "jane@example.com",
            first_name: "Jane",
            last_name: "Smith",
            role: "agency_admin" as any,
            agency_id: "agency1",
            assigned_tenant_ids: ["tenant1", "tenant2", "tenant3"],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "usr3",
            username: "adminuser",
            email: "admin@example.com",
            first_name: "Admin",
            last_name: "User",
            role: "admin" as any,
            agency_id: null,
            assigned_tenant_ids: [],
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        
        // Auskommentiert, bis Backend-Route implementiert ist
        // const usersData = await api.getAllUsers()
        setUsers(dummyUsers);
        setError(null)
      } catch (err) {
        console.error("Fehler beim Laden der Benutzer:", err)
        setError("Fehler beim Laden der Benutzer")
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [])

  const handleDeleteUser = async (user: User) => {
    setUserToDelete(user)
  }

  const confirmDelete = async () => {
    if (!userToDelete) return

    try {
      setIsDeleting(true)
      // Auskommentiert, bis Backend-Route implementiert ist
      // await api.deleteUser(userToDelete.id)
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      toast.success("Benutzer erfolgreich gelöscht")
    } catch (error) {
      console.error("Fehler beim Löschen des Benutzers:", error)
      toast.error("Fehler beim Löschen des Benutzers", {
        description: "Bitte versuchen Sie es später erneut."
      })
    } finally {
      setIsDeleting(false)
      setUserToDelete(null)
    }
  }

  // Filtere Benutzer nach Rolle für die Tabs
  const filteredUsers = () => {
    if (activeTab === "all") return users
    if (activeTab === "editors") return users.filter(user => user.role === "editor")
    if (activeTab === "agency_admins") return users.filter(user => user.role === "agency_admin")
    if (activeTab === "admins") return users.filter(user => user.role === "admin")
    return users
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
            <h1 className="text-3xl font-bold tracking-tight">Benutzer</h1>
            <p className="text-muted-foreground mt-1">
              Verwalten Sie Redakteure, Agentur-Admins und andere Benutzer im System
            </p>
          </div>
          <Button variant="default">
            <Link href="/users/create">
              <PlusCircle className="mr-2 h-4 w-4" /> Benutzer anlegen
            </Link>
          </Button>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all">Alle Benutzer</TabsTrigger>
            <TabsTrigger value="editors">Redakteure</TabsTrigger>
            <TabsTrigger value="agency_admins">Agentur-Admins</TabsTrigger>
            <TabsTrigger value="admins">Administratoren</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <UsersTable 
              users={filteredUsers()} 
              onDelete={handleDeleteUser} 
            />
          </TabsContent>
          <TabsContent value="editors" className="mt-4">
            <UsersTable 
              users={filteredUsers()} 
              onDelete={handleDeleteUser} 
            />
          </TabsContent>
          <TabsContent value="agency_admins" className="mt-4">
            <UsersTable 
              users={filteredUsers()} 
              onDelete={handleDeleteUser} 
            />
          </TabsContent>
          <TabsContent value="admins" className="mt-4">
            <UsersTable 
              users={filteredUsers()} 
              onDelete={handleDeleteUser} 
            />
          </TabsContent>
        </Tabs>

        <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Benutzer löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Möchten Sie wirklich den Benutzer &quot;{userToDelete?.first_name} {userToDelete?.last_name}&quot; löschen? Diese Aktion kann nicht rückgängig gemacht werden
                und alle Zugriffsrechte werden dauerhaft gelöscht.
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