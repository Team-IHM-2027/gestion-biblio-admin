// src/hooks/useStudents.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { studentsService } from '../services/studentsService';
import type { 
  Student, 
  StudentsFilters, 
  StudentsStats, 
  PaginationData
} from '../types/students';

export const useStudents = () => {
  // -------------------------------------------------------
  // STATE PRINCIPAL
  // -------------------------------------------------------
  const [students, setStudents] = useState<Student[]>([]);
  const [stats, setStats] = useState<StudentsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);

  // -------------------------------------------------------
  // FILTERS
  // -------------------------------------------------------
  const [filters, setFiltersState] = useState<StudentsFilters>({
    search: "",
    status: "all",
    level: "",
    department: "",
    sortBy: "recent",
  });

  // -------------------------------------------------------
  // PAGINATION
  // -------------------------------------------------------
  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // -------------------------------------------------------
  // CHARGEMENT DES ÉTUDIANTS
  // -------------------------------------------------------
  const loadStudents = useCallback(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = studentsService.subscribeToStudents(
      (studentsData) => {
        setStudents(studentsData);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  // -------------------------------------------------------
  // CHARGEMENT DES STATISTIQUES
  // -------------------------------------------------------
  const loadStats = useCallback(async () => {
    try {
      const statsData = await studentsService.getStudentsStats();
      setStats(statsData);
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err);
    }
  }, []);

  // -------------------------------------------------------
  // FILTRAGE ET TRI
  // -------------------------------------------------------
  const filteredList = useMemo(() => {
    const searchTerm = filters.search.toLowerCase().trim();

    let filtered = students.filter((student) => {
      const matchSearch =
        !searchTerm ||
        student.name?.toLowerCase().includes(searchTerm) ||
        student.email?.toLowerCase().includes(searchTerm);

      const matchStatus =
        filters.status === "all" || student.status === filters.status;

      const matchLevel =
        !filters.level || student.level === filters.level;

      const matchDepartment =
        !filters.department || student.department === filters.department;

      return matchSearch && matchStatus && matchLevel && matchDepartment;
    });

    switch (filters.sortBy) {
      case "recent":
        filtered.sort((a, b) => 
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        break;
      case "oldest":
        filtered.sort((a, b) => 
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
        break;
      case "name":
        filtered.sort((a, b) => 
          (a.name || "").localeCompare(b.name || "")
        );
        break;
      case "name-desc":
        filtered.sort((a, b) => 
          (b.name || "").localeCompare(a.name || "")
        );
        break;
    }

    return filtered;
  }, [students, filters]);

  // -------------------------------------------------------
  // MISE À JOUR PAGINATION
  // -------------------------------------------------------
  useEffect(() => {
    const totalItems = filteredList.length;
    const totalPages = Math.ceil(totalItems / pagination.itemsPerPage) || 1;
    const currentPage = Math.min(pagination.currentPage, totalPages);

    setPagination((prev) => ({
      ...prev,
      currentPage,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
    }));
  }, [filteredList.length, pagination.itemsPerPage]);

  // -------------------------------------------------------
  // ÉTUDIANTS DE LA PAGE ACTUELLE
  // -------------------------------------------------------
  const currentPageStudents = useCallback(() => {
    const start = (pagination.currentPage - 1) * pagination.itemsPerPage;
    const end = start + pagination.itemsPerPage;
    return filteredList.slice(start, end);
  }, [filteredList, pagination.currentPage, pagination.itemsPerPage]);

  // -------------------------------------------------------
  // MODIFICATION DES FILTRES
  // -------------------------------------------------------
  const setFilters = useCallback(
    (newFilters: Partial<StudentsFilters>) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
      setPagination((prev) => ({ ...prev, currentPage: 1 }));
    },
    []
  );

  // -------------------------------------------------------
  // PAGINATION ACTIONS
  // -------------------------------------------------------
  const goToPage = useCallback((page: number) => {
    setPagination((prev) => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages))
    }));
  }, []);

  const nextPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      currentPage: prev.hasNextPage ? prev.currentPage + 1 : prev.currentPage
    }));
  }, []);

  const prevPage = useCallback(() => {
    setPagination((prev) => ({
      ...prev,
      currentPage: prev.hasPrevPage ? prev.currentPage - 1 : prev.currentPage
    }));
  }, []);

  // -------------------------------------------------------
  // SÉLECTION DES ÉTUDIANTS
  // -------------------------------------------------------
  const selectStudent = useCallback((studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  }, []);

  const selectAll = useCallback(() => {
    const ids = currentPageStudents().map((s) => s.id);
    setSelectedStudents((prev) => {
      const allSelected = ids.every((id) => prev.includes(id));
      return allSelected
        ? prev.filter((id) => !ids.includes(id))
        : [...new Set([...prev, ...ids])];
    });
  }, [currentPageStudents]);

  const clearSelection = useCallback(() => setSelectedStudents([]), []);
  const isSelected = useCallback((studentId: string) => selectedStudents.includes(studentId), [selectedStudents]);

  // -------------------------------------------------------
  // ACTIONS SUR LES ÉTUDIANTS
  // -------------------------------------------------------
  const updateStudentStatus = useCallback(
    async (studentId: string, newStatus: "ras" | "bloc") => {
      await studentsService.updateStudentStatus(studentId, newStatus);
      await loadStats();
    },
    [loadStats]
  );

  const bulkUpdateStatus = useCallback(
    async (studentIds: string[], newStatus: "ras" | "bloc") => {
      await studentsService.bulkAction({
        studentIds,
        action: newStatus === "bloc" ? "block" : "unblock",
      });
      clearSelection();
      await loadStats();
    },
    [clearSelection, loadStats]
  );

  const deleteStudent = useCallback(
    async (studentId: string) => {
      await studentsService.deleteStudent(studentId);
      await loadStats();
    },
    [loadStats]
  );

  const bulkDeleteStudents = useCallback(
    async (studentIds: string[]) => {
      await studentsService.bulkAction({
        studentIds,
        action: "delete",
      });
      clearSelection();
      await loadStats();
    },
    [clearSelection, loadStats]
  );

  const exportStudents = useCallback(async () => {
    return studentsService.exportStudents(filters);
  }, [filters]);

  const refreshData = useCallback(() => {
    loadStats();
  }, [loadStats]);

  // -------------------------------------------------------
  // INITIALISATION
  // -------------------------------------------------------
  useEffect(() => {
    const unsubscribe = loadStudents();
    loadStats();
    return unsubscribe;
  }, [loadStudents, loadStats]);

  return {
    students,
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
    selectedStudents,
    selectStudent,
    selectAll,
    clearSelection,
    isSelected,
    updateStudentStatus,
    bulkUpdateStatus,
    deleteStudent,
    bulkDeleteStudents,
    refreshData,
    exportStudents,
  };
};
