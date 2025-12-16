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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Section avec gradient subtil */}
      <div className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-gray-200/50 backdrop-blur-sm">
        <div className="px-6 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Titre avec icône */}
            <div className="flex items-center space-x-4 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-dark rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('components:archives.title') || 'Archives'}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  {t('components:archives.subtitle') || 'Historique complet des retours de documents'}
                </p>
              </div>
            </div>

            {/* Statistiques en cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Archives</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{sorted.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Page Actuelle</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{currentPage} / {Math.ceil(sorted.length / itemsPerPage)}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Par Page</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{itemsPerPage}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu Principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Section Filtres */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 mb-6 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
            <div className="flex items-center space-x-2 mb-4">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <h2 className="text-lg font-semibold text-gray-900">Filtres & Recherche</h2>
            </div>
            <ArchiveFilters 
              sortOrder={sortOrder}
              onSortChange={setSortOrder}
              onSearchChange={setSearchQuery}
              translations={translations.sort}
            />
          </div>
        </div>

        {/* Section Tableau */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
          {/* En-tête du tableau avec gradient */}
          <div className="p-6 bg-gradient-to-r from-primary/5 to-primary/10 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Liste des Archives</h3>
                  <p className="text-sm text-gray-600">{paginated.length} résultat(s) sur cette page</p>
                </div>
              </div>
              
              {/* Badge du nombre total */}
              <div className="hidden md:flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
                <span className="text-sm font-medium text-gray-600">Total:</span>
                <span className="text-lg font-bold text-primary">{sorted.length}</span>
              </div>
            </div>
          </div>

          {/* Tableau avec scroll personnalisé */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <ArchiveTable
                items={paginated}
                translations={translations}
                currentPage={currentPage}
                itemsPerPage={itemsPerPage}
              />
            </div>
          </div>
        </div>

        {/* Pagination avec style moderne */}
        {sorted.length > itemsPerPage && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-200/50 p-6">
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
          </div>
        )}
      </div>

      {/* Décoration de fond */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
};

export default Archives;