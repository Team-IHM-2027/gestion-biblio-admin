// src/hooks/useArchives.ts
import { useState, useEffect, useCallback } from 'react';
import { archiveService } from '../services/archiveService';
import type { ArchiveItem, ArchiveStats } from '../types/archives';
import type { NotificationState } from '../types';

export const useArchives = () => {
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState<ArchiveStats>({
    totalArchives: 0,
    lastArchiveDate: null
  });

  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    type: 'success',
    message: ''
  });

  const [searchQuery, setSearchQuery] = useState('');

  //  Notification
  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ visible: true, type, message });
    setTimeout(() => {
      setNotification({ visible: false, type: 'success', message: '' });
    }, 3000);
  }, []);

  //  Charger les archives
  const loadArchives = useCallback(async () => {
    try {
      setLoading(true);

      const [archiveData, statsData] = await Promise.all([
        archiveService.getArchives(),
        archiveService.getArchiveStatistics()
      ]);

      // NORMALISATION DU NOM DU DOCUMENT
      const normalizedArchives: ArchiveItem[] = archiveData.map((archive: ArchiveItem) => ({
        ...archive,
        nomDoc: archive.nomDoc
          ? archive.nomDoc.replace(/[_\-]/g, ' ')
          : 'Document inconnu'
      }));

      setArchives(normalizedArchives);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading archives:', error);
      showNotification('error', 'Failed to load archives');
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  //  Filtrage
  const filteredArchives = useCallback(() => {
    if (!searchQuery) return archives;

    const query = searchQuery.toLowerCase();

    return archives.filter(item =>
      item.nomDoc?.toLowerCase().includes(query) ||
      item.nomEtudiant?.toLowerCase().includes(query) ||
      item.heure?.toLowerCase().includes(query)
    );
  }, [archives, searchQuery]);

  // Tri
  const sortArchives = useCallback(
    (items: ArchiveItem[], sortOrder: 'recent' | 'old') => {
      return [...items].sort((a, b) => {
        const dateA = new Date(a.heure).getTime();
        const dateB = new Date(b.heure).getTime();

        return sortOrder === 'recent'
          ? dateB - dateA
          : dateA - dateB;
      });
    },
    []
  );

  //  Pagination
  const paginateArchives = useCallback(
    (items: ArchiveItem[], currentPage: number, itemsPerPage: number) => {
      const startIndex = (currentPage - 1) * itemsPerPage;
      return items.slice(startIndex, startIndex + itemsPerPage);
    },
    []
  );

  useEffect(() => {
    loadArchives();
  }, [loadArchives]);

  return {
    archives,
    filteredArchives,
    sortArchives,
    paginateArchives,
    loading,
    stats,
    notification,
    searchQuery,
    setSearchQuery,
    loadArchives,
    showNotification
  };
};
