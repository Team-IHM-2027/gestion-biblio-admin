// components/archives/ArchiveFilters.tsx
interface ArchiveFiltersProps {
  sortOrder: 'recent' | 'old';
  onSortChange: (order: 'recent' | 'old') => void;
  onSearchChange: (query: string) => void;
  translations: {
    recent: string;
    old: string;
  };
}

export const ArchiveFilters = ({ 
  sortOrder, 
  onSortChange,
  onSearchChange,
  translations
}: ArchiveFiltersProps) => (
  <div className="flex gap-4">
    <input
      type="text"
      onChange={(e) => onSearchChange(e.target.value)}
      placeholder="Search..."
      className="border rounded px-3 py-1 text-sm"
    />
    <select
      value={sortOrder}
      onChange={(e) => onSortChange(e.target.value as 'recent' | 'old')}
      className="border rounded px-3 py-1 text-sm"
    >
      <option value="recent">{translations.recent}</option>
      <option value="old">{translations.old}</option>
    </select>
  </div>
);