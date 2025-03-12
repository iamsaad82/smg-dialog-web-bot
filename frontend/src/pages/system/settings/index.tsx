import React from 'react';
import Head from 'next/head';
import { ArrowLeft } from 'lucide-react';
import { AdminLayout } from "@/components/layouts/admin-layout";
import { SettingsForm } from '@/components/system/settings/SettingsForm';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>System-Einstellungen | KI-Bot Admin Dashboard</title>
        <meta name="description" content="System-Einstellungen des KI-Bot-Systems" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System-Einstellungen</h1>
              <p className="text-muted-foreground">
                Konfigurieren Sie die Einstellungen für das KI-Bot-System
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zum Dashboard
              </Link>
            </Button>
          </div>

          <SettingsForm />
        </div>
      </AdminLayout>
    </div>
  );
} 