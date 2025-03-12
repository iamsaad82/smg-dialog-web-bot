import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PlusCircle, Edit, Trash2 } from "lucide-react";
import { SectionHeading } from '../shared/SectionHeading';
import { ComponentDefinition } from '../shared/types';

interface DefinitionListProps {
  definitions: ComponentDefinition[];
  isAdmin: boolean;
  onEdit: (definition: ComponentDefinition) => void;
  onDelete: (definition: ComponentDefinition) => void;
  onAdd: () => void;
  isLoading: boolean;
}

/**
 * Listet alle verfügbaren UI-Komponenten-Definitionen auf
 */
export const DefinitionList: React.FC<DefinitionListProps> = ({
  definitions,
  isAdmin,
  onEdit,
  onDelete,
  onAdd,
  isLoading
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Verfügbare UI-Komponenten</CardTitle>
        <CardDescription>
          Diese Komponenten können in den Bot-Antworten verwendet werden
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SectionHeading 
          title="Komponenten-Definitionen"
          description="Verwalten Sie die verschiedenen UI-Komponenten, die der Bot verwenden kann"
          rightElement={
            isAdmin && (
              <Button
                size="sm"
                onClick={onAdd}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Neue Komponente
              </Button>
            )
          }
        />
        
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            <p>Komponenten werden geladen...</p>
          </div>
        ) : definitions.length === 0 ? (
          <Alert className="my-4">
            <AlertTitle>Keine Komponenten definiert</AlertTitle>
            <AlertDescription>
              Es wurden noch keine UI-Komponenten definiert.
              {isAdmin && ' Klicken Sie auf "Neue Komponente", um Ihre erste Komponente zu erstellen.'}
            </AlertDescription>
          </Alert>
        ) : (
          <Table className="mt-2">
            <TableCaption>Liste aller verfügbaren UI-Komponenten</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Beschreibung</TableHead>
                <TableHead className="w-[150px]">Aktionen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {definitions.map((definition) => (
                <TableRow key={definition.id}>
                  <TableCell className="font-medium">{definition.name}</TableCell>
                  <TableCell>{definition.description || '-'}</TableCell>
                  <TableCell>
                    {isAdmin ? (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(definition)}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Bearbeiten
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(definition)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Löschen
                        </Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">Nur Administrator</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}; 