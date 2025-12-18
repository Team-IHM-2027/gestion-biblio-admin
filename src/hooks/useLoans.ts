// hooks/useLoans.ts
import { useState, useEffect, useCallback } from 'react';
import { loanService } from '../services/loanService';
import type { ProcessedUserLoan, NotificationState } from '../types';

export const useLoans = () => {
  const [loans, setLoans] = useState<ProcessedUserLoan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingItem, setProcessingItem] = useState<string | null>(null);
  const [maxLoans, setMaxLoans] = useState<number>(3);
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    type: 'success',
    message: ''
  });

  // Charger les emprunts
  const loadLoans = useCallback(async () => {
    try {
      setLoading(true);
      
      const [activeLoans, maxLoansConfig] = await Promise.all([
        loanService.getActiveLoans(),
        loanService.getMaxLoans()
      ]);
      
      setLoans(activeLoans);
      setMaxLoans(maxLoansConfig);
    } catch (error) {
      showNotification('error', 'Erreur lors du chargement des emprunts');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Afficher une notification
  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ visible: true, type, message });
    setTimeout(() => {
      setNotification({ visible: false, type: 'success', message: '' });
    }, 3000);
  }, []);

  // Retourner un document
  const returnDocument = useCallback(async (
    user: ProcessedUserLoan, 
    slot: number,
    t: (key: string) => string
  ) => {
    const processingKey = `${user.email}-${slot}`;
    setProcessingItem(processingKey);

    try {
      const slotData = user.activeSlots.find(s => s.slotNumber === slot);
      if (!slotData || !slotData.document) {
        throw new Error(`Aucun document trouvé pour le slot ${slot}`);
      }

      // Appel au service avec la nouvelle logique (ID direct)
      await loanService.returnDocumentForProcessedUser(user, slot);

      // --- MODIFICATION TÂCHE 6 - PARTIE 1 ---
      showNotification('success', t('return_success_message') || 'Retour enregistré avec succès.');
      
      // Recharger les données
      await loadLoans();
      
    } catch (error) {
      console.error('Erreur lors du retour:', error);
      showNotification('error', t('return_error') || 'Erreur lors de l\'enregistrement du retour.');
    } finally {
      setProcessingItem(null);
    }
  }, [loadLoans, showNotification]);

  // Charger les données au montage
  useEffect(() => {
    loadLoans();
  }, [loadLoans]);

  return {
    loans,
    loading,
    processingItem,
    notification,
    maxLoans,
    returnDocument,
    loadLoans,
    showNotification
  };
};

// Hook pour la pagination
export const usePagination = <T>(items: T[], itemsPerPage: number = 5) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const goToPage = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  // Reset page when items change
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  return {
    currentItems,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};
