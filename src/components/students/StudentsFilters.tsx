// src/components/students/StudentsFilters.tsx
import React, { useState, useEffect } from 'react';
import { FaFilter, FaSort } from 'react-icons/fa';
import type { StudentsFilters } from '../../types/students';
import useI18n from '../../hooks/useI18n';
import { fetchDepartments } from '../../services/departementService';
import type { Department } from '../../types/departement';
import { ACADEMIC_LEVELS } from '../../types/levels';

interface StudentsFiltersProps {
  filters: StudentsFilters;
  onFiltersChange: (filters: Partial<StudentsFilters>) => void;
  totalStudents: number;
  filteredCount: number;
}

const StudentsFiltersComponent: React.FC<StudentsFiltersProps> = ({
  filters,
  onFiltersChange,
  totalStudents,
  filteredCount
}) => {
  const { t } = useI18n();
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const getDepartments = async () => {
      try {
        const data = await fetchDepartments();
        setDepartments(data);
      } catch (error) {
        console.error("Failed to fetch departments", error);
      }
    };
    getDepartments();
  }, []);

  const statusOptions = [
    { value: 'all', label: t('components:students.all_status') },
    { value: 'ras', label: t('components:students.active') },
    { value: 'bloc', label: t('components:students.blocked') }
  ];

  const sortOptions = [
    { value: 'recent', label: t('components:students.recent_date') },
    { value: 'old', label: t('components:students.old_date') },
    { value: 'name', label: t('components:students.sort_by_name') },
    { value: 'level', label: t('components:students.sort_by_level') }
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <FaFilter className="text-gray-500" />
          <h3 className="text-lg font-semibold text-gray-900">
            {t('components:students.filters')}
          </h3>
        </div>
        <div className="text-sm text-gray-600">
          {filteredCount === totalStudents ? (
            <span>{totalStudents} {t('components:students.students_total')}</span>
          ) : (
            <span>
              {filteredCount} {t('components:students.of')} {totalStudents} {t('components:students.students')}
            </span>
          )}
        </div>
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('components:students.filter_by_status')}
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ status: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>
                {/* Ensure statusOptions also uses t() for its labels */}
                {t(`components:students.statuses.${option.value}`, option.label)}
              </option>
            ))}
          </select>
        </div>

        {/* Level Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('components:students.filter_by_level')}
          </label>
          <select
            value={filters.level}
            onChange={(e) => onFiltersChange({ level: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t('components:students.all_levels', { defaultValue: 'Tous les niveaux' })}</option>
            {ACADEMIC_LEVELS.map((level) => (
              <option key={level.id} value={level.code}>
                {level.name}
              </option>
            ))}
          </select>
        </div>
        {/* Department Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('components:students.filter_by_department')}
          </label>
          <select
            value={filters.department}
            onChange={(e) => onFiltersChange({ department: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t('components:students.all_departments', { defaultValue: 'Tous les départements' })}</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.nom}>
                {dept.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <FaSort className="inline mr-1" />
            {t('components:students.sort_by')}
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ sortBy: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            style={{
              backgroundColor: "white",
              border: "1px solid chocolate",
              color: "chocolate",
              fontWeight: "500"
            }}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear Filters */}
      {(filters.status !== 'all' || filters.level || filters.department) && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => onFiltersChange({
              status: 'all',
              level: '',
              department: ''
            })}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors duration-200"
          >
            {t('components:students.clear_filters')}
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentsFiltersComponent;