import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/utils/toast';

export const LoginForm: React.FC = () => {
  const { login, error, resetError } = useAuth();
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Redirect-Parameter aus der URL extrahieren
  const redirect = router.query.redirect as string || '/dashboard';
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error('Bitte geben Sie Benutzername und Passwort ein.');
      return;
    }
    
    try {
      setIsSubmitting(true);
      resetError();
      
      // Login durchführen
      await login(username, password);
      
      // Bei erfolgreicher Anmeldung zur Zielseite weiterleiten
      // Da ein Login-Fehler eine Exception auslöst, kommen wir nur hier an, wenn alles erfolgreich war
      router.push(redirect);
    } catch (err) {
      console.error('Login-Fehler:', err);
      toast.error('Ein unerwarteter Fehler ist aufgetreten.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="space-y-6 w-full max-w-md mx-auto p-6 bg-card border rounded-lg shadow-sm">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Anmelden</h1>
        <p className="text-muted-foreground">Geben Sie Ihre Anmeldedaten ein</p>
      </div>
      
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Benutzername</Label>
          <Input 
            id="username"
            placeholder="Benutzername" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Passwort</Label>
            <a 
              href="/auth/reset-password/" 
              className="text-sm text-primary hover:underline"
            >
              Passwort vergessen?
            </a>
          </div>
          
          <Input 
            id="password"
            type="password"
            placeholder="••••••••" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Anmeldung läuft...' : 'Anmelden'}
        </Button>
      </form>
    </div>
  );
}; 