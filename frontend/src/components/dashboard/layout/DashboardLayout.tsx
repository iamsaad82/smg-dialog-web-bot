import React, { ReactNode } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface DashboardLayoutProps {
  children?: ReactNode;
  title: string;
  description?: string;
  defaultTab?: string;
  tabs?: { id: string; label: string }[];
  tabContent?: { [key: string]: ReactNode };
}

export function DashboardLayout({
  children,
  title,
  description,
  defaultTab = "overview",
  tabs,
  tabContent
}: DashboardLayoutProps) {
  return (
    <div className="space-y-8">
      {/* Dashboard-Titel */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">
            {description}
          </p>
        )}
      </div>

      {/* Tab-Navigation, wenn Tabs vorhanden sind */}
      {tabs && tabContent ? (
        <Tabs defaultValue={defaultTab} className="space-y-4">
          <TabsList>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {/* Tab-Inhalte */}
          {Object.entries(tabContent).map(([id, content]) => (
            <TabsContent key={id} value={id} className="space-y-4">
              {content}
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        // Wenn keine Tabs, einfach den Inhalt anzeigen
        children
      )}
    </div>
  );
} 