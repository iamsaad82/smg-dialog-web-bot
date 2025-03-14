import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { toast } from "@/utils/toast";
import { Tenant } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";

export default function BrandenburgImportPage() {
  const { user } = useAuth();
  const [xmlFile, setXmlFile] = useState<File | null>(null);
  const [xmlUrl, setXmlUrl] = useState<string>(
    "https://www.stadt-brandenburg.de/_/a/chatbot/daten.xml"
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [importResults, setImportResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [brandenburgTenants, setBrandenburgTenants] = useState<Tenant[]>([]);

  // Prüfen, ob es Brandenburg-Tenants gibt
  useEffect(() => {
    const fetchBrandenburgTenants = async () => {
      try {
        const response = await fetch("/api/v1/tenants");
        if (!response.ok) {
          throw new Error("Fehler beim Laden der Tenants");
        }
        const data = await response.json();
        const brandenburgTenants = data.filter((tenant: Tenant) => tenant.is_brandenburg);
        setBrandenburgTenants(brandenburgTenants);
      } catch (err) {
        console.error("Fehler beim Laden der Brandenburg-Tenants:", err);
        setError("Fehler beim Laden der Brandenburg-Tenants");
      }
    };

    fetchBrandenburgTenants();
  }, []);

  // Datei-Upload-Handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setXmlFile(e.target.files[0]);
    }
  };

  // Import von Datei
  const handleFileUpload = async () => {
    if (!xmlFile) {
      toast.error("Bitte wählen Sie eine XML-Datei aus");
      return;
    }

    if (!brandenburgTenants || brandenburgTenants.length === 0) {
      toast.error(
        "Es sind keine Tenants mit aktivierter Brandenburg-Integration vorhanden",
        {
          description:
            "Bitte aktivieren Sie die Brandenburg-Integration für mindestens einen Tenant.",
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

      const response = await fetch("/api/v1/structured-data/import/brandenburg", {
        method: "POST",
        body: formData,
        headers: {
          // Keine Content-Type-Header bei FormData
        },
      });

      if (!response.ok) {
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

  // Import von URL
  const handleUrlImport = async () => {
    if (!xmlUrl) {
      toast.error("Bitte geben Sie eine gültige URL ein");
      return;
    }

    if (!brandenburgTenants || brandenburgTenants.length === 0) {
      toast.error(
        "Es sind keine Tenants mit aktivierter Brandenburg-Integration vorhanden",
        {
          description:
            "Bitte aktivieren Sie die Brandenburg-Integration für mindestens einen Tenant.",
        }
      );
      return;
    }

    setIsLoading(true);
    setError(null);
    setImportResults(null);

    try {
      const response = await fetch(
        "/api/v1/structured-data/import/brandenburg/url",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url: xmlUrl }),
        }
      );

      if (!response.ok) {
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

  return (
    <AdminLayout
      breadcrumbItems={[
        { href: "/", label: "Dashboard" },
        { href: "/structured-data", label: "Strukturierte Daten" },
        {
          href: "/structured-data/brandenburg-import",
          label: "Brandenburg-Import",
          isCurrent: true,
        },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Brandenburg-Import</h1>
          <p className="text-muted-foreground">
            Importieren Sie strukturierte Daten aus einer Brandenburg-XML-Datei
          </p>
        </div>

        {brandenburgTenants.length === 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Keine Brandenburg-Tenants gefunden</AlertTitle>
            <AlertDescription>
              Es wurden keine Tenants mit aktivierter Brandenburg-Integration gefunden.
              Bitte aktivieren Sie zuerst die Brandenburg-Integration für mindestens einen Tenant
              in den Tenant-Einstellungen.
            </AlertDescription>
          </Alert>
        )}

        {brandenburgTenants.length > 0 && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Brandenburg-Tenants gefunden</AlertTitle>
            <AlertDescription>
              Die folgenden Tenants haben die Brandenburg-Integration aktiviert und
              werden beim Import mit Daten versorgt:
              <ul className="mt-2 list-disc list-inside">
                {brandenburgTenants.map((tenant) => (
                  <li key={tenant.id}>{tenant.name}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

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