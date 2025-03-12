import React from 'react';
import Head from 'next/head';
import { ArrowLeft } from 'lucide-react';
import { AdminLayout } from "@/components/layouts/admin-layout";
import { LogsViewer } from '@/components/system/logs/LogsViewer';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function LogsPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>System-Logs | KI-Bot Admin Dashboard</title>
        <meta name="description" content="System-Logs des KI-Bot-Systems" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <AdminLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">System-Logs</h1>
              <p className="text-muted-foreground">
                Überwachen Sie System-Ereignisse und beheben Sie Fehler
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zum Dashboard
              </Link>
            </Button>
          </div>

          <LogsViewer />
        </div>
      </AdminLayout>
    </div>
  );
} 