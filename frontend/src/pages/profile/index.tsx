import React, { useState } from 'react';
import Head from 'next/head';
import { useAuth } from '@/contexts/AuthContext';
import { ProtectedLayout } from '@/components/layouts/ProtectedLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/utils/toast';
import { api } from '@/api';
import { UserRole } from '@/types/api';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword && newPassword !== confirmPassword) {
      setUpdateError('Die Passwörter stimmen nicht überein.');
      return;
    }
    
    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      if (user) {
        await api.updateUser({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          email,
          password: newPassword || undefined
        });
        
        toast.success('Ihr Profil wurde erfolgreich aktualisiert.');
        
        // Formulardaten zurücksetzen
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error: any) {
      console.error('Fehler beim Aktualisieren des Profils:', error);
      setUpdateError(error.message || 'Beim Aktualisieren des Profils ist ein Fehler aufgetreten.');
      
      toast.error('Beim Aktualisieren des Profils ist ein Fehler aufgetreten.', {
        description: error.message
      });
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sie wurden erfolgreich abgemeldet.');
    } catch (error: any) {
      console.error('Logout-Fehler:', error);
      toast.error('Beim Abmelden ist ein Fehler aufgetreten.', {
        description: error.message
      });
    }
  };
  
  if (!user) {
    return null;
  }
  
  return (
    <ProtectedLayout>
      <Head>
        <title>Mein Profil | AI Bot Dashboard</title>
      </Head>
      
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Mein Profil</h1>
        
        <div className="grid gap-8 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Profilinformationen</CardTitle>
              <CardDescription>
                Aktualisieren Sie Ihre persönlichen Informationen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {updateError && (
                  <Alert variant="destructive">
                    <AlertDescription>{updateError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    disabled={isUpdating}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={isUpdating}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isUpdating}
                    required
                  />
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium mb-2">Passwort ändern</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Lassen Sie die Felder leer, wenn Sie Ihr Passwort nicht ändern möchten.
                  </p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Aktuelles Passwort</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isUpdating}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Neues Passwort</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isUpdating}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isUpdating}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Wird aktualisiert...' : 'Profil aktualisieren'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Kontoinformationen</CardTitle>
                <CardDescription>
                  Informationen zu Ihrem Benutzerkonto
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Benutzername</p>
                  <p className="text-lg">{user.username}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Rolle</p>
                  <p className="text-lg">
                    {user.role === UserRole.ADMIN ? 'Administrator' : 
                     user.role === UserRole.AGENCY_ADMIN ? 'Agentur-Administrator' : 
                     user.role === UserRole.EDITOR ? 'Editor' : 'Betrachter'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Account-Status</p>
                  <p className="text-lg">
                    {user.is_active ? 
                      <span className="text-green-600">Aktiv</span> : 
                      <span className="text-red-600">Inaktiv</span>
                    }
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Zugewiesene Tenants</p>
                  <p className="text-lg">
                    {user.assigned_tenant_ids?.length || 0} Tenants
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Konto-Aktionen</CardTitle>
                <CardDescription>
                  Aktionen für Ihr Benutzerkonto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  Abmelden
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
} 