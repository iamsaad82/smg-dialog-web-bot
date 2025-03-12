import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  ChevronDown, 
  FileUp, 
  Filter, 
  FilePlus2, 
  RotateCw, 
  Trash2,
} from "lucide-react";

interface DocumentFiltersProps {
  titleFilter: string;
  statusFilter: string;
  categoryFilter: string;
  selectedCount: number;
  totalCount: number;
  onTitleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onResetFilters: () => void;
  onCreateDocument: () => void;
  onBulkUpload: () => void;
  onBulkReindex: () => void;
  onBulkDelete: () => void;
}

export default function DocumentFilters({
  titleFilter,
  statusFilter,
  categoryFilter,
  selectedCount,
  totalCount,
  onTitleFilterChange,
  onStatusFilterChange,
  onCategoryFilterChange,
  onResetFilters,
  onCreateDocument,
  onBulkUpload,
  onBulkReindex,
  onBulkDelete
}: DocumentFiltersProps) {
  const statusOptions = [
    { value: 'all', label: 'Alle Status' },
    { value: 'indexed', label: 'Indiziert' },
    { value: 'not_indexed', label: 'Nicht indiziert' },
    { value: 'error', label: 'Fehler' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'Alle Kategorien' },
    { value: 'document', label: 'Dokument' },
    { value: 'faq', label: 'FAQ' },
    { value: 'knowledge', label: 'Wissen' }
  ];

  // Hilfsfunktionen zum Konvertieren zwischen internen und UI-Werten
  const getStatusValue = (internalValue: string) => {
    return internalValue === '' ? 'all' : internalValue;
  }

  const getInternalStatusValue = (uiValue: string) => {
    return uiValue === 'all' ? '' : uiValue;
  }

  const getCategoryValue = (internalValue: string) => {
    return internalValue === '' ? 'all' : internalValue;
  }

  const getInternalCategoryValue = (uiValue: string) => {
    return uiValue === 'all' ? '' : uiValue;
  }

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 space-y-4 sm:space-x-4 sm:space-y-0">
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="w-full">
              <Input
                placeholder="Nach Titel filtern..."
                value={titleFilter}
                onChange={(e) => onTitleFilterChange(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <div className="w-full">
              <Select
                value={getStatusValue(statusFilter)}
                onValueChange={(value) => onStatusFilterChange(getInternalStatusValue(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status filtern" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full">
              <Select
                value={getCategoryValue(categoryFilter)}
                onValueChange={(value) => onCategoryFilterChange(getInternalCategoryValue(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategorie filtern" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onResetFilters}
            className="whitespace-nowrap"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filter zurücksetzen
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="whitespace-nowrap"
              >
                <FilePlus2 className="mr-2 h-4 w-4" />
                Dokument erstellen
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neues Dokument erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie ein neues Dokument oder wählen Sie die Massenupload-Option
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Button
                  onClick={onCreateDocument}
                  className="w-full"
                >
                  <FilePlus2 className="mr-2 h-4 w-4" />
                  Einzelnes Dokument erstellen
                </Button>
                <Button
                  onClick={onBulkUpload}
                  variant="outline"
                  className="w-full"
                >
                  <FileUp className="mr-2 h-4 w-4" />
                  Massenupload von Dokumenten
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {selectedCount > 0 && (
        <div className="flex items-center justify-between rounded-md border bg-background p-3 shadow-sm">
          <div>
            <span className="text-sm font-medium">
              {selectedCount} von {totalCount} Dokumenten ausgewählt
            </span>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBulkReindex}
            >
              <RotateCw className="mr-2 h-4 w-4" />
              Neu indizieren
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={onBulkDelete}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Löschen
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 