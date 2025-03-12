import React, { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Head from "next/head"
import { api } from "@/api"
import { User, UserRole } from "@/types/api"
import { toast } from "@/utils/toast"

import { ProtectedLayout } from "@/components/layouts/ProtectedLayout"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowLeft, User as UserIcon, MailIcon, Building, Users } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function UserDetailPage() {
  const router = useRouter()
  const { id } = router.query
  const { user: currentUser } = useAuth()
  
  const [user, setUser] = useState<User | null>(null)
  const [agencies, setAgencies] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [assignedTenants, setAssignedTenants] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [editMode, setEditMode] = useState(false)

  // Formularfelder
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<UserRole>(UserRole.VIEWER)
  const [agencyId, setAgencyId] = useState<string | undefined>(undefined)
  const [isActive, setIsActive] = useState(true)
  
  // Benutzerrollen-Berechtigungen
  const isAdmin = currentUser?.role === UserRole.ADMIN
  const isAgencyAdmin = currentUser?.role === UserRole.AGENCY_ADMIN
  const isCurrentUser = currentUser?.id === id
  
  // Prüfen, ob der Benutzer berechtigt ist, diesen Benutzer anzusehen
  const canViewUser = isAdmin || isAgencyAdmin || isCurrentUser
  
  // Prüfen, ob der Benutzer berechtigt ist, diesen Benutzer zu bearbeiten
  const canEditUser = (isAdmin || 
    (isAgencyAdmin && user?.agency_id === currentUser?.agency_id)) && 
    !isCurrentUser // Ein Benutzer sollte sich nicht selbst bearbeiten können (außer im Profil)

  // Prüfen, ob der Benutzer berechtigt ist, diesen Benutzer zu löschen
  const canDeleteUser = canEditUser && !isCurrentUser
  
  // Tabs
  const [activeTab, setActiveTab] = useState("details")
  
  useEffect(() => {
    // Benutzer, Agenturen und Tenants laden, wenn ID verfügbar ist
    if (id) {
      loadData()
    }
  }, [id])
  
  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Benutzer laden
      let userData: User | null = null
      try {
        userData = await api.getUser(id as string)
        setUser(userData)
        
        // Formularfelder initialisieren
        if (userData) {
          setFirstName(userData.first_name || "")
          setLastName(userData.last_name || "")
          setEmail(userData.email)
          setRole(userData.role)
          setAgencyId(userData.agency_id || undefined)
          setIsActive(userData.is_active)
          setAssignedTenants(userData.assigned_tenant_ids || [])
        }
      } catch (err) {
        console.error("Fehler beim Laden des Benutzers:", err)
        
        // Dummy-Daten im Entwicklungsmodus
        if (process.env.NODE_ENV === "development") {
          const dummyUser = {
            id: id as string,
            username: "testuser",
            email: "test@example.com",
            first_name: "Test",
            last_name: "User",
            role: UserRole.EDITOR,
            agency_id: "agency1",
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            assigned_tenant_ids: ["tenant1", "tenant3"]
          } as User;
          
          setUser(dummyUser);
          setFirstName(dummyUser.first_name || "");
          setLastName(dummyUser.last_name || "");
          setEmail(dummyUser.email);
          setRole(dummyUser.role);
          setAgencyId(dummyUser.agency_id || undefined);
          setIsActive(dummyUser.is_active);
          setAssignedTenants(dummyUser.assigned_tenant_ids || []);
          userData = dummyUser;
        } else {
          throw err
        }
      }
      
      // Tenants laden
      try {
        // API-Aufruf hier einkommentieren, wenn implementiert
        // const tenantsData = await api.getAllTenants()
        // setTenants(tenantsData)
        
        // Dummy-Daten für die Entwicklung
        setTenants([
          { id: "tenant1", name: "Kunde 1" },
          { id: "tenant2", name: "Kunde 2" },
          { id: "tenant3", name: "Kunde 3" },
        ])
      } catch (err) {
        console.error("Fehler beim Laden der Tenants:", err)
      }
      
      // Agenturen laden
      try {
        // API-Aufruf hier einkommentieren, wenn implementiert
        // const agenciesData = await api.getAllAgencies()
        // setAgencies(agenciesData)
        
        // Dummy-Daten für die Entwicklung
        setAgencies([
          { id: "agency1", name: "Media GmbH" },
          { id: "agency2", name: "Content Factory" },
        ])
      } catch (err) {
        console.error("Fehler beim Laden der Agenturen:", err)
      }
    } catch (err: any) {
      console.error("Fehler beim Laden der Daten:", err)
      setError(err?.message || "Fehler beim Laden der Benutzerdaten")
      toast.error("Fehler beim Laden der Benutzerdaten")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      setError(null)
      
      // Benutzerdaten aktualisieren
      const userData = {
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        email,
        role,
        agency_id: agencyId,
        is_active: isActive
      }
      
      await api.updateUser(userData)
      
      // Tenants zuweisen
      // API-Aufruf hier einkommentieren, wenn implementiert
      // await api.updateUserTenants(user.id, assignedTenants)
      
      setSuccess(true)
      toast.success("Benutzer erfolgreich aktualisiert")
      
      // Aktualisierte Daten laden
      await loadData()
      
      // Bearbeitungsmodus beenden
      setEditMode(false)
    } catch (err: any) {
      console.error("Fehler beim Aktualisieren des Benutzers:", err)
      setError(err?.message || "Fehler beim Aktualisieren des Benutzers")
      toast.error("Fehler beim Aktualisieren des Benutzers")
    } finally {
      setSaving(false)
    }
  }
  
  const handleDeleteUser = async () => {
    if (!user) return
    
    try {
      setSaving(true)
      
      await api.deleteUser(user.id)
      
      toast.success("Benutzer erfolgreich gelöscht")
      
      // Zur Benutzerübersicht zurückkehren
      router.push("/users")
    } catch (err: any) {
      console.error("Fehler beim Löschen des Benutzers:", err)
      toast.error("Fehler beim Löschen des Benutzers", {
        description: err?.message || "Ein unerwarteter Fehler ist aufgetreten."
      })
    } finally {
      setSaving(false)
    }
  }
  
  const handleTenantToggle = (tenantId: string) => {
    setAssignedTenants(prev =>
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    )
  }
  
  const handleResetPassword = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      
      // API-Aufruf hier einkommentieren, wenn implementiert
      // await api.resetUserPassword(user.id)
      
      toast.success("Passwort-Reset-E-Mail wurde gesendet");
    } catch (err: any) {
      console.error("Fehler beim Zurücksetzen des Passworts:", err);
      toast.error("Fehler beim Zurücksetzen des Passworts", {
        description: err?.message || "Ein unerwarteter Fehler ist aufgetreten."
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Benutzerrollen, die ein Agenturadmin zuweisen darf
  const availableRoles = isAgencyAdmin
    ? [UserRole.EDITOR, UserRole.VIEWER]
    : [UserRole.ADMIN, UserRole.AGENCY_ADMIN, UserRole.EDITOR, UserRole.VIEWER]
  
  // Agentur-Name für Anzeige finden
  const getUserAgencyName = () => {
    if (!user?.agency_id) return "Keine Agentur"
    const agency = agencies.find(a => a.id === user.agency_id)
    return agency ? agency.name : "Unbekannte Agentur"
  }
  
  // Benutzerrolle für Anzeige formatieren
  const formatUserRole = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN: return "Administrator"
      case UserRole.AGENCY_ADMIN: return "Agentur-Admin"
      case UserRole.EDITOR: return "Redakteur"
      case UserRole.VIEWER: return "Betrachter"
      default: return role
    }
  }
  
  // Wenn der Benutzer nicht berechtigt ist, den Benutzer anzusehen
  if (currentUser && !canViewUser) {
    return (
      <ProtectedLayout>
        <Head>
          <title>Zugriff verweigert | SMG Dialog</title>
        </Head>
        <AdminLayout>
          <div className="space-y-6">
            <Alert variant="destructive">
              <AlertDescription>
                Sie haben keine Berechtigung, um diesen Benutzer anzusehen.
              </AlertDescription>
            </Alert>
            <Button asChild>
              <Link href="/users">Zurück zur Benutzerübersicht</Link>
            </Button>
          </div>
        </AdminLayout>
      </ProtectedLayout>
    )
  }
  
  return (
    <ProtectedLayout>
      <Head>
        <title>{user ? `${user.first_name} ${user.last_name}` : "Benutzer"} | SMG Dialog</title>
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex flex-col space-y-2 md:flex-row md:justify-between md:space-y-0">
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link href="/users">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Zurück
                </Link>
              </Button>
              
              {loading ? (
                <Skeleton className="h-10 w-64" />
              ) : (
                <h1 className="text-3xl font-bold tracking-tight">
                  {user?.first_name} {user?.last_name}
                </h1>
              )}
            </div>
            
            <div className="flex space-x-2">
              {canEditUser && !editMode && (
                <Button 
                  onClick={() => setEditMode(true)}
                  disabled={loading}
                >
                  Bearbeiten
                </Button>
              )}
              
              {canDeleteUser && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="destructive"
                      disabled={loading || saving}
                    >
                      Löschen
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Benutzer löschen</AlertDialogTitle>
                      <AlertDialogDescription>
                        Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?
                        Diese Aktion kann nicht rückgängig gemacht werden.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteUser}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Löschen
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="tenants">Kunden</TabsTrigger>
              <TabsTrigger value="activity">Aktivität</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="space-y-6">
              {loading ? (
                <Card>
                  <CardHeader>
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-64" />
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle>Benutzerdaten</CardTitle>
                      <CardDescription>
                        Persönliche Informationen und Zugriffsberechtigungen
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {editMode ? (
                        <form className="space-y-6">
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Persönliche Informationen */}
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="firstName">Vorname</Label>
                                <Input
                                  id="firstName"
                                  value={firstName}
                                  onChange={(e) => setFirstName(e.target.value)}
                                  disabled={saving}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="lastName">Nachname</Label>
                                <Input
                                  id="lastName"
                                  value={lastName}
                                  onChange={(e) => setLastName(e.target.value)}
                                  disabled={saving}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="email">E-Mail-Adresse</Label>
                                <Input
                                  id="email"
                                  type="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  disabled={saving}
                                />
                              </div>
                            </div>
                            
                            {/* Zugriffsberechtigungen */}
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="role">Benutzerrolle</Label>
                                <Select 
                                  value={role} 
                                  onValueChange={(value) => setRole(value as UserRole)}
                                  disabled={saving}
                                >
                                  <SelectTrigger id="role">
                                    <SelectValue placeholder="Rolle auswählen" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {availableRoles.map((role) => (
                                      <SelectItem key={role} value={role}>
                                        {formatUserRole(role as UserRole)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {(role === UserRole.EDITOR || role === UserRole.VIEWER || 
                               (role === UserRole.AGENCY_ADMIN && isAdmin)) && (
                                <div className="space-y-2">
                                  <Label htmlFor="agency">Agentur</Label>
                                  <Select 
                                    value={agencyId || "none"} 
                                    onValueChange={(value) => setAgencyId(value === "none" ? undefined : value)}
                                    disabled={isAgencyAdmin || saving}
                                  >
                                    <SelectTrigger id="agency">
                                      <SelectValue placeholder="Agentur auswählen" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">Keine Agentur</SelectItem>
                                      {agencies.map((agency) => (
                                        <SelectItem key={agency.id} value={agency.id}>
                                          {agency.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                              
                              <div className="space-y-2 pt-4">
                                <div className="flex items-center space-x-2">
                                  <Checkbox 
                                    id="isActive" 
                                    checked={isActive}
                                    onCheckedChange={(checked) => setIsActive(!!checked)}
                                    disabled={saving}
                                  />
                                  <Label htmlFor="isActive" className="font-normal">
                                    Benutzer ist aktiv
                                  </Label>
                                </div>
                              </div>
                            </div>
                          </div>
                        </form>
                      ) : (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          {/* Persönliche Informationen */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Benutzername</h3>
                              <p className="flex items-center gap-2 mt-1">
                                <UserIcon className="h-4 w-4 text-muted-foreground" />
                                {user?.username}
                              </p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Vollständiger Name</h3>
                              <p className="mt-1">{user?.first_name} {user?.last_name}</p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">E-Mail-Adresse</h3>
                              <p className="flex items-center gap-2 mt-1">
                                <MailIcon className="h-4 w-4 text-muted-foreground" />
                                {user?.email}
                              </p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Erstellt am</h3>
                              <p className="mt-1">
                                {user?.created_at 
                                  ? new Date(user.created_at).toLocaleDateString('de-DE', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                    })
                                  : "Unbekannt"}
                              </p>
                            </div>
                          </div>
                          
                          {/* Zugriffsberechtigungen */}
                          <div className="space-y-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Benutzerrolle</h3>
                              <p className="mt-1">{formatUserRole(user?.role || UserRole.VIEWER)}</p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Agentur</h3>
                              <p className="flex items-center gap-2 mt-1">
                                <Building className="h-4 w-4 text-muted-foreground" />
                                {getUserAgencyName()}
                              </p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Kunden-Zugriff</h3>
                              <p className="flex items-center gap-2 mt-1">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                {assignedTenants.length} Kunden
                              </p>
                            </div>
                            
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
                              <div className="mt-1">
                                {user?.is_active ? (
                                  <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                    Aktiv
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                                    Inaktiv
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                    
                    {editMode && (
                      <CardFooter className="flex justify-between">
                        <div>
                          <Button 
                            variant="outline" 
                            onClick={handleResetPassword}
                            disabled={saving}
                          >
                            Passwort zurücksetzen
                          </Button>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            onClick={() => setEditMode(false)}
                            disabled={saving}
                          >
                            Abbrechen
                          </Button>
                          <Button 
                            onClick={handleSave}
                            disabled={saving}
                          >
                            {saving ? "Wird gespeichert..." : "Speichern"}
                          </Button>
                        </div>
                      </CardFooter>
                    )}
                  </Card>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="tenants" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kunden-Zugriff</CardTitle>
                  <CardDescription>
                    Kunden, auf die dieser Benutzer zugreifen kann
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {editMode ? (
                        <div className="space-y-2">
                          {tenants.length === 0 ? (
                            <p className="text-muted-foreground text-sm">Keine Kunden verfügbar</p>
                          ) : (
                            <div className="space-y-2 border rounded-md p-4 max-h-60 overflow-y-auto">
                              {tenants.map((tenant) => (
                                <div key={tenant.id} className="flex items-center space-x-2">
                                  <Checkbox 
                                    id={`tenant-${tenant.id}`} 
                                    checked={assignedTenants.includes(tenant.id)}
                                    onCheckedChange={() => handleTenantToggle(tenant.id)}
                                    disabled={saving}
                                  />
                                  <Label 
                                    htmlFor={`tenant-${tenant.id}`}
                                    className="font-normal"
                                  >
                                    {tenant.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          {assignedTenants.length === 0 ? (
                            <p className="text-muted-foreground text-sm">
                              Dieser Benutzer hat Zugriff auf keine Kunden
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-3">
                              {tenants
                                .filter(tenant => assignedTenants.includes(tenant.id))
                                .map(tenant => (
                                  <div 
                                    key={tenant.id}
                                    className="flex items-center space-x-2 rounded-md border p-3"
                                  >
                                    <div className="h-8 w-8 flex items-center justify-center rounded-full bg-primary/10">
                                      <Building className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                      <p className="font-medium">{tenant.name}</p>
                                    </div>
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
                
                {editMode && (
                  <CardFooter className="flex justify-end">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setEditMode(false)}
                        disabled={saving}
                      >
                        Abbrechen
                      </Button>
                      <Button 
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? "Wird gespeichert..." : "Speichern"}
                      </Button>
                    </div>
                  </CardFooter>
                )}
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Benutzeraktivität</CardTitle>
                  <CardDescription>
                    Letzte Aktivitäten und Änderungen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    Diese Funktion ist noch nicht verfügbar.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    </ProtectedLayout>
  )
} 