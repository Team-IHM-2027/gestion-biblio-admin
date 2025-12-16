// src/pages/Students.tsx
import React from 'react';
import StudentsTable from '../components/students/StudentsTable';
import StudentsFiltersComponent from '../components/students/StudentsFilters';
import StudentsPagination from '../components/students/StudentsPagination'; 
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Search, X } from 'lucide-react';
import { useStudents } from '../hooks/useStudents';
import useI18n from '../hooks/useI18n';

const StudentsPage: React.FC = () => {
  const { t } = useI18n();

  const {
    filteredList,
    stats,
    loading,
    error,
    filters,
    setFilters,
    pagination,
    currentPageStudents,
    goToPage,
    nextPage,
    prevPage,
    updateStudentStatus,
    refreshData
  } = useStudents();

  const handleStatusUpdate = async (studentId: string, newStatus: 'ras' | 'bloc') => {
    try {
      await updateStudentStatus(studentId, newStatus);
    } catch (err) {
      console.error('Erreur lors de la mise à jour du statut:', err);
    }
  };

  if (loading && !filteredList.length) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="text-red-600 text-xl font-semibold mb-4">
            {t('components:students.error_loading')}
          </div>
          <div className="text-gray-600 mb-4">{error}</div>
          <button
            onClick={refreshData}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-all shadow-md"
          >
            {t('components:students.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('components:students.students_list')}</h1>
        <p className="text-gray-500 mt-1">{t('components:students.manage_students_desc')}</p>
      </div>

      {/* STATS CARDS */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Total */}
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
            <p className="text-sm font-medium text-yellow-700">{t('components:students.total')}</p>
            <h3 className="text-3xl font-bold text-yellow-900 mt-1">{stats.total}</h3>
          </div>

          {/* Active */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
            <p className="text-sm font-medium text-green-700">{t('components:students.active')}</p>
            <h3 className="text-3xl font-bold text-green-900 mt-1">{stats.active}</h3>
          </div>

          {/* Blocked */}
          <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-6 shadow hover:shadow-lg transition-shadow">
            <p className="text-sm font-medium text-red-700">{t('components:students.blocked')}</p>
            <h3 className="text-3xl font-bold text-red-900 mt-1">{stats.blocked}</h3>
          </div>
        </div>
      )}

      {/* SEARCH + FILTERS — PREMIUM VERSION */}
      <div className="bg-white border border-gray-100 shadow-xl rounded-2xl overflow-hidden">

        {/* SEARCH BAR */}
        <div className="p-5 border-b border-gray-100 backdrop-blur-sm bg-white/60 relative">

          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl shadow-inner px-4 py-3
                          transition-all focus-within:border-yellow-500 focus-within:ring-2 focus-within:ring-yellow-300">

            {/* Search Icon */}
            <Search className="w-5 h-5 text-gray-400" />

            {/* Input */}
            <input
              type="text"
              placeholder={t('components:students.search_placeholder')}
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="flex-1 bg-transparent border-none outline-none px-3 text-gray-800 placeholder-gray-400 text-sm"
            />

            {/* Clear Button */}
            {filters.search && (
              <button
                onClick={() => setFilters({ search: "" })}
                title={t('components:students.clear_search')}
                className="p-1.5 rounded-full hover:bg-gray-200 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              </button>
            )}
          </div>

          {/* Decorative gradient underline */}
          <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-yellow-400 to-yellow-600 opacity-70"></div>
        </div>

        {/* FILTERS */}
        <StudentsFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          totalStudents={stats?.total || 0}
          filteredCount={filteredList.length}
        />
      </div>

      {/* TABLE */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-md overflow-hidden">
        <StudentsTable
          students={currentPageStudents()}
          onStatusUpdate={handleStatusUpdate}
          loading={loading && filteredList.length > 0}
        />
      </div>

      {/* PAGINATION */}
      {pagination && (
        <StudentsPagination
          pagination={pagination}
          onPageChange={goToPage}
          onNextPage={nextPage}
          onPrevPage={prevPage}
        />
      )}
    </div>
  );
};

export default StudentsPage;
