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
      toast({
        title: 'Fehler',
        description: 'Bitte geben Sie Benutzername und Passwort ein.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      resetError();
      
      await login(username, password);
      
      // Nach erfolgreicher Anmeldung zur Weiterleitungsseite navigieren
      router.push(redirect);
      
      toast({
        title: 'Erfolg',
        description: 'Sie wurden erfolgreich angemeldet.',
      });
    } catch (error) {
      // Der Fehler wird bereits im Auth-Kontext gesetzt
      console.error('Login-Fehler:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="username">Benutzername</Label>
        <Input
          id="username"
          type="text"
          placeholder="Benutzername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isSubmitting}
          autoComplete="username"
          required
        />
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Passwort</Label>
          <a
            href="/auth/reset-password"
            className="text-sm text-primary hover:underline"
          >
            Passwort vergessen?
          </a>
        </div>
        <Input
          id="password"
          type="password"
          placeholder="Passwort"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isSubmitting}
          autoComplete="current-password"
          required
        />
      </div>
      
      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? 'Anmelden...' : 'Anmelden'}
      </Button>
    </form>
  );
}; 