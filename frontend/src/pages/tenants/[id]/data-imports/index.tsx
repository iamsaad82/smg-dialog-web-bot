import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import { toast } from "@/utils/toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tenant } from "@/types/api";
import { Skeleton } from "@/components/ui/skeleton";

export default function TenantDataImportsPage() {
  const router = useRouter();
  const tenantId = router.query.id as string;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTenant = async () => {
      if (!tenantId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/v1/tenants/${tenantId}`);
        if (!response.ok) {
          throw new Error("Fehler beim Laden der Tenant-Informationen");
        }
        
        const data = await response.json();
        setTenant(data);
      } catch (err) {
        console.error("Fehler beim Laden des Tenants:", err);
        setError(`Fehler beim Laden des Tenants: ${err}`);
        toast.error("Fehler beim Laden des Tenants", {
          description: `${err}`,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTenant();
  }, [tenantId]);

  if (isLoading) {
    return (
      <AdminLayout
        breadcrumbItems={[
          { href: "/", label: "Dashboard" },
          { href: "/tenants", label: "Tenants" },
          { href: `/tenants/${tenantId}`, label: "Tenant" },
          { href: `/tenants/${tenantId}/data-imports`, label: "Datenimporte", isCurrent: true },
        ]}
      >
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !tenant) {
    return (
      <AdminLayout
        breadcrumbItems={[
          { href: "/", label: "Dashboard" },
          { href: "/tenants", label: "Tenants" },
          { href: `/tenants/${tenantId}`, label: "Tenant" },
          { href: `/tenants/${tenantId}/data-imports`, label: "Datenimporte", isCurrent: true },
        ]}
      >
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertTitle>Fehler</AlertTitle>
          <AlertDescription>
            {error || "Es ist ein unbekannter Fehler aufgetreten."}
          </AlertDescription>
        </Alert>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      breadcrumbItems={[
        { href: "/", label: "Dashboard" },
        { href: "/tenants", label: "Tenants" },
        { href: `/tenants/${tenantId}`, label: tenant.name || "Tenant" },
        { href: `/tenants/${tenantId}/data-imports`, label: "Datenimporte", isCurrent: true },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Datenimporte für {tenant.name}</h1>
          <p className="text-muted-foreground">
            Importieren und verwalten Sie externe Daten für diesen Tenant
          </p>
        </div>

        {!tenant.is_brandenburg && tenant.name && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Information</AlertTitle>
            <AlertDescription>
              Für diesen Tenant sind derzeit keine spezifischen Datenimporte konfiguriert.
              Bei Bedarf können spezielle Import-Optionen für {tenant.name} aktiviert werden.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenant.is_brandenburg && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Brandenburg-Integration
                </CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Brandenburg XML</div>
                <p className="text-xs text-muted-foreground">
                  Importieren Sie strukturierte Daten aus Brandenburg-XML
                </p>
              </CardContent>
              <CardFooter>
                <Link href={`/tenants/${tenantId}/data-imports/brandenburg`} className="w-full">
                  <Button className="w-full">
                    Zum Brandenburg-Import
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                CSV-Import
              </CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">CSV-Daten</div>
              <p className="text-xs text-muted-foreground">
                Import strukturierter Daten aus CSV-Dateien
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Funktion kommt bald
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                JSON-Import
              </CardTitle>
              <FileJson className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">JSON-Daten</div>
              <p className="text-xs text-muted-foreground">
                Import strukturierter Daten aus JSON-Dateien
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Funktion kommt bald
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Hilfe & Dokumentation
              </CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Dokumentation</div>
              <p className="text-xs text-muted-foreground">
                Hilfe zu Datenimporten und Formatierungsrichtlinien
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Zur Dokumentation
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
} 