import React, { useState } from 'react';
import { Save, Loader2 } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";

// Schema für die Einstellungen
const generalSettingsSchema = z.object({
  systemName: z.string().min(2, { message: "Der Systemname muss mindestens 2 Zeichen haben." }),
  adminEmail: z.string().email({ message: "Bitte geben Sie eine gültige E-Mail-Adresse ein." }),
  defaultLanguage: z.string(),
  logRetentionDays: z.coerce.number().min(1, { message: "Die Log-Aufbewahrungszeit muss mindestens 1 Tag betragen." }).max(365, { message: "Die Log-Aufbewahrungszeit darf maximal 365 Tage betragen." })
});

const llmSettingsSchema = z.object({
  openaiApiKey: z.string().min(1, { message: "Der OpenAI API-Schlüssel darf nicht leer sein." }),
  mistralApiKey: z.string().optional(),
  defaultModel: z.string(),
  temperature: z.coerce.number().min(0, { message: "Die Temperatur muss mindestens 0 sein." }).max(1, { message: "Die Temperatur darf maximal 1 sein." }),
  maxTokens: z.coerce.number().min(100, { message: "Die maximale Tokenanzahl muss mindestens 100 sein." })
});

const vectorDbSettingsSchema = z.object({
  weaviateUrl: z.string().url({ message: "Bitte geben Sie eine gültige URL ein." }),
  weaviateApiKey: z.string().min(1, { message: "Der Weaviate API-Schlüssel darf nicht leer sein." }),
  embeddingModel: z.string(),
  chunkSize: z.coerce.number().min(100, { message: "Die Chunk-Größe muss mindestens 100 sein." }).max(10000, { message: "Die Chunk-Größe darf maximal 10000 sein." }),
  chunkOverlap: z.coerce.number().min(0, { message: "Der Chunk-Überlapp muss mindestens 0 sein." })
});

const notificationSettingsSchema = z.object({
  enableErrorNotifications: z.boolean(),
  errorRecipients: z.string().optional(),
  enableUsageReports: z.boolean(),
  reportFrequency: z.string(),
  slackWebhookUrl: z.string().url({ message: "Bitte geben Sie eine gültige URL ein." }).optional().or(z.literal(''))
});

// Typdefinitionen für die verschiedenen Einstellungsformulare
type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;
type LlmSettingsValues = z.infer<typeof llmSettingsSchema>;
type VectorDbSettingsValues = z.infer<typeof vectorDbSettingsSchema>;
type NotificationSettingsValues = z.infer<typeof notificationSettingsSchema>;

