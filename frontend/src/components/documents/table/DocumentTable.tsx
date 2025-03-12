import React from 'react';
import { Document, IndexStatus } from '@/types/api';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Eye, 
  Pencil, 
  Trash2, 
  MoreVertical, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import StatusBadge from './StatusBadge';

// Typen für die Props
interface DocumentTableProps {
  documents: Document[];
  documentStatus: {
    [key: string]: {
      status: IndexStatus;
      lastUpdated?: string;
      error?: string;
    };
  };
  selectedDocuments: string[];
  allSelected: boolean;
  onSelectDocument: (docId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onViewDocument: (document: Document) => void;
  onEditDocument: (document: Document) => void;
  onDeleteDocument: (documentId: string) => void;
  onReindexDocument: (documentId: string) => void;
}

/**
 * Erweiterte Dokumententabelle mit shadcn UI-Komponenten
 */
export default function DocumentTable({
  documents,
  documentStatus,
  selectedDocuments,
  allSelected,
  onSelectDocument,
  onSelectAll,
  onViewDocument,
  onEditDocument,
  onDeleteDocument,
  onReindexDocument
}: DocumentTableProps) {
  // Sortierfunktion für Dokumente
  const [sortField, setSortField] = React.useState<string>('title');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');

  // Sortierte Dokumente
  const sortedDocuments = React.useMemo(() => {
    return [...documents].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'status':
          aValue = documentStatus[a.id]?.status || '';
          bValue = documentStatus[b.id]?.status || '';
          break;
        case 'category':
          aValue = a.doc_metadata?.category?.toLowerCase() || '';
          bValue = b.doc_metadata?.category?.toLowerCase() || '';
          break;
        case 'updated':
          aValue = a.created_at || '';
          bValue = b.created_at || '';
          break;
        default:
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
      }

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [documents, sortField, sortDirection, documentStatus]);

  // Sortierrichtung umschalten
  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sortierungsrichtungs-Indikator rendern
  const renderSortIndicator = (field: string) => {
    if (sortField !== field) return null;
    
    return (
      <span className="ml-1">
        {sortDirection === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  // Prüfen, ob ein Dokument ausgewählt ist
  const isSelected = (docId: string) => {
    return selectedDocuments.includes(docId);
  };

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={allSelected}
                onCheckedChange={onSelectAll}
                aria-label="Alle Dokumente auswählen"
              />
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => toggleSort('title')}
            >
              Titel {renderSortIndicator('title')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => toggleSort('status')}
            >
              Status {renderSortIndicator('status')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => toggleSort('category')}
            >
              Kategorie {renderSortIndicator('category')}
            </TableHead>
            <TableHead 
              className="cursor-pointer"
              onClick={() => toggleSort('updated')}
            >
              Erstellt am {renderSortIndicator('updated')}
            </TableHead>
            <TableHead className="text-right">Aktionen</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedDocuments.map((doc) => {
            const status = documentStatus[doc.id] || { 
              status: IndexStatus.NICHT_INDIZIERT 
            };
            
            return (
              <TableRow key={doc.id}>
                <TableCell>
                  <Checkbox 
                    checked={isSelected(doc.id)}
                    onCheckedChange={(checked) => onSelectDocument(doc.id, !!checked)}
                    aria-label={`Dokument ${doc.title} auswählen`}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="truncate max-w-xs">{doc.title}</span>
                    {doc.source && (
                      <span className="text-xs text-muted-foreground truncate max-w-xs">
                        Quelle: {doc.source}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={status} />
                </TableCell>
                <TableCell>
                  {doc.doc_metadata?.category || "-"}
                </TableCell>
                <TableCell>
                  {doc.created_at 
                    ? new Date(doc.created_at).toLocaleString('de-DE', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : "-"
                  }
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center space-x-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onViewDocument(doc)}
                          >
                            <Eye size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Dokument ansehen</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => onEditDocument(doc)}
                          >
                            <Pencil size={16} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Dokument bearbeiten</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onReindexDocument(doc.id)}>
                          <RefreshCw size={16} className="mr-2" />
                          Neu indizieren
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDeleteDocument(doc.id)}
                          className="text-destructive"
                        >
                          <Trash2 size={16} className="mr-2" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
} 