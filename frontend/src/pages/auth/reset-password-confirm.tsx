import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { api } from '@/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/utils/toast';

export default function ResetPasswordConfirmPage() {
  const router = useRouter();
  const { token } = router.query;
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  
  useEffect(() => {
    // Prüfen, ob ein Token in der URL vorhanden ist
    if (router.isReady && !token) {
      setError('Ungültiger oder fehlender Reset-Token. Bitte fordern Sie einen neuen Link an.');
    }
  }, [router.isReady, token]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Ungültiger oder fehlender Reset-Token. Bitte fordern Sie einen neuen Link an.');
      return;
    }
    
    if (!newPassword) {
      setError('Bitte geben Sie ein neues Passwort ein.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }
    
    if (newPassword.length < 8) {
      setError('Das Passwort muss mindestens 8 Zeichen lang sein.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      await api.confirmPasswordReset(token as string, newPassword);
      
      setSuccess(true);
      toast.success('Ihr Passwort wurde erfolgreich zurückgesetzt.');
      
      // Nach dem erfolgreichen Zurücksetzen automatisch zum Login weiterleiten
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
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
          <p className="text-gray-600">Neues Passwort festlegen</p>
        </div>
        
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Passwort zurücksetzen</CardTitle>
            <CardDescription>
              Geben Sie Ihr neues Passwort ein.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Ihr Passwort wurde erfolgreich zurückgesetzt. Sie werden in Kürze zur Anmeldeseite weitergeleitet.
                  </AlertDescription>
                </Alert>
                <Button
                  onClick={handleBackToLogin}
                  className="w-full"
                >
                  Zur Anmeldung
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
                  <Label htmlFor="newPassword">Neues Passwort</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Neues Passwort"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Passwort bestätigen"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting}
                    required
                  />
                </div>
                
                <div className="flex flex-col space-y-2">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !token}
                  >
                    {isSubmitting ? 'Wird zurückgesetzt...' : 'Passwort zurücksetzen'}
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