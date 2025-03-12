import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useDocuments } from '../context/DocumentsProvider';

interface DocumentFiltersProps {
  titleFilter: string;
  statusFilter: string;
  categoryFilter: string;
  setTitleFilter: (value: string) => void;
  setStatusFilter: (value: string) => void;
  setCategoryFilter: (value: string) => void;
}

/**
 * Komponente für die Dokumentenfilter
 */
export default function DocumentFilters({
  titleFilter,
  statusFilter,
  categoryFilter,
  setTitleFilter,
  setStatusFilter,
  setCategoryFilter
}: DocumentFiltersProps) {
  // Kategorien aus dem Dokumenten-Kontext abrufen
  const { categories } = useDocuments();
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Titelfilter */}
      <div className="space-y-2">
        <Label htmlFor="title-filter">Titel</Label>
        <Input
          id="title-filter"
          placeholder="Nach Titel suchen..."
          value={titleFilter}
          onChange={(e) => setTitleFilter(e.target.value)}
        />
      </div>
      
      {/* Statusfilter */}
      <div className="space-y-2">
        <Label htmlFor="status-filter">Status</Label>
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger id="status-filter">
            <SelectValue placeholder="Alle Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Status</SelectItem>
            <SelectItem value="indexed">Indiziert</SelectItem>
            <SelectItem value="unindexed">Nicht indiziert</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Kategoriefilter */}
      <div className="space-y-2">
        <Label htmlFor="category-filter">Kategorie</Label>
        <Select
          value={categoryFilter}
          onValueChange={setCategoryFilter}
        >
          <SelectTrigger id="category-filter">
            <SelectValue placeholder="Alle Kategorien" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Alle Kategorien</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
} 