import { useState, useRef } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { toast } from "@/utils/toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProgressToast } from "@/hooks/use-progress-toast";
import { Loader2 } from "lucide-react";
import { useTenant } from "@/hooks/use-tenant";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Breadcrumb } from "@/components/breadcrumb";

export default function TenantXMLImportPage() {
  const router = useRouter();
  const { tenantId } = router.query;
  const { tenant, isLoading, error } = useTenant(tenantId as string);
  const { startProgress, updateProgress, finishProgress } = useProgressToast();

  const [file, setFile] = useState<File | null>(null);
  const [xmlType, setXmlType] = useState<string>("generic");
  const [url, setUrl] = useState<string>(
    "https://example.com/data.xml"
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isImportingFromUrl, setIsImportingFromUrl] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleXmlTypeChange = (value: string) => {
    setXmlType(value);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error("Bitte wählen Sie eine XML-Datei aus");
      return;
    }

    const toastId = startProgress("XML-Datei wird hochgeladen...");
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("tenant_id", tenantId as string);
      formData.append("xml_type", xmlType);

      const backendUrl = "http://localhost:8000/api/v1";
      const response = await fetch(`${backendUrl}/structured-data/import/xml`, {
        method: "POST",
        headers: {
          "X-API-Key": tenant?.api_key || "",
        },
        body: formData,
      });

      if (!response.ok) {
        let errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          errorText = errorJson.detail || errorText;
        } catch (e) {
          // Ignorieren, wenn kein JSON
        }
        throw new Error(`Fehler beim Upload: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      setImportResult(result);
      toast.success("XML-Datei erfolgreich importiert", {
        id: toastId,
      });

      // Eingabe-Feld zurücksetzen
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setFile(null);
    } catch (err: any) {
      console.error("Fehler beim Upload:", err);
      toast.error(`Fehler: ${err.message}`, {
        id: toastId,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportFromUrl = async () => {
    if (!url || !tenantId) {
      toast.error("URL und Tenant-ID sind erforderlich");
      return;
    }

    setIsImportingFromUrl(true);
    const toastId = startProgress("XML-Daten werden von URL importiert...");

    try {
      const backendUrl = "http://localhost:8000/api/v1";
      const response = await fetch(
        `${backendUrl}/structured-data/import/xml/url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": tenant?.api_key || "",
          },
          body: JSON.stringify({
            url,
            tenant_id: tenantId,
            xml_type: xmlType,
          }),
        }
      );

      if (!response.ok) {
        let errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          errorText = errorJson.detail || errorText;
        } catch (e) {
          // Ignorieren, wenn kein JSON
        }
        throw new Error(`Fehler beim Import von URL: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      setImportResult(result);
      toast.success("XML-Daten erfolgreich von URL importiert", {
        id: toastId,
      });
    } catch (err: any) {
      console.error("Fehler beim Import von URL:", err);
      toast.error(`Fehler: ${err.message}`, {
        id: toastId,
      });
    } finally {
      setIsImportingFromUrl(false);
    }
  };

  const handleFixImport = async () => {
    if (!tenantId) {
      toast.error("Tenant-ID ist erforderlich");
      return;
    }

    setIsImportingFromUrl(true);
    const toastId = startProgress("XML-Fix-Import wird im Hintergrund gestartet...");

    try {
      const backendUrl = "http://localhost:8000/api/v1";
      const response = await fetch(
        `${backendUrl}/structured-data/admin/fix-xml-import`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-Key": tenant?.api_key || "",
          },
          body: JSON.stringify({
            url,
            tenant_id: tenantId,
            xml_type: xmlType,
          }),
        }
      );

      if (!response.ok) {
        let errorText = await response.text();
        try {
          const errorJson = JSON.parse(errorText);
          errorText = errorJson.detail || errorText;
        } catch (e) {
          // Ignorieren, wenn kein JSON
        }
        throw new Error(`Fehler beim Starten des Fix-XML-Imports: ${response.status} ${errorText}`);
      }

      toast.success("Fix-XML-Import wurde im Hintergrund gestartet", {
        id: toastId,
      });
    } catch (err: any) {
      console.error("Fehler beim Starten des Fix-XML-Imports:", err);
      toast.error(`Fehler: ${err.message}`, {
        id: toastId,
      });
    } finally {
      setIsImportingFromUrl(false);
    }
  };

  // Fehlerbehandlung und Ladeanimation
  if (isLoading) {
    return (
      <AdminLayout>
        <Breadcrumb
          items={[
            { href: "/tenants", label: "Mandanten" },
            { href: `/tenants/${tenantId}`, label: "Details" },
            { href: `/tenants/${tenantId}/data-imports`, label: "Daten-Importe" },
            { href: `/tenants/${tenantId}/data-imports/xml`, label: "XML-Import", isCurrent: true },
          ]}
        />
        <div className="flex justify-center items-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <Breadcrumb
          items={[
            { href: "/tenants", label: "Mandanten" },
            { href: `/tenants/${tenantId}`, label: "Details" },
            { href: `/tenants/${tenantId}/data-imports`, label: "Daten-Importe" },
            { href: `/tenants/${tenantId}/data-imports/xml`, label: "XML-Import", isCurrent: true },
          ]}
        />
        <div className="rounded-md bg-destructive/15 p-4 mt-4">
          <div className="text-destructive">{error ? error.message : 'Ein unbekannter Fehler ist aufgetreten'}</div>
        </div>
      </AdminLayout>
    );
  }

  if (!tenant) {
    return (
      <AdminLayout>
        <Breadcrumb
          items={[
            { href: "/tenants", label: "Mandanten" },
            { href: `/tenants/${tenantId}`, label: "Details" },
            { href: `/tenants/${tenantId}/data-imports`, label: "Daten-Importe" },
            { href: `/tenants/${tenantId}/data-imports/xml`, label: "XML-Import", isCurrent: true },
          ]}
        />
        <div className="rounded-md bg-amber-100 p-4 mt-4">
          <div className="text-amber-800">Tenant nicht gefunden.</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Breadcrumb
        items={[
          { href: "/tenants", label: "Mandanten" },
          { href: `/tenants/${tenantId}`, label: "Details" },
          { href: `/tenants/${tenantId}/data-imports`, label: "Daten-Importe" },
          { href: `/tenants/${tenantId}/data-imports/xml`, label: "XML-Import", isCurrent: true },
        ]}
      />

      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">XML-Import für {tenant.name}</h1>
          <Button onClick={() => router.push(`/tenants/${tenantId}/data-imports`)}>
            Zurück zur Übersicht
          </Button>
        </div>

        <p className="text-muted-foreground">
          Importieren Sie strukturierte Daten aus einer XML-Datei. Der Import kann verschiedene
          XML-Formate verarbeiten und in die Wissensdatenbank integrieren.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>XML-Format auswählen</CardTitle>
              <CardDescription>
                Wählen Sie das Format der XML-Datei, um die optimale Verarbeitung zu gewährleisten
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="font-medium">XML-Typ:</div>
                  <Select value={xmlType} onValueChange={handleXmlTypeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="XML-Typ auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="generic">Generisches XML</SelectItem>
                      <SelectItem value="stadt">Stadt/Kommune</SelectItem>
                      <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>XML-Daten von URL importieren</CardTitle>
              <CardDescription>
                Importieren Sie Daten direkt von einer XML-URL
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="font-medium">URL:</div>
                  <Input
                    type="url"
                    value={url}
                    onChange={handleUrlChange}
                    placeholder="https://example.com/data.xml"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleImportFromUrl}
                disabled={isImportingFromUrl}
                className="w-full"
              >
                {isImportingFromUrl ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importiere...
                  </>
                ) : (
                  "Von URL importieren"
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>XML-Daten per Datei-Upload importieren</CardTitle>
              <CardDescription>
                Laden Sie eine XML-Datei von Ihrem Computer hoch
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="font-medium">XML-Datei:</div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".xml"
                    onChange={handleFileChange}
                  />
                  <p className="text-sm text-muted-foreground">
                    Nur XML-Dateien werden unterstützt.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importiere...
                  </>
                ) : (
                  "Datei hochladen und importieren"
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fix-XML-Import-Skript ausführen</CardTitle>
              <CardDescription>
                Führt das xml_import.py-Skript im Hintergrund aus
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Diese Funktion führt folgende Schritte aus:
                </p>
                <ul className="list-disc text-sm text-muted-foreground pl-5 space-y-1">
                  <li>Download der XML-Datei mit angepasstem User-Agent</li>
                  <li>Prüfung auf Änderungen (MD5-Checksumme)</li>
                  <li>Bei Änderungen: Löschen existierender Daten für den Tenant</li>
                  <li>Import aller neuen XML-Daten für den spezifizierten Tenant</li>
                </ul>
                <p className="text-sm text-muted-foreground mt-4">
                  Verwenden Sie diese Funktion, wenn der normale Import fehlschlägt oder wenn Sie spezielle Anforderungen haben.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={handleFixImport}
                disabled={isImportingFromUrl}
                className="w-full"
              >
                {isImportingFromUrl ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Wird ausgeführt...
                  </>
                ) : (
                  "Fix-Import-Skript ausführen"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {importResult && (
          <Card>
            <CardHeader>
              <CardTitle>Ergebnis des XML-Imports</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md">
                <pre className="whitespace-pre-wrap text-sm">
                  {JSON.stringify(importResult, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
