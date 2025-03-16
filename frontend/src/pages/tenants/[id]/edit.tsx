import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { apiClient } from '../../../utils/api';
import { Tenant, TenantUpdate } from '../../../types/api';
import { AdminLayout } from "@/components/layouts/admin-layout";
import { Button } from "@/components/ui/button";

// Renderer-Typen für Dropdown
const RENDERER_TYPES = [
  { value: 'default', label: 'Standard-Renderer' },
  { value: 'brandenburg', label: 'Brandenburg-Renderer' }
];

export default function EditTenant() {
  const router = useRouter();
  const { id } = router.query;
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [formData, setFormData] = useState<TenantUpdate>({
    name: '',
    description: '',
    contact_email: '',
    bot_name: '',
    bot_welcome_message: '',
    primary_color: '#4f46e5',
    secondary_color: '#ffffff',
    use_mistral: false,
    renderer_type: 'default',
    config: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    const loadTenant = async () => {
      try {
        setLoading(true);
        
        const allTenants = await apiClient.getAllTenants();
        const currentTenant = allTenants.find(t => t.id === id);
        
        if (currentTenant) {
          apiClient.setApiKey(currentTenant.api_key);
          const tenantData = await apiClient.getTenant(id);
          setTenant(tenantData);
          
          setFormData({
            name: tenantData.name,
            description: tenantData.description || '',
            contact_email: tenantData.contact_email || '',
            bot_name: tenantData.bot_name,
            bot_welcome_message: tenantData.bot_welcome_message,
            primary_color: tenantData.primary_color,
            secondary_color: tenantData.secondary_color,
            use_mistral: tenantData.use_mistral,
            custom_instructions: tenantData.custom_instructions || '',
            logo_url: tenantData.logo_url || '',
            renderer_type: tenantData.renderer_type || 'default',
            config: tenantData.config || {}
          });
          
          setError(null);
        } else {
          setError('Tenant nicht gefunden');
        }
      } catch (err) {
        console.error('Fehler beim Laden des Tenants:', err);
        setError('Fehler beim Laden der Kundendaten');
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, [id]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id) return;
    
    try {
      setSaving(true);
      
      console.log("Edit page - Original formData:", JSON.stringify(formData));
      
      // Stelle sicher, dass boolesche Werte korrekt gesetzt sind
      const sanitizedFormData = {
        ...formData,
      };
      
      // Explizit testen und konvertieren für use_mistral
      if (formData.hasOwnProperty('use_mistral')) {
        const boolValue = formData.use_mistral === true;
        console.log(`Converting use_mistral from ${formData.use_mistral} (${typeof formData.use_mistral}) to ${boolValue}`);
        sanitizedFormData.use_mistral = boolValue;
      }
      
      // XML-URL-Konfiguration
      const xmlUrl = (document.getElementById('xml_url') as HTMLInputElement)?.value;
      if (xmlUrl) {
        sanitizedFormData.config = {
          ...sanitizedFormData.config,
          xml_url: xmlUrl
        };
      }
      
      console.log("Edit page - Sending sanitized data:", JSON.stringify(sanitizedFormData));
      const savedTenant = await apiClient.updateTenant(id as string, sanitizedFormData);
      console.log("Edit page - API response:", JSON.stringify(savedTenant));
      
      setSavedMessage('Änderungen erfolgreich gespeichert');
      
      // Nach dem Speichern den Tenant neu laden, um sicherzustellen, dass die aktuellen Werte angezeigt werden
      if (tenant) {
        const updatedTenant = await apiClient.getTenant(id as string);
        console.log("Edit page - Fetched updated tenant:", JSON.stringify(updatedTenant));
        console.log("renderer_type in fetched data:", updatedTenant.renderer_type);
        console.log("renderer_type type in fetched data:", typeof updatedTenant.renderer_type);
        
        setTenant(updatedTenant);
        
        // Aktualisiere auch formData mit den neuen Werten
        setFormData({
          name: updatedTenant.name || "",
          description: updatedTenant.description || "",
          contact_email: updatedTenant.contact_email || "",
          bot_name: updatedTenant.bot_name || "",
          bot_welcome_message: updatedTenant.bot_welcome_message || "",
          primary_color: updatedTenant.primary_color || "#4f46e5",
          secondary_color: updatedTenant.secondary_color || "#ffffff",
          logo_url: updatedTenant.logo_url || "",
          use_mistral: updatedTenant.use_mistral === true,
          custom_instructions: updatedTenant.custom_instructions || "",
          renderer_type: updatedTenant.renderer_type || 'default',
          config: updatedTenant.config || {}
        });
      }
      
      setTimeout(() => setSavedMessage(null), 3000);
    } catch (err) {
      console.error('Fehler beim Speichern:', err);
      setError('Fehler beim Speichern der Änderungen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Head>
        <title>{tenant ? `${tenant.name} bearbeiten` : 'Kunde bearbeiten'}</title>
        <meta name="description" content="Kunde bearbeiten" />
      </Head>

      <AdminLayout>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {error ? (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          ) : loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {savedMessage && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
                  <span className="block sm:inline">{savedMessage}</span>
                </div>
              )}

              {/* Allgemeine Informationen */}
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Allgemeine Informationen</h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name*</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Beschreibung</label>
                      <input
                        type="text"
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="contact_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Kontakt-E-Mail</label>
                      <input
                        type="email"
                        id="contact_email"
                        name="contact_email"
                        value={formData.contact_email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Bot-Konfiguration */}
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Bot-Konfiguration</h2>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="bot_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Bot-Name*</label>
                      <input
                        type="text"
                        id="bot_name"
                        name="bot_name"
                        value={formData.bot_name}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="bot_welcome_message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Willkommensnachricht*</label>
                      <input
                        type="text"
                        id="bot_welcome_message"
                        name="bot_welcome_message"
                        value={formData.bot_welcome_message}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="primary_color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Primärfarbe*</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <input
                          type="color"
                          id="primary_color"
                          name="primary_color"
                          value={formData.primary_color}
                          onChange={handleInputChange}
                          className="h-8 w-8 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={formData.primary_color}
                          onChange={handleInputChange}
                          name="primary_color"
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="secondary_color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sekundärfarbe*</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <input
                          type="color"
                          id="secondary_color"
                          name="secondary_color"
                          value={formData.secondary_color}
                          onChange={handleInputChange}
                          className="h-8 w-8 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={formData.secondary_color}
                          onChange={handleInputChange}
                          name="secondary_color"
                          className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Logo-URL</label>
                      <input
                        type="url"
                        id="logo_url"
                        name="logo_url"
                        value={formData.logo_url || ''}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="use_mistral"
                        name="use_mistral"
                        checked={formData.use_mistral}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                      <label htmlFor="use_mistral" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                        Mistral anstelle von OpenAI verwenden
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spezifische Anweisungen */}
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Spezifische Anweisungen</h2>
                  <div>
                    <label htmlFor="custom_instructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Benutzerdefinierte Anweisungen</label>
                    <textarea
                      id="custom_instructions"
                      name="custom_instructions"
                      value={formData.custom_instructions || ''}
                      onChange={handleInputChange}
                      rows={6}
                      placeholder="Geben Sie hier spezifische Anweisungen für das Verhalten des Bots ein..."
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    ></textarea>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Diese Anweisungen werden dem Bot übergeben, um sein Verhalten und seine Antworten zu steuern. Sie können beispielsweise einen bestimmten Tonfall, Einschränkungen oder spezifische Informationen vorgeben.
                    </p>
                  </div>
                </div>
              </div>

              {/* XML-Import-Konfiguration */}
              <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg p-6 mb-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">
                  XML-Import-Konfiguration
                </h3>
                
                <div className="mb-4">
                  <label htmlFor="renderer_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Renderer-Typ
                  </label>
                  <select
                    id="renderer_type"
                    name="renderer_type"
                    value={formData.renderer_type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  >
                    {RENDERER_TYPES.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Bestimmt den spezifischen Renderer für diesen Tenant und den XML-Import-Typ.
                  </p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="xml_url" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    XML-URL
                  </label>
                  <input
                    type="url"
                    id="xml_url"
                    name="xml_url"
                    defaultValue={formData.config?.xml_url || ''}
                    className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    placeholder="https://beispiel.de/daten.xml"
                  />
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    URL der XML-Datei, die für diesen Tenant importiert werden soll.
                  </p>
                </div>
              </div>

              {/* Aktionen */}
              <div className="flex justify-end space-x-3">
                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'Wird gespeichert...' : 'Speichern'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </AdminLayout>
    </div>
  );
} 