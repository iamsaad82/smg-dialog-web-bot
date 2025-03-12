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
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/AuthContext"

export default function CreateUserPage() {
  const router = useRouter()
  const { user: currentUser } = useAuth()
  const [agencies, setAgencies] = useState<any[]>([])
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Formularfelder
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [role, setRole] = useState<UserRole>(UserRole.VIEWER)
  const [agencyId, setAgencyId] = useState<string | null>(
    currentUser?.role === UserRole.AGENCY_ADMIN ? currentUser.agency_id : null
  )
  const [isActive, setIsActive] = useState(true)
  const [selectedTenants, setSelectedTenants] = useState<string[]>([])
  const [sendWelcomeEmail, setSendWelcomeEmail] = useState(true)

  // Agentur-Admins können nur Benutzer für ihre eigene Agentur erstellen
  const isAgencyAdmin = currentUser?.role === UserRole.AGENCY_ADMIN
  const isAdmin = currentUser?.role === UserRole.ADMIN

  // Prüfen, ob der Benutzer berechtigt ist, Benutzer zu erstellen
  const canCreateUsers = isAdmin || isAgencyAdmin

  useEffect(() => {
    // Wenn der Benutzer nicht berechtigt ist, zur Benutzerübersicht umleiten
    if (currentUser && !canCreateUsers) {
      toast.error("Sie haben keine Berechtigung, um Benutzer zu erstellen")
      router.push("/users")
      return
    }

    // Agenturen und Tenants laden
    const loadData = async () => {
      try {
        // Tenants laden
        try {
          // Die API-Methode wurde noch nicht implementiert, daher Fallback zu Dummy-Daten
          // const tenantsData = await api.getAllTenants()
          // setTenants(tenantsData)
          console.log("Dummy-Tenants werden geladen")
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
          // Die API-Methode wurde noch nicht implementiert, daher Fallback zu Dummy-Daten
          // const agenciesData = await api.getAllAgencies()
          // setAgencies(agenciesData)
          console.log("Dummy-Agenturen werden geladen")
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
        setError(err?.message || "Fehler beim Laden der Daten")
      }
    }

    loadData()
  }, [currentUser, canCreateUsers, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validierung
    if (password !== confirmPassword) {
      setError("Die Passwörter stimmen nicht überein")
      return
    }

    if (password.length < 8) {
      setError("Das Passwort muss mindestens 8 Zeichen lang sein")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const userData = {
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
        agency_id: agencyId || undefined, // Null als undefined senden, da API null nicht akzeptiert
        assigned_tenant_ids: selectedTenants,
        is_active: isActive,
        is_temporary_password: sendWelcomeEmail
      }

      // Benutzer erstellen
      await api.createUser(userData)

      setSuccess(true)
      toast.success("Benutzer erfolgreich erstellt")

      // Nach kurzem Delay zur Benutzerübersicht zurückkehren
      setTimeout(() => {
        router.push("/users")
      }, 2000)
    } catch (err: any) {
      console.error("Fehler beim Erstellen des Benutzers:", err)
      setError(err?.message || "Fehler beim Erstellen des Benutzers")
      toast.error("Fehler beim Erstellen des Benutzers", {
        description: err?.message || "Es gab ein Problem beim Erstellen des Benutzers."
      })
    } finally {
      setLoading(false)
    }
  }

  // Benutzerrollen, die ein Agenturadmin erstellen darf
  const availableRoles = isAgencyAdmin
    ? [UserRole.EDITOR, UserRole.VIEWER]
    : [UserRole.ADMIN, UserRole.AGENCY_ADMIN, UserRole.EDITOR, UserRole.VIEWER]

  const handleTenantToggle = (tenantId: string) => {
    setSelectedTenants(prev =>
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    )
  }

  return (
    <ProtectedLayout>
      <Head>
        <title>Benutzer erstellen | SMG Dialog</title>
      </Head>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center">
            <Button variant="ghost" asChild className="mr-2">
              <Link href="/users">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Link>
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Neuen Benutzer erstellen</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Benutzerdaten</CardTitle>
              <CardDescription>
                Geben Sie die Informationen für den neuen Benutzer ein
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>
                      Benutzer wurde erfolgreich erstellt. Sie werden zur Benutzerübersicht weitergeleitet...
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Persönliche Informationen */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Vorname *</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                        disabled={loading || success}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nachname *</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                        disabled={loading || success}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail-Adresse *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading || success}
                      />
                    </div>
                  </div>

                  {/* Zugangsdaten */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="username">Benutzername *</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={loading || success}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Passwort *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading || success}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Passwort wiederholen *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading || success}
                      />
                    </div>
                  </div>
                </div>

                {/* Zugriffsoptionen */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Zugriff & Berechtigungen</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="role">Benutzerrolle *</Label>
                      <Select 
                        value={role} 
                        onValueChange={(value) => setRole(value as UserRole)}
                        disabled={loading || success}
                      >
                        <SelectTrigger id="role">
                          <SelectValue placeholder="Rolle auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableRoles.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role === UserRole.ADMIN && "Administrator"}
                              {role === UserRole.AGENCY_ADMIN && "Agentur-Admin"}
                              {role === UserRole.EDITOR && "Redakteur"}
                              {role === UserRole.VIEWER && "Betrachter"}
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
                          onValueChange={(value) => setAgencyId(value === "none" ? null : value)}
                          disabled={isAgencyAdmin || loading || success}
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
                  </div>

                  {/* Tenant-Zugang */}
                  <div className="space-y-2">
                    <Label>Zugriff auf Kunden</Label>
                    <div className="mt-2 border rounded-lg p-4 max-h-60 overflow-y-auto">
                      {tenants.length === 0 ? (
                        <p className="text-muted-foreground text-sm">Keine Kunden verfügbar</p>
                      ) : (
                        <div className="space-y-2">
                          {tenants.map((tenant) => (
                            <div key={tenant.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`tenant-${tenant.id}`} 
                                checked={selectedTenants.includes(tenant.id)}
                                onCheckedChange={() => handleTenantToggle(tenant.id)}
                                disabled={loading || success}
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
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="isActive" 
                      checked={isActive}
                      onCheckedChange={(checked) => setIsActive(!!checked)}
                      disabled={loading || success}
                    />
                    <Label htmlFor="isActive" className="font-normal">
                      Benutzer aktivieren
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="sendWelcomeEmail" 
                      checked={sendWelcomeEmail}
                      onCheckedChange={(checked) => setSendWelcomeEmail(!!checked)}
                      disabled={loading || success}
                    />
                    <Label htmlFor="sendWelcomeEmail" className="font-normal">
                      Willkommens-E-Mail mit Zugangsdaten senden
                    </Label>
                  </div>
                </div>

                <CardFooter className="flex gap-2 px-0">
                  <Button 
                    variant="secondary" 
                    type="button" 
                    onClick={() => router.push("/users")}
                    disabled={loading || success}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit" disabled={loading || success}>
                    {loading ? "Wird erstellt..." : "Benutzer erstellen"}
                  </Button>
                </CardFooter>
              </form>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedLayout>
  )
} 