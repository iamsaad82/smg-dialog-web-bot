import React, { useState, useEffect } from "react"
import { api } from "@/api"
import { User, UserRole } from "@/types/api"
import { toast } from "@/utils/toast"
import Head from "next/head"

import { ProtectedLayout } from "@/components/layouts/ProtectedLayout"
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
import { useAuth } from "@/contexts/AuthContext"

export default function UsersPage() {
  const { user: currentUser } = useAuth();
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
        
        // Echte API-Anfrage statt Dummy-Daten
        const usersData = await api.getAllUsers();
        setUsers(usersData);
        setError(null)
      } catch (err: any) {
        console.error("Fehler beim Laden der Benutzer:", err)
        setError(err?.message || "Fehler beim Laden der Benutzer")
        
        // Fallback zu Dummy-Daten im Entwicklungsmodus
        if (process.env.NODE_ENV === "development") {
          const dummyUsers: User[] = [
            {
              id: "usr1",
              username: "johndoe",
              email: "john@example.com",
              first_name: "John",
              last_name: "Doe",
              role: UserRole.EDITOR,
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
              role: UserRole.AGENCY_ADMIN,
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
              role: UserRole.ADMIN,
              agency_id: null,
              assigned_tenant_ids: [],
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          setUsers(dummyUsers);
          toast?.success?.("Verwende Dummy-Daten, da die API nicht erreichbar ist");
        }
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
      
      // Echte API-Anfrage zum Löschen des Benutzers
      await api.deleteUser(userToDelete.id)
      
      // Aktualisiere die Benutzerliste nach erfolgreichem Löschen
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
      toast.success("Benutzer erfolgreich gelöscht")
    } catch (error: any) {
      console.error("Fehler beim Löschen des Benutzers:", error)
      toast.error("Fehler beim Löschen des Benutzers", {
        description: error?.message || "Bitte versuchen Sie es später erneut."
      })
    } finally {
      setIsDeleting(false)
      setUserToDelete(null)
    }
  }

  // Prüfen, ob der aktuelle Benutzer Berechtigungen hat, Benutzer zu verwalten
  const canManageUsers = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.AGENCY_ADMIN;

  // Filtere Benutzer nach Rolle für die Tabs
  const filteredUsers = () => {
    if (activeTab === "all") return users
    if (activeTab === "editors") return users.filter(user => user.role === UserRole.EDITOR)
    if (activeTab === "agency_admins") return users.filter(user => user.role === UserRole.AGENCY_ADMIN)
    if (activeTab === "admins") return users.filter(user => user.role === UserRole.ADMIN)
    if (activeTab === "viewers") return users.filter(user => user.role === UserRole.VIEWER)
    return users
  }

  // Für Agentur-Admins: Filtere Benutzer ihrer Agentur
  const agencyFilteredUsers = () => {
    if (currentUser?.role === UserRole.AGENCY_ADMIN && currentUser?.agency_id) {
      return filteredUsers().filter(user => user.agency_id === currentUser.agency_id);
    }
    return filteredUsers();
  };

  // Client-seitiges Rendering
  if (!mounted) {
    return (
      <ProtectedLayout>
        <AdminLayout>
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </AdminLayout>
      </ProtectedLayout>
    )
  }

  if (loading) {
    return (
      <ProtectedLayout>
        <AdminLayout>
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          </div>
        </AdminLayout>
      </ProtectedLayout>
    )
  }

  if (error && users.length === 0) {
    return (
      <ProtectedLayout>
        <AdminLayout>
          <div className="rounded-lg border border-destructive p-4 text-destructive">
            <p>{error}</p>
          </div>
        </AdminLayout>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout>
      <Head>
        <title>Benutzerverwaltung | SMG Dialog</title>
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Benutzer</h1>
              <p className="text-muted-foreground mt-1">
                Verwalten Sie Redakteure, Agentur-Admins und andere Benutzer im System
              </p>
            </div>
            {canManageUsers && (
              <Button variant="default">
                <Link href="/users/create">
                  <div className="flex items-center">
                    <PlusCircle className="mr-2 h-4 w-4" /> Benutzer anlegen
                  </div>
                </Link>
              </Button>
            )}
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">Alle Benutzer</TabsTrigger>
              <TabsTrigger value="editors">Redakteure</TabsTrigger>
              <TabsTrigger value="agency_admins">Agentur-Admins</TabsTrigger>
              <TabsTrigger value="admins">Administratoren</TabsTrigger>
              <TabsTrigger value="viewers">Betrachter</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="mt-4">
              <UsersTable 
                users={agencyFilteredUsers()} 
                onDelete={canManageUsers ? handleDeleteUser : undefined} 
              />
            </TabsContent>
            <TabsContent value="editors" className="mt-4">
              <UsersTable 
                users={agencyFilteredUsers()} 
                onDelete={canManageUsers ? handleDeleteUser : undefined}
              />
            </TabsContent>
            <TabsContent value="agency_admins" className="mt-4">
              <UsersTable 
                users={agencyFilteredUsers()} 
                onDelete={canManageUsers ? handleDeleteUser : undefined}
              />
            </TabsContent>
            <TabsContent value="admins" className="mt-4">
              <UsersTable 
                users={agencyFilteredUsers()} 
                onDelete={canManageUsers ? handleDeleteUser : undefined}
              />
            </TabsContent>
            <TabsContent value="viewers" className="mt-4">
              <UsersTable 
                users={agencyFilteredUsers()} 
                onDelete={canManageUsers ? handleDeleteUser : undefined}
              />
            </TabsContent>
          </Tabs>

          <AlertDialog open={!!userToDelete} onOpenChange={(isOpen: boolean) => !isOpen && setUserToDelete(null)}>
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
    </ProtectedLayout>
  )
} 