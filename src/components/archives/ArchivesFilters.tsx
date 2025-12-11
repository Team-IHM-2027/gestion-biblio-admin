// components/archives/ArchiveFilters.tsx
// Modification: Suppression de l'input de recherche ici pour coller au nouveau design du parent (Archives.jsx)

interface ArchiveFiltersProps {
  sortOrder: 'recent' | 'old';
  onSortChange: (order: 'recent' | 'old') => void;
  // onSearchChange n'est plus utilisé ici
  translations: {
    recent: string;
    old: string;
  };
}

export const ArchiveFilters = ({ 
  sortOrder, 
  onSortChange,
  translations
}: ArchiveFiltersProps) => (
  // Conteneur de style "Pill" pour les contrôles segmentés
  <div className="flex space-x-0 bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200"> 
    
    {/* Bouton Récents */}
    <button
      onClick={() => onSortChange('recent')}
      className={`
        px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 w-full
        ${sortOrder === 'recent' 
          ? 'bg-primary text-white shadow-md shadow-primary/20' // Style actif
          : 'text-gray-600 hover:bg-white/70' // Style inactif
        }
      `}
    >
      {translations.recent}
    </button>

    {/* Bouton Anciens */}
    <button
      onClick={() => onSortChange('old')}
      className={`
        px-4 py-2 text-sm font-medium rounded-xl transition-all duration-300 w-full
        ${sortOrder === 'old' 
          ? 'bg-primary text-white shadow-md shadow-primary/20' // Style actif
          : 'text-gray-600 hover:bg-white/70' // Style inactif
        }
      `}
    >
      {translations.old}
    </button>
  </div>
);