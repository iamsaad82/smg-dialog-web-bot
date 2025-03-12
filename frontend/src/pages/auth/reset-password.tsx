import React, { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/utils/toast';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await api.requestPasswordReset(email);
      
      setSuccess(true);
      toast.success('Eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts wurde gesendet.');
    } catch (error: any) {
      setError(error.message || 'Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten.');
      toast.error('Beim Zurücksetzen des Passworts ist ein Fehler aufgetreten.', {
        description: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleBackToLogin = () => {
    router.push('/auth/login');
  };
  
  return (
    <>
      <Head>
        <title>Passwort zurücksetzen | AI Bot Dashboard</title>
      </Head>
      
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">AI Bot Dashboard</h1>
          <p className="text-gray-600">Setzen Sie Ihr Passwort zurück</p>
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Passwort zurücksetzen</CardTitle>
            <CardDescription>
              Geben Sie Ihre E-Mail-Adresse ein, um einen Link zum Zurücksetzen Ihres Passworts zu erhalten.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Eine E-Mail mit Anweisungen zum Zurücksetzen Ihres Passworts wurde an {email} gesendet.
                    Bitte überprüfen Sie Ihren Posteingang und folgen Sie den Anweisungen in der E-Mail.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handleBackToLogin}
                  className="w-full"
                >
                  Zurück zur Anmeldung
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="E-Mail-Adresse"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="email"
                    required
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Wird gesendet...' : 'Link senden'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBackToLogin}
                    disabled={isSubmitting}
                  >
                    Zurück zur Anmeldung
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
} 