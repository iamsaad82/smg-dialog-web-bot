import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
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
import {
  Database,
  Globe,
  ArrowRight,
  FileSpreadsheet,
  FileJson,
  BookOpen,
  Info,
  Loader2,
  FileText,
} from "lucide-react";
import { toast } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tenant } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";
import { API_BASE_URL } from '@/api/core';
import { Breadcrumb } from "@/components/breadcrumb";
import { useTenant } from "@/hooks/use-tenant";

export default function TenantDataImportsPage() {
  const router = useRouter();
  const { tenantId } = router.query;
  const { tenant, isLoading, error } = useTenant(tenantId as string);

  if (isLoading) {
    return (
      <AdminLayout>
        <Breadcrumb
          items={[
            { href: "/tenants", label: "Mandanten" },
            { href: `/tenants/${tenantId}`, label: "Details" },
            { href: `/tenants/${tenantId}/data-imports`, label: "Daten-Importe", isCurrent: true },
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
            { href: `/tenants/${tenantId}/data-imports`, label: "Daten-Importe", isCurrent: true },
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
            { href: `/tenants/${tenantId}/data-imports`, label: "Daten-Importe", isCurrent: true },
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
          { href: `/tenants/${tenantId}/data-imports`, label: "Daten-Importe", isCurrent: true },
        ]}
      />

      <div className="flex flex-col gap-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Daten-Importe für {tenant.name}</h1>
          <Button onClick={() => router.push(`/tenants/${tenantId}`)}>
            Zurück zur Übersicht
          </Button>
        </div>

        <p className="text-muted-foreground">
          Importieren Sie Daten für den Bot, um seine Wissensbasis zu erweitern. Es stehen verschiedene Import-Möglichkeiten zur Verfügung.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                CSV-Import
              </CardTitle>
              <CardDescription>
                Importieren Sie Daten aus CSV-Dateien
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Laden Sie Fragen und Antworten aus einer CSV-Datei hoch, um sie in die Wissensdatenbank zu integrieren.
                Unterstützt strukturierte Daten mit Titeln, Inhalten und Metadaten.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push(`/tenants/${tenantId}/data-imports/csv`)}
              >
                CSV-Import starten
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                XML-Import
              </CardTitle>
              <CardDescription>
                Importieren Sie strukturierte Daten aus XML-Dateien
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Laden Sie strukturierte Daten aus XML-Dateien hoch oder importieren Sie sie direkt von einer URL.
                Unterstützt verschiedene XML-Formate und wandelt sie in strukturierte Daten um.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="outline" 
                onClick={() => router.push(`/tenants/${tenantId}/data-imports/xml`)}
              >
                XML-Import starten
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Website Crawler
              </CardTitle>
              <CardDescription>
                Crawlen Sie Websites, um Inhalte zu importieren
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Extrahieren Sie automatisch Inhalte von Webseiten durch Crawling.
                Geben Sie eine Start-URL an und lassen Sie den Bot die Inhalte analysieren und importieren.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => router.push(`/tenants/${tenantId}/data-imports/crawler`)}
              >
                Crawler starten
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
} 