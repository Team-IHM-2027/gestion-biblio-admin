// hooks/useReservations.ts
import { useState, useEffect, useCallback } from 'react';
import { reservationService } from '../services/reservationService';
import type { ProcessedUserReservation } from '../types/reservations';
import type { NotificationState } from '../types';

// Utilitaire pour extraire la date la plus récente d'une réservation pour un utilisateur
const getLatestReservationDate = (user: ProcessedUserReservation): number => {
  return user.reservationSlots.reduce((latest: number, slot: any) => {
    const rawDate = slot.document.reservationDate;
    let time = 0;
    if (rawDate) {
      if (typeof rawDate === 'object' && 'seconds' in rawDate) {
        time = rawDate.seconds * 1000;
      } else {
        time = new Date(rawDate).getTime();
      }
    }
    return (time > latest) ? time : latest;
  }, 0);
};

export const useReservations = () => {
  const [reservations, setReservations] = useState<ProcessedUserReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingItem, setProcessingItem] = useState<string | null>(null);
  const [maxLoans, setMaxLoans] = useState<number>(3);
  const [notification, setNotification] = useState<NotificationState>({
    visible: false, type: 'success', message: ''
  });

  const loadReservations = useCallback(async () => {
    try {
      setLoading(true);
      const [activeReservations, maxLoansConfig] = await Promise.all([
        reservationService.getActiveReservations(),
        reservationService.getMaxLoans()
      ]);
      
      // --- MODIFICATION TÂCHE 9 (Tri par date descendante) ---
      const sorted = [...activeReservations].sort((a, b) => 
        getLatestReservationDate(b) - getLatestReservationDate(a)
      );

      setReservations(sorted);
      setMaxLoans(maxLoansConfig);
    } catch (error) {
      showNotification('error', 'Erreur lors du chargement des réservations');
    } finally {
      setLoading(false);
    }
  }, []);

  const showNotification = useCallback((type: 'success' | 'error', message: string) => {
    setNotification({ visible: true, type, message });
    setTimeout(() => setNotification(prev => ({ ...prev, visible: false })), 3000);
  }, []);

  const validateReservation = useCallback(async (
    user: ProcessedUserReservation, 
    slot: number,
    t: (key: string) => string
  ) => {
    const processingKey = `${user.email}-${slot}`;
    setProcessingItem(processingKey);
    try {
      await reservationService.validateReservationForProcessedUser(user, slot);
      
      // --- CORRECTION TÂCHE 6 (Traduction) ---
      showNotification('success', t('components:reservations.loan_success_message') || 'Emprunt enregistré avec succès.');
      
      await loadReservations();
    } catch (error) {
      showNotification('error', t('components:reservations.validation_error') || 'Erreur lors de la validation.');
    } finally {
      setProcessingItem(null);
    }
  }, [loadReservations, showNotification]);

  useEffect(() => { loadReservations(); }, [loadReservations]);

  return {
    reservations, loading, processingItem, notification,
    maxLoans, validateReservation, loadReservations, showNotification
  };
};