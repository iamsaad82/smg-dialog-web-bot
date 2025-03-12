import React, { useState } from 'react';
import { Document, IndexStatus } from '@/types/api';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Temporär die Checkbox-Komponente auskommentieren, bis das Import-Problem gelöst ist
// import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown, Eye, FileEdit, RotateCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Temporäre Checkbox-Komponente als Ersatz
const SimpleCheckbox = ({ 
  checked, 
  onCheckedChange, 
  ...props 
}: { 
  checked: boolean; 
  onCheckedChange: (checked: boolean) => void;
  [key: string]: any;
}) => {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange(e.target.checked)}
      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
      {...props}
    />
  );
};

// Typ für den Dokumentenstatus
interface DocumentStatusMap {
  [key: string]: {
    status: IndexStatus;
    lastUpdated?: string;
    error?: string;
  };
}

// Props für die Tabelle
interface DocumentTableProps {
  documents: Document[];
  selectedDocuments: string[];
  documentStatus: DocumentStatusMap;
  isLoading: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onView: (document: Document) => void;
  onEdit: (document: Document) => void;
  onDelete: (documentId: string) => void;
  onReindex: (documentId: string) => void;
}

// DocumentTable-Komponente
export default function DocumentTable({
  documents,
  selectedDocuments,
  documentStatus,
  isLoading,
  onSelect,
  onSelectAll,
  onView,
  onEdit,
  onDelete,
  onReindex
}: DocumentTableProps) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Funktion zum Umschalten der Sortierung
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sortierte Dokumente
  const sortedDocuments = React.useMemo(() => {
    if (!sortField) return documents;

    return [...documents].sort((a, b) => {
      let aValue = (a as any)[sortField];
      let bValue = (b as any)[sortField];

      // Spezielle Behandlung für created_at
      if (sortField === 'created_at') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documents, sortField, sortDirection]);

  const allSelected = documents.length > 0 && selectedDocuments.length === documents.length;

  // Status-Badge für die Dokumente
  function StatusBadge({ docId }: { docId: string }) {
    const status = documentStatus[docId];
    
    if (!status) {
      return <Badge variant="outline">Unbekannt</Badge>;
    }
    
    if (status.status === IndexStatus.INDIZIERT) {
      return <Badge variant="outline" className="bg-green-100 text-green-800">Indiziert</Badge>;
    }
    
    if (status.status === IndexStatus.FEHLER) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="destructive">Fehler</Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>{status.error}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    return <Badge variant="outline" className="bg-amber-100 text-amber-800">Nicht indiziert</Badge>;
  }

  // Render-Funktion
  return (
    <Table className="border">
      <TableHeader>
        <TableRow>
          <TableHead className="w-[40px]">
              <SimpleCheckbox 
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(checked)}
                aria-label="Alle auswählen"
              />
          </TableHead>
          <TableHead>
            <div className="flex items-center space-x-1 cursor-pointer" onClick={() => toggleSort('title')}>
              <span>Dokument</span>
              <ArrowUpDown className={cn(
                "h-4 w-4", 
                sortField === 'title' ? 'opacity-100' : 'opacity-40',
                sortField === 'title' && sortDirection === 'desc' ? 'rotate-180' : 'rotate-0'
              )} />
            </div>
          </TableHead>
          <TableHead>
            <div className="flex items-center space-x-1 cursor-pointer" onClick={() => toggleSort('source')}>
              <span>Quelle</span>
              <ArrowUpDown className={cn(
                "h-4 w-4", 
                sortField === 'source' ? 'opacity-100' : 'opacity-40',
                sortField === 'source' && sortDirection === 'desc' ? 'rotate-180' : 'rotate-0'
              )} />
            </div>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead>
            <div className="flex items-center space-x-1 cursor-pointer" onClick={() => toggleSort('created_at')}>
              <span>Erstellt am</span>
              <ArrowUpDown className={cn(
                "h-4 w-4", 
                sortField === 'created_at' ? 'opacity-100' : 'opacity-40',
                sortField === 'created_at' && sortDirection === 'desc' ? 'rotate-180' : 'rotate-0'
              )} />
            </div>
          </TableHead>
          <TableHead className="w-[150px] text-right">Aktionen</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {isLoading ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                <p className="text-sm text-muted-foreground">Lade Dokumente...</p>
              </div>
            </TableCell>
          </TableRow>
        ) : sortedDocuments.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-8">
              <p className="text-muted-foreground">Keine Dokumente gefunden</p>
            </TableCell>
          </TableRow>
        ) : (
          sortedDocuments.map(doc => (
            <TableRow key={doc.id}>
              <TableCell>
                  <SimpleCheckbox 
                    checked={selectedDocuments.includes(doc.id)}
                    onCheckedChange={(checked) => onSelect(doc.id, checked)}
                    aria-label={`${doc.title} auswählen`}
                  />
              </TableCell>
              <TableCell className="font-medium">{doc.title}</TableCell>
              <TableCell>{doc.source || "Unbekannt"}</TableCell>
              <TableCell>
                <StatusBadge docId={doc.id} />
              </TableCell>
              <TableCell>
                {new Date(doc.created_at).toLocaleDateString('de-DE', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex space-x-1 justify-end">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onView(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Anzeigen</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(doc)}
                        >
                          <FileEdit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Bearbeiten</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onReindex(doc.id)}
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Neu indexieren</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(doc.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Löschen</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
} 