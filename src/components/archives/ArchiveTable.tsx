
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
      <EmptyState
        icon={<FaArchive className="text-gray-400" size={48} />}
        title={translations.no_data_title}
        description={translations.no_data_message}
        action={onRefresh ? {
          label: translations.refresh || 'Refresh',
          onClick: onRefresh,
          variant: 'primary'
        } : undefined}
      />
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <ArchiveTableHeader translations={translations} />
        <tbody>
          {items.map((item, index) => (
            <ArchiveTableRow
              key={`${item.id || index}-${item.heure}`}
              item={item}
              index={items.length - ((currentPage - 1) * itemsPerPage + index)}
              returnedText={translations.returned}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
};