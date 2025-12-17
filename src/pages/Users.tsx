// src/pages/Students.tsx
import React from 'react';

import StudentsTable from '../components/students/StudentsTable';
import StudentsFiltersComponent from '../components/students/StudentsFilters';
import StudentsPagination from '../components/students/StudentsPagination'; 
import LoadingSpinner from '../components/common/LoadingSpinner';

// Hooks
import { useStudents } from '../hooks/useStudents';
import useI18n from '../hooks/useI18n';

const Users: React.FC = () => {
  const { t } = useI18n();
  
  const {
    // Data
    filteredStudents,
    stats,
    
    // UI State
    loading,
    error,
    
    // Filters & Search
    filters,
    setFilters,
    
    // Pagination
    pagination,
    currentPageStudents,
    goToPage,
    nextPage,
    prevPage,
    
    // Actions
    updateStudentStatus,
    
    // Utils
    refreshData
  } = useStudents();

  const handleStatusUpdate = async (studentId: string, newStatus: 'ras' | 'bloc') => {
    try {
      await updateStudentStatus(studentId, newStatus);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    }
  };

  if (loading) {
    return (
     
        <div className="flex items-center justify-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
     
    );
  }

  if (error) {
    return (
     
        <div className="max-w-7xl mx-auto p-6">
          <div className="text-center py-12">
            <div className="text-red-600 text-lg mb-4">
              {t('components:students.error_loading')}
            </div>
            <div className="text-gray-600 mb-4">{error}</div>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              {t('components:students.retry')}
            </button>
          </div>
        </div>
     
    );
  }

  return (
   
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('components:students.students_list')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('components:students.manage_students_desc')}
            </p>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="flex space-x-4">
              <div className="bg-blue-50 rounded-lg p-4 min-w-[100px]">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-600">{t('components:students.total')}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 min-w-[100px]">
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                <div className="text-sm text-green-600">{t('components:students.active')}</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 min-w-[100px]">
                <div className="text-2xl font-bold text-red-600">{stats.blocked}</div>
                <div className="text-sm text-red-600">{t('components:students.blocked')}</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <StudentsFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          totalStudents={stats?.total || 0}
          filteredCount={filteredStudents.length}
        />

        {/* Table */}
        <StudentsTable
          students={currentPageStudents}
          onStatusUpdate={handleStatusUpdate}
          loading={loading}
        />

        {/* Pagination */}
        <StudentsPagination
          pagination={pagination}
          onPageChange={goToPage}
          onNextPage={nextPage}
          onPrevPage={prevPage}
        />
      </div>
   
  );
};

export default Users;