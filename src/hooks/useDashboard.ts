import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore'; // Importé pour récupérer les noms
import { db } from '../config/firebase'; // Importé pour la connexion base de données
import { dashboardService } from '../services/dashboardService';
import type { DashboardStats } from '../types/dashboard';

export const useDashboard = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalBooks: 0,
    totalTheses: 0,
    booksByCathegorie: {},
    thesesByDepartment: {},
    totalStudents: 0,
    suspendedStudents: 0,
    totalReservations: 0,
    borrowedDocuments: 0,
    returnedDocuments: 0,
    monthlyBorrows: [],
    departmentBorrowStats: [],
    totalEmprunts: 0,
    empruntsByDepartment: {},
    totalBookExemplaires: 0,
    availableExemplaires: 0,
    reservedNotPickedUp: 0,
    topBorrowedBooks: [],
    lowStockBooks: [],
    currentWeekBorrows: [],
    recentlyReturnedBooks: [],
    reservationToBorrowRatio: 0
  });

  const [loading, setLoading] = useState(true);

  const updateStats = useCallback((newStats: Partial<DashboardStats>) => {
    setStats(prevStats => ({ ...prevStats, ...newStats }));
  }, []);

  // Fonction utilitaire pour récupérer le nom d'un livre à partir de son ID
  const getBookName = async (bookId: string): Promise<string> => {
    if (!bookId || bookId === 'ras') return 'Document inconnu';
    try {
      const bookDocRef = doc(db, 'BiblioBooks', bookId);
      const bookSnap = await getDoc(bookDocRef);
      if (bookSnap.exists()) {
        const data = bookSnap.data();
        return data.name || data.title || bookId;
      }
      return bookId;
    } catch (error) {
      return bookId;
    }
  };

  const loadAsyncData = useCallback(async () => {
    try {
      const [rawTopBooks, currentWeekBorrows, rawReturnedBooks] = await Promise.all([
        dashboardService.getTopBorrowedBooks(),
        dashboardService.getCurrentWeekBorrows(),
        dashboardService.getRecentlyReturnedBooks()
      ]);

      // Enrichissement des Livres Récemment Retournés (Conversion ID -> Nom)
      const recentlyReturnedBooks = await Promise.all(
        rawReturnedBooks.map(async (record: any) => ({
          ...record,
          titre: await getBookName(record.titre)
        }))
      );

      // Enrichissement du Top 5 des Livres (Conversion ID -> Nom)
      const topBorrowedBooks = await Promise.all(
        rawTopBooks.map(async (book: any) => ({
          ...book,
          name: await getBookName(book.name)
        }))
      );

      updateStats({
        topBorrowedBooks,
        currentWeekBorrows,
        recentlyReturnedBooks
      });
    } catch (error) {
      console.error('Erreur lors du chargement des données asynchrones:', error);
    }
  }, [updateStats]);

  useEffect(() => {
    let unsubscribeMemories: (() => void) | undefined;
    let unsubscribeBooks: (() => void) | undefined;
    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeArchives: (() => void) | undefined;

    const initializeData = async () => {
      try {
        setLoading(true);
        unsubscribeMemories = dashboardService.subscribeToMemoriesStats(updateStats);
        unsubscribeBooks = dashboardService.subscribeToBooksStats(updateStats);
        unsubscribeUsers = dashboardService.subscribeToUsersStats(updateStats);
        unsubscribeArchives = dashboardService.subscribeToMonthlyBorrows(updateStats);

        await loadAsyncData();
        setLoading(false);
      } catch (error) {
        console.error('Erreur lors de l\'initialisation du dashboard:', error);
        setLoading(false);
      }
    };

    initializeData();

    return () => {
      if (unsubscribeMemories) unsubscribeMemories();
      if (unsubscribeBooks) unsubscribeBooks();
      if (unsubscribeUsers) unsubscribeUsers();
      if (unsubscribeArchives) unsubscribeArchives();
    };
  }, [updateStats, loadAsyncData]);

  const physicallyPresentBooks = stats.totalBookExemplaires - stats.borrowedDocuments;

  return {
    stats: { ...stats, physicallyPresentBooks },
    loading,
    refreshData: loadAsyncData
  };
};