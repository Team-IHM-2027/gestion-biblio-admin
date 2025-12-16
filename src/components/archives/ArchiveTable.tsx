// components/archives/ArchiveTable.tsx

import { FaArchive } from 'react-icons/fa';
import { ArchiveTableHeader } from './ArchiveTableHeader';
import { ArchiveTableRow } from './ArchiveTableRow';
import type { ArchiveTableProps } from '../../types/archives';
import EmptyState from '../common/EmptyState';

export const ArchiveTable = ({
  items,
  translations,
  currentPage,
  itemsPerPage,
  className = '',
  onRefresh
}: ArchiveTableProps) => {
  if (items.length === 0) {
    return (
      // Amélioration de l'EmptyState pour coller au nouveau style
      <div className="p-10 text-center bg-white rounded-b-2xl">
        <EmptyState
          icon={<FaArchive className="text-primary/70" size={64} />} // Icône plus visible
          title={translations.no_data_title}
          description={translations.no_data_message}
          action={onRefresh ? {
            label: translations.refresh || 'Refresh',
            onClick: onRefresh,
            variant: 'primary' // Assurez-vous que 'primary' est un style de bouton défini
          } : undefined}
        />
      </div>
    );
  }

  return (
    // Suppression de l'overflow sur le conteneur du tableau pour le placer sur le conteneur parent (Archives.jsx)
    // Ici, on se concentre sur le style interne du tableau
    <div className={`overflow-x-auto ${className}`}> 
      <table className="min-w-full divide-y divide-gray-200"> {/* Utilisation de divide-y pour les séparateurs */}
        <ArchiveTableHeader translations={translations} />
        <tbody>
          {/* Laissez le mapping tel quel */}
          {items.map((item, index) => (
            <ArchiveTableRow
              key={`${item.id || index}-${item.heure}`}
              item={item}
              // Cette logique est maintenue pour afficher l'index inversé
              index={items.length - ((currentPage - 1) * itemsPerPage + index)} 
              returnedText={translations.returned}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};