import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { LoginForm } from '@/components/auth/LoginForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  // Wenn der Benutzer bereits authentifiziert ist, zum Dashboard weiterleiten
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);
  
  // Wenn der Benutzer bereits authentifiziert ist, nichts anzeigen
  if (isLoading || isAuthenticated) {
    return null;
  }
  
  return (
    <>
      <Head>
        <title>Anmelden | SMG Dialog</title>
      </Head>
      
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">SMG Dialog</h1>
          <p className="text-gray-600">Melden Sie sich an, um fortzufahren</p>
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Anmelden</CardTitle>
            <CardDescription>
              Geben Sie Ihre Anmeldedaten ein, um auf das Dashboard zuzugreifen.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
} 