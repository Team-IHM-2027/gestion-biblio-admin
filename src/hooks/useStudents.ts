// src/hooks/useStudents.ts
import { useState, useEffect, useCallback } from 'react';
import { studentsService } from '../services/studentsService';
import type { 
  Student, 
  StudentsFilters, 
  StudentsStats, 
  PaginationData,
 
} from '../types/students';
import { useSearchContext } from '../context/SearchContext';

interface UseStudentsReturn {
  // Data
  students: Student[];
  filteredStudents: Student[];
  stats: StudentsStats | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Filters & Search
  filters: StudentsFilters;
  setFilters: (filters: Partial<StudentsFilters>) => void;
  
  // Pagination
  pagination: PaginationData;
  currentPageStudents: Student[];
  goToPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  
  // Selection
  selectedStudents: string[];
  selectStudent: (studentId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  isSelected: (studentId: string) => boolean;
  
  // Actions
  updateStudentStatus: (studentId: string, newStatus: 'ras' | 'bloc') => Promise<void>;
  bulkUpdateStatus: (studentIds: string[], newStatus: 'ras' | 'bloc') => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  bulkDeleteStudents: (studentIds: string[]) => Promise<void>;
  
  // Utils
  refreshData: () => void;
  exportStudents: () => Promise<Student[]>;
}

export const useStudents = (): UseStudentsReturn => {
  // Search context
  const { searchWord } = useSearchContext();
  
  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Filters
  const [filters, setFiltersState] = useState<StudentsFilters>({
    search: '',
    status: 'all',
    level: '',
    department: '',
    sortBy: 'recent'
  });
  
  // Pagination
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 8,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Update search from context
  useEffect(() => {
    setFiltersState(prev => ({ ...prev, search: searchWord }));
  }, [searchWord]);

  // Load students data
  const loadStudents = useCallback(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = studentsService.subscribeToStudents(
      (studentsData) => {
        setStudents(studentsData);
        setLoading(false);
      },
      (error) => {
        setError(error.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // Load stats
  const loadStats = useCallback(async () => {
    try {
      const statsData = await studentsService.getStudentsStats();
      setStats(statsData);
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  }, []);

  // Filter students
  const filteredStudents = useCallback(() => {
    return studentsService.filterAndSortStudents(students, filters);
  }, [students, filters]);

  const filtered = filteredStudents();

  // Update pagination
  useEffect(() => {
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage);
    
    setPagination(prev => ({
      ...prev,
      totalItems,
      totalPages,
      hasNextPage: prev.currentPage < totalPages,
      hasPrevPage: prev.currentPage > 1
    }));
  }, [filtered.length, pagination.itemsPerPage, pagination.currentPage]);

  // Get current page students
  const currentPageStudents = useCallback(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const endIndex = startIndex + pagination.itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, pagination.currentPage, pagination.itemsPerPage]);

  // Filter setters
  const setFilters = useCallback((newFilters: Partial<StudentsFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  }, []);

  // Pagination actions
  const goToPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  }, []);

  const nextPage = useCallback(() => {
    if (pagination.hasNextPage) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }));
    }
  }, [pagination.hasNextPage]);

  const prevPage = useCallback(() => {
    if (pagination.hasPrevPage) {
      setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }));
    }
  }, [pagination.hasPrevPage]);

  // Selection actions
  const selectStudent = useCallback((studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  }, []);

  const selectAll = useCallback(() => {
    const currentPageIds = currentPageStudents().map(s => s.id);
    setSelectedStudents(prev => {
      const allSelected = currentPageIds.every(id => prev.includes(id));
      if (allSelected) {
        return prev.filter(id => !currentPageIds.includes(id));
      } else {
        return [...new Set([...prev, ...currentPageIds])];
      }
    });
  }, [currentPageStudents]);

  const clearSelection = useCallback(() => {
    setSelectedStudents([]);
  }, []);

  const isSelected = useCallback((studentId: string) => {
    return selectedStudents.includes(studentId);
  }, [selectedStudents]);

  // Student actions
  const updateStudentStatus = useCallback(async (studentId: string, newStatus: 'ras' | 'bloc') => {
    try {
      await studentsService.updateStudentStatus(studentId, newStatus);
      await loadStats(); // Refresh stats
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }, [loadStats]);

  const bulkUpdateStatus = useCallback(async (studentIds: string[], newStatus: 'ras' | 'bloc') => {
    try {
      await studentsService.bulkAction({
        studentIds,
        action: newStatus === 'bloc' ? 'block' : 'unblock'
      });
      clearSelection();
      await loadStats();
    } catch (error) {
      console.error('Erreur lors de la mise à jour en lot:', error);
      throw error;
    }
  }, [clearSelection, loadStats]);

  const deleteStudent = useCallback(async (studentId: string) => {
    try {
      await studentsService.deleteStudent(studentId);
      await loadStats();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      throw error;
    }
  }, [loadStats]);

  const bulkDeleteStudents = useCallback(async (studentIds: string[]) => {
    try {
      await studentsService.bulkAction({
        studentIds,
        action: 'delete'
      });
      clearSelection();
      await loadStats();
    } catch (error) {
      console.error('Erreur lors de la suppression en lot:', error);
      throw error;
    }
  }, [clearSelection, loadStats]);

  // Export
  const exportStudents = useCallback(async () => {
    try {
      return await studentsService.exportStudents(filters);
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      throw error;
    }
  }, [filters]);

  // Refresh data
  const refreshData = useCallback(() => {
    loadStats();
  }, [loadStats]);

  // Load data on mount
  useEffect(() => {
    const unsubscribe = loadStudents();
    loadStats();
    
    return unsubscribe;
  }, [loadStudents, loadStats]);

  return {
    // Data
    students,
    filteredStudents: filtered,
    stats,
    
    // UI State
    loading,
    error,
    
    // Filters & Search
    filters,
    setFilters,
    
    // Pagination
    pagination,
    currentPageStudents: currentPageStudents(),
    goToPage,
    nextPage,
    prevPage,
    
    // Selection
    selectedStudents,
    selectStudent,
    selectAll,
    clearSelection,
    isSelected,
    
    // Actions
    updateStudentStatus,
    bulkUpdateStatus,
    deleteStudent,
    bulkDeleteStudents,
    
    // Utils
    refreshData,
    exportStudents
  };
};