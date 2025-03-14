import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { AdminLayout } from "@/components/layouts/admin-layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  UploadCloud,
  Globe,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  ArrowLeft,
} from "lucide-react";
import { toast } from "@/utils/toast";
import { Tenant } from "@/types/api";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function TenantBrandenburgImportPage() {
  const router = useRouter();
  const tenantId = router.query.id as string;
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [xmlUrl, setXmlUrl] = useState<string>(
    "https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml"
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [fetchingTenant, setFetchingTenant] = useState<boolean>(true);

  // Tenant-Daten laden
  useEffect(() => {
    const fetchTenant = async () => {
      if (!tenantId) return;
      
      try {
        setFetchingTenant(true);
        const backendUrl = "http://localhost:8000"; // Backend-URL für direkte Anfragen
        console.log("Anfrage an API wird gesendet:", `${backendUrl}/api/v1/tenants/${tenantId}/details`);
        
        // Admin-API-Key direkt verwenden (nur für Entwicklung)
        const adminApiKey = "admin-secret-key-12345";
        
        // Zuerst versuchen, den Tenant über den /details-Endpunkt zu laden
        let response = await fetch(`${backendUrl}/api/v1/tenants/${tenantId}/details`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': adminApiKey, // Admin-API-Key zur Authentifizierung
          },
          credentials: 'include'
        });
        
        console.log("API-Antwort Status:", response.status);
        
        // Wenn der /details-Endpunkt fehlschlägt, den normalen Tenant-Endpunkt versuchen
        if (response.status === 500) {
          console.log("Fallback: Verwende normalen Tenant-Endpunkt");
          response = await fetch(`${backendUrl}/api/v1/tenants/${tenantId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-API-Key': adminApiKey, // Admin-API-Key zur Authentifizierung
            },
            credentials: 'include'
          });
          console.log("Fallback API-Antwort Status:", response.status);
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("API-Fehlerdetails:", errorText);
          throw new Error(`Fehler beim Laden der Tenant-Informationen: ${response.status} ${response.status === 500 ? "Internal Server Error" : errorText}`);
        }
        
        const data = await response.json();
        console.log("Geladene Tenant-Daten:", data);
        setTenant(data);
        
        // Prüfen, ob Brandenburg-Integration aktiviert ist
        if (!data.is_brandenburg) {
          setError("Dieser Tenant hat die Brandenburg-Integration nicht aktiviert");
        }
      } catch (err) {
        console.error("Fehler beim Laden des Tenants:", err);
        setError(`${err}`);
        toast.error("Fehler beim Laden des Tenants", {
          description: `${err}`,
        });
      } finally {
        setFetchingTenant(false);
      }
    };

    fetchTenant();
  }, [tenantId]);

  // Datei-Upload-Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setXmlFile(e.target.files[0]);
    }
  };

  // Import von Datei - speziell für diesen Tenant
  const handleFileUpload = async () => {
    if (!xmlFile) {
      toast.error("Bitte wählen Sie eine XML-Datei aus");
      return;
    }

    if (!tenant?.is_brandenburg) {
      toast.error(
        "Dieser Tenant hat die Brandenburg-Integration nicht aktiviert",
        {
          description:
            "Bitte aktivieren Sie die Brandenburg-Integration in den Tenant-Einstellungen.",
        }
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setImportResults(null);

    try {
      const formData = new FormData();
      formData.append("file", xmlFile);
      formData.append("tenant_id", tenantId); // Nur für diesen Tenant importieren

      // Admin-API-Key für die Authentifizierung verwenden
      const adminApiKey = "admin-secret-key-12345";

      const backendUrl = "http://localhost:8000"; // Backend-URL für direkte Anfragen
      const response = await fetch(`${backendUrl}/api/v1/structured-data/import/brandenburg`, {
        method: "POST",
        headers: {
          'X-API-Key': adminApiKey, // Admin-API-Key zur Authentifizierung hinzufügen
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API-Fehlerdetails:", errorText);
        throw new Error(
          `Import fehlgeschlagen: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      setImportResults(result);
      toast.success("Import erfolgreich", {
        description: "Die Daten wurden erfolgreich importiert.",
      });
    } catch (err) {
      console.error("Fehler beim Import:", err);
      setError(`${err}`);
      toast.error("Import fehlgeschlagen", {
        description: `${err}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Import von URL - speziell für diesen Tenant
  const handleUrlImport = async () => {
    if (!xmlUrl) {
      toast.error("Bitte geben Sie eine gültige URL ein");
      return;
    }

    if (!tenant?.is_brandenburg) {
      toast.error(
        "Dieser Tenant hat die Brandenburg-Integration nicht aktiviert",
        {
          description:
            "Bitte aktivieren Sie die Brandenburg-Integration in den Tenant-Einstellungen.",
        }
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setImportResults(null);

    try {
      // Admin-API-Key für die Authentifizierung verwenden
      const adminApiKey = "admin-secret-key-12345";
      
      const backendUrl = "http://localhost:8000"; // Backend-URL für direkte Anfragen
      const response = await fetch(
        `${backendUrl}/api/v1/structured-data/import/brandenburg/url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            'X-API-Key': adminApiKey, // Admin-API-Key zur Authentifizierung hinzufügen
          },
          body: JSON.stringify({ 
            url: xmlUrl,
            tenant_id: tenantId // Nur für diesen Tenant importieren
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API-Fehlerdetails:", errorText);
        throw new Error(
          `Import fehlgeschlagen: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      setImportResults(result);
      toast.success("Import erfolgreich", {
        description: "Die Daten wurden erfolgreich importiert.",
      });
    } catch (err) {
      console.error("Fehler beim Import von URL:", err);
      setError(`${err}`);
      toast.error("Import fehlgeschlagen", {
        description: `${err}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Skeleton während Tenant-Daten geladen werden
  if (fetchingTenant) {
    return (
      <AdminLayout
        breadcrumbItems={[
          { href: "/", label: "Dashboard" },
          { href: "/tenants", label: "Tenants" },
          { href: `/tenants/${tenantId}`, label: "Tenant" },
          { href: `/tenants/${tenantId}/data-imports`, label: "Datenimporte" },
          { href: `/tenants/${tenantId}/data-imports/brandenburg`, label: "Brandenburg-Import", isCurrent: true },
        ]}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </AdminLayout>
    );
  }

  // Fehlermeldung, wenn Tenant nicht gefunden oder Brandenburg-Integration nicht aktiviert
  if (error || !tenant) {
    return (
      <AdminLayout
        breadcrumbItems={[
          { href: "/", label: "Dashboard" },
          { href: "/tenants", label: "Tenants" },
          { href: `/tenants/${tenantId}`, label: "Tenant" },
          { href: `/tenants/${tenantId}/data-imports`, label: "Datenimporte" },
          { href: `/tenants/${tenantId}/data-imports/brandenburg`, label: "Brandenburg-Import", isCurrent: true },
        ]}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Brandenburg-Import</h1>
              <p className="text-muted-foreground">
                Importieren Sie strukturierte Daten aus einer Brandenburg-XML-Datei
              </p>
            </div>
            <Link href={`/tenants/${tenantId}/data-imports`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zur Übersicht
              </Button>
            </Link>
          </div>
          
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Fehler</AlertTitle>
            <AlertDescription>
              {error || "Dieser Tenant hat die Brandenburg-Integration nicht aktiviert. Bitte aktivieren Sie diese Funktion in den Tenant-Einstellungen."}
            </AlertDescription>
          </Alert>

          <div className="flex justify-center mt-6">
            <Link href={`/tenants/${tenantId}/settings`}>
              <Button>
                Zu den Tenant-Einstellungen
              </Button>
            </Link>
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Hauptinhalt, wenn Tenant geladen und Brandenburg-Integration aktiviert ist
  return (
    <AdminLayout
      breadcrumbItems={[
        { href: "/", label: "Dashboard" },
        { href: "/tenants", label: "Tenants" },
        { href: `/tenants/${tenantId}`, label: tenant.name },
        { href: `/tenants/${tenantId}/data-imports`, label: "Datenimporte" },
        { href: `/tenants/${tenantId}/data-imports/brandenburg`, label: "Brandenburg-Import", isCurrent: true },
      ]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Brandenburg-Import für {tenant.name}</h1>
            <p className="text-muted-foreground">
              Importieren Sie strukturierte Daten aus einer Brandenburg-XML-Datei
            </p>
          </div>
          <Link href={`/tenants/${tenantId}/data-imports`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zur Übersicht
            </Button>
          </Link>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Information</AlertTitle>
          <AlertDescription>
            Die Daten werden für den Tenant <strong>{tenant.name}</strong> importiert.
            Dieser Import aktualisiert Schulen, Ämter und Veranstaltungen aus der Brandenburg-XML-Datei.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="url" className="space-y-4">
          <TabsList>
            <TabsTrigger value="url">Import per URL</TabsTrigger>
            <TabsTrigger value="file">Import per Datei-Upload</TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Brandenburg-Daten von URL importieren</CardTitle>
                <CardDescription>
                  Importieren Sie Daten direkt von der Brandenburg-Website oder einer
                  anderen URL
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="url"
                      placeholder="https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml"
                      value={xmlUrl}
                      onChange={(e) => setXmlUrl(e.target.value)}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleUrlImport}
                      disabled={isLoading || !xmlUrl}
                      className="min-w-[120px]"
                    >
                      {isLoading ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Globe className="mr-2 h-4 w-4" />
                      )}
                      Importieren
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Die Standard-URL verweist auf die aktuelle XML-Datei der Stadt Brandenburg.
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Brandenburg-Daten per Datei-Upload importieren</CardTitle>
                <CardDescription>
                  Laden Sie eine Brandenburg-XML-Datei von Ihrem Computer hoch
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept=".xml"
                      onChange={handleFileChange}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleFileUpload}
                      disabled={isLoading || !xmlFile}
                      className="min-w-[120px]"
                    >
                      {isLoading ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UploadCloud className="mr-2 h-4 w-4" />
                      )}
                      Hochladen
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-muted-foreground">
                Unterstützte Dateiformate: XML
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Fehler beim Import</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {importResults && (
          <Card>
            <CardHeader>
              <CardTitle>Import-Ergebnisse</CardTitle>
              <CardDescription>
                Die folgenden Daten wurden erfolgreich importiert:
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(importResults.results || {}).map(
                  ([tenantName, result]: [string, any]) => (
                    <div
                      key={tenantName}
                      className="border rounded-lg p-4"
                    >
                      <h3 className="text-lg font-medium mb-2">{tenantName}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center">
                          <span className="w-40">Schulen:</span>
                          <span className="font-medium">{result.schools}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-40">Ämter:</span>
                          <span className="font-medium">{result.offices}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-40">Veranstaltungen:</span>
                          <span className="font-medium">{result.events}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="w-40">Gesamt:</span>
                          <span className="font-medium">
                            {result.schools + result.offices + result.events}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                <span>Import erfolgreich abgeschlossen</span>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
} 