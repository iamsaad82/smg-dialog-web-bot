import React from "react";
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
  FileUp,
  Globe,
  RefreshCw,
  School,
  Building,
  Calendar,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

export default function StructuredDataPage() {
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
            Verwaltung von strukturierten Daten für Chat-Antworten
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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
                Verwalten und importieren Sie strukturierte Daten aus Brandenburg
              </p>
            </CardContent>
            <CardFooter>
              <Link href="/structured-data/brandenburg-import" className="w-full">
                <Button className="w-full">
                  Zum Brandenburg-Import
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Schuldaten
              </CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Schulen</div>
              <p className="text-xs text-muted-foreground">
                Verwalten und durchsuchen Sie Schuldaten
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Funktion kommt bald
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Ämterdaten
              </CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Ämter & Behörden</div>
              <p className="text-xs text-muted-foreground">
                Verwalten und durchsuchen Sie Daten zu Ämtern und Behörden
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Funktion kommt bald
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Veranstaltungsdaten
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Veranstaltungen</div>
              <p className="text-xs text-muted-foreground">
                Verwalten und durchsuchen Sie Veranstaltungsdaten
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Funktion kommt bald
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Automatischer Import
              </CardTitle>
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Automatisierung</div>
              <p className="text-xs text-muted-foreground">
                Planen Sie regelmäßige Datenimporte
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Funktion kommt bald
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Datenbank
              </CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Datenbankstatus</div>
              <p className="text-xs text-muted-foreground">
                Prüfen Sie den Status der strukturierten Daten
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" disabled>
                Funktion kommt bald
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
} 