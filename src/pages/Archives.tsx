import { useState } from 'react';
import { useI18n } from '../hooks/useI18n';
import { useArchives } from '../hooks/useArchives';
import { ArchiveTable } from '../components/archives/ArchiveTable';

import LoadingSpinner from '../components/common/LoadingSpinner';
import Pagination from '../components/common/Pagination';
import { ArchiveFilters } from '../components/archives/ArchivesFilters';


const Archives = () => {
  const { t } = useI18n();
  const {
    // archives,
    // stats,
    loading, 
    filteredArchives, 
    sortArchives,
    paginateArchives,
    setSearchQuery
  } = useArchives();
  
  const [currentPage, setCurrentPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'recent' | 'old'>('recent');
  const itemsPerPage = 10;

  // Appliquer filtres et tris
  const filtered = filteredArchives();
  const sorted = sortArchives(filtered, sortOrder);
  const paginated = paginateArchives(sorted, currentPage, itemsPerPage);

  const translations = {
    client_info: t('components:archives.table.client_info'),
    document_name: t('components:archives.table.document_name'),
    return_date: t('components:archives.table.return_date'),
    status: t('components:archives.table.status'),
    returned: t('components:archives.table.returned'),
    no_data_title: t('components:archives.table.no_data_title'),
    no_data_message: t('components:archives.table.no_data_message'),
    refresh: t('components:archives.table.refresh'),
    sort: {
      recent: t('components:archives.sort.recent'),
      old: t('components:archives.sort.old')
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <ArchiveFilters 
          sortOrder={sortOrder}
          onSortChange={setSortOrder}
          onSearchChange={setSearchQuery}
          translations={translations.sort}
        />
      </div>

      <ArchiveTable
        items={paginated}
        translations={translations}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
      />

      {sorted.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(sorted.length / itemsPerPage)}
          onGoToPage={setCurrentPage}
          hasNextPage={currentPage < Math.ceil(sorted.length / itemsPerPage)}
          hasPrevPage={currentPage > 1}
          onNextPage={() => setCurrentPage(currentPage + 1)}
          onPrevPage={() => setCurrentPage(currentPage - 1)}
          showPageInfo
        />
      )}
    </div>
  );
};

export default Archives;