export function SettingsForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulare für verschiedene Einstellungs-Tabs
  const generalForm = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      systemName: "SMG-Dialog-Web-Bot",
      adminEmail: "admin@example.com",
      defaultLanguage: "de",
      logRetentionDays: 30
    }
  });

  const llmForm = useForm<LlmSettingsValues>({
    resolver: zodResolver(llmSettingsSchema),
    defaultValues: {
      openaiApiKey: "sk-...",
      mistralApiKey: "",
      defaultModel: "gpt-4",
      temperature: 0.7,
      maxTokens: 2000
    }
  });

  const vectorDbForm = useForm<VectorDbSettingsValues>({
    resolver: zodResolver(vectorDbSettingsSchema),
    defaultValues: {
      weaviateUrl: "https://weaviate.example.com",
      weaviateApiKey: "wvt-...",
      embeddingModel: "text-embedding-3-small",
      chunkSize: 1000,
      chunkOverlap: 200
    }
  });

  const notificationForm = useForm<NotificationSettingsValues>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: {
      enableErrorNotifications: true,
      errorRecipients: "alerts@example.com",
      enableUsageReports: true,
      reportFrequency: "weekly",
      slackWebhookUrl: ""
    }
  });

  // Speichern der Einstellungen
  const handleSaveSettings = async (formData: any, formType: string) => {
    setIsSubmitting(true);
    
    try {
      // Hier sollten die echten Daten an die API geschickt werden
      // Im Echtsystem würde hier eine API-Anfrage stehen
      // z.B. apiClient.saveSettings(formType, formData)
      
      // Simuliere eine API-Anfrage
      console.log(`Speichere ${formType}-Einstellungen:`, formData);
      
      // Simuliere eine API-Verzögerung
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Erfolgsbenachrichtigung
      toast.success("Einstellungen gespeichert", {
        description: `Die ${formType}-Einstellungen wurden erfolgreich gespeichert.`
      });
    } catch (error) {
      console.error(`Fehler beim Speichern der ${formType}-Einstellungen:`, error);
      
      // Fehlerbenachrichtigung
      toast.error("Fehler beim Speichern", {
        description: `Die ${formType}-Einstellungen konnten nicht gespeichert werden.`
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>System-Einstellungen</CardTitle>
        <CardDescription>
          Konfigurieren Sie die Systemeinstellungen für Ihr KI-Bot-System
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid grid-cols-4 mb-8">
            <TabsTrigger value="general">Allgemein</TabsTrigger>
            <TabsTrigger value="llm">LLM-Einstellungen</TabsTrigger>
            <TabsTrigger value="vectordb">Vector-DB</TabsTrigger>
            <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
          </TabsList>
          
          {/* Allgemeine Einstellungen */}
          <TabsContent value="general">
            <Form {...generalForm}>
              <form onSubmit={generalForm.handleSubmit((data) => handleSaveSettings(data, 'Allgemeine'))} className="space-y-6">
                <FormField
                  control={generalForm.control}
                  name="systemName"
                  render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: string } }) => (
                    <FormItem>
                      <FormLabel>Systemname</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        Name des KI-Bot-Systems in der Benutzeroberfläche
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={generalForm.control}
                  name="adminEmail"
                  render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: string } }) => (
                    <FormItem>
                      <FormLabel>Administrator-E-Mail</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormDescription>
                        E-Mail-Adresse des Systemadministrators
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={generalForm.control}
                  name="defaultLanguage"
                  render={({ field }: { field: { onChange: (value: string) => void; value: string } }) => (
                    <FormItem>
                      <FormLabel>Standardsprache</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sprache auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="en">Englisch</SelectItem>
                          <SelectItem value="fr">Französisch</SelectItem>
                          <SelectItem value="es">Spanisch</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Standardsprache für das System und Bot-Antworten
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={generalForm.control}
                  name="logRetentionDays"
                  render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: number } }) => (
                    <FormItem>
                      <FormLabel>Log-Aufbewahrungszeit (Tage)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormDescription>
                        Anzahl der Tage, für die System-Logs aufbewahrt werden
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Speichern
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* LLM-Einstellungen */}
          <TabsContent value="llm">
            <Form {...llmForm}>
              <form onSubmit={llmForm.handleSubmit((data) => handleSaveSettings(data, 'LLM'))} className="space-y-6">
                <FormField
                  control={llmForm.control}
                  name="openaiApiKey"
                  render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: string } }) => (
                    <FormItem>
                      <FormLabel>OpenAI API-Schlüssel</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>
                        API-Schlüssel für OpenAI-Dienste (GPT-4, Embeddings)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={llmForm.control}
                  name="mistralApiKey"
                  render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: string } }) => (
                    <FormItem>
                      <FormLabel>Mistral API-Schlüssel (optional)</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>
                        API-Schlüssel für Mistral-Dienste (optional)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={llmForm.control}
                  name="defaultModel"
                  render={({ field }: { field: { onChange: (value: string) => void; value: string } }) => (
                    <FormItem>
                      <FormLabel>Standard-Modell</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Modell auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                          <SelectItem value="mistral-large">Mistral Large</SelectItem>
                          <SelectItem value="mistral-medium">Mistral Medium</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Standard-LLM für Bot-Antworten
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={llmForm.control}
                    name="temperature"
                    render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: number } }) => (
                      <FormItem>
                        <FormLabel>Temperatur</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" min="0" max="1" {...field} />
                        </FormControl>
                        <FormDescription>
                          Kreativität der Antworten (0-1)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={llmForm.control}
                    name="maxTokens"
                    render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: number } }) => (
                      <FormItem>
                        <FormLabel>Max. Tokens</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Maximale Länge der Antworten
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Speichern
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* Vector-DB-Einstellungen */}
          <TabsContent value="vectordb">
            <Form {...vectorDbForm}>
              <form onSubmit={vectorDbForm.handleSubmit((data) => handleSaveSettings(data, 'Vector-DB'))} className="space-y-6">
                <FormField
                  control={vectorDbForm.control}
                  name="weaviateUrl"
                  render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: string } }) => (
                    <FormItem>
                      <FormLabel>Weaviate-URL</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        URL des Weaviate-Servers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={vectorDbForm.control}
                  name="weaviateApiKey"
                  render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: string } }) => (
                    <FormItem>
                      <FormLabel>Weaviate API-Schlüssel</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormDescription>
                        API-Schlüssel für den Weaviate-Zugriff
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={vectorDbForm.control}
                  name="embeddingModel"
                  render={({ field }: { field: { onChange: (value: string) => void; value: string } }) => (
                    <FormItem>
                      <FormLabel>Embedding-Modell</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Modell auswählen" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                          <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                          <SelectItem value="text-embedding-ada-002">text-embedding-ada-002 (Legacy)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Modell für Text-Embeddings
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={vectorDbForm.control}
                    name="chunkSize"
                    render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: number } }) => (
                      <FormItem>
                        <FormLabel>Chunk-Größe</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Größe der Text-Chunks für Embeddings
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={vectorDbForm.control}
                    name="chunkOverlap"
                    render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: number } }) => (
                      <FormItem>
                        <FormLabel>Chunk-Überlapp</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>
                          Überlappung zwischen Text-Chunks
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Speichern
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          {/* Benachrichtigungs-Einstellungen */}
          <TabsContent value="notifications">
            <Form {...notificationForm}>
              <form onSubmit={notificationForm.handleSubmit((data) => handleSaveSettings(data, 'Benachrichtigungs'))} className="space-y-6">
                <FormField
                  control={notificationForm.control}
                  name="enableErrorNotifications"
                  render={({ field }: { field: { checked: boolean; onChange: (checked: boolean) => void } }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Fehlerbenachrichtigungen</FormLabel>
                        <FormDescription>
                          E-Mail-Benachrichtigungen bei kritischen Systemfehlern
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.checked}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {notificationForm.watch("enableErrorNotifications") && (
                  <FormField
                    control={notificationForm.control}
                    name="errorRecipients"
                    render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: string } }) => (
                      <FormItem>
                        <FormLabel>E-Mail-Empfänger für Fehler</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="admin@example.com, alerts@example.com" />
                        </FormControl>
                        <FormDescription>
                          Kommagetrennte Liste von E-Mail-Adressen
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={notificationForm.control}
                  name="enableUsageReports"
                  render={({ field }: { field: { checked: boolean; onChange: (checked: boolean) => void } }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Nutzungsberichte</FormLabel>
                        <FormDescription>
                          Regelmäßige Berichte über Systemnutzung und Leistung
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.checked}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                {notificationForm.watch("enableUsageReports") && (
                  <FormField
                    control={notificationForm.control}
                    name="reportFrequency"
                    render={({ field }: { field: { onChange: (value: string) => void; value: string } }) => (
                      <FormItem>
                        <FormLabel>Berichtsintervall</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Häufigkeit auswählen" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="daily">Täglich</SelectItem>
                            <SelectItem value="weekly">Wöchentlich</SelectItem>
                            <SelectItem value="monthly">Monatlich</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Häufigkeit der Nutzungsberichte
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={notificationForm.control}
                  name="slackWebhookUrl"
                  render={({ field }: { field: React.InputHTMLAttributes<HTMLInputElement> & { value: string } }) => (
                    <FormItem>
                      <FormLabel>Slack Webhook URL (optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://hooks.slack.com/services/..." />
                      </FormControl>
                      <FormDescription>
                        Webhook-URL für Slack-Benachrichtigungen
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Speichern...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Speichern
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 