import { useEffect } from "react";
import { useRouter } from "next/router";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Info, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function StructuredDataRedirectPage() {
  const router = useRouter();

  // Automatische Weiterleitung zur Tenant-Auswahl
  useEffect(() => {
    // Kurze Verzögerung für die Anzeige der Meldung
    const redirectTimer = setTimeout(() => {
      router.push("/tenants");
    }, 5000);
    
    return () => clearTimeout(redirectTimer);
  }, [router]);

  return (
    <AdminLayout
      breadcrumbItems={[
        { href: "/", label: "Dashboard" },
        {
          href: "/structured-data",
          label: "Strukturierte Daten",
          isCurrent: true,
        },
      ]}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Strukturierte Daten</h1>
          <p className="text-muted-foreground">
            Diese Seite wurde in den tenant-spezifischen Bereich verschoben
          </p>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Neue Struktur</AlertTitle>
          <AlertDescription className="space-y-4">
            <p>
              Die Verwaltung strukturierter Daten (wie der Brandenburg-Import) wurde in den 
              tenant-spezifischen Bereich verschoben. Bitte wählen Sie zuerst einen Tenant aus, 
              und navigieren Sie dann zum Menüpunkt "Datenimporte".
            </p>
            <p>
              Sie werden in 5 Sekunden automatisch zur Tenant-Auswahl weitergeleitet.
            </p>
            <div className="flex justify-center mt-4">
              <Link href="/tenants">
                <Button size="lg">
                  Jetzt zu den Tenants
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
} 