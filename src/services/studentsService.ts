// src/services/studentsService.ts
import {
  collection,
  doc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDoc
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';
import { db } from '../config/firebase';
import type {
  Student,
  StudentsFilters,
  StudentsStats,
  StudentSearchFilters,
  StudentBulkAction
} from '../types/students';
import { notificationService } from './notificationService'; // adjust path if needed

export class StudentsService {
  private readonly collection = 'BiblioUser';

  // Récupérer tous les étudiants avec écoute en temps réel
  subscribeToStudents(
    callback: (students: Student[]) => void,
    errorCallback?: (error: Error) => void
  ) {
    try {
      const studentsRef = collection(db, this.collection);

      return onSnapshot(studentsRef, (querySnapshot) => {
        const students: Student[] = [];
        querySnapshot.forEach((doc) => {
          students.push({
            id: doc.id,
            ...doc.data()
          } as Student);
        });
        callback(students);
      }, (error) => {
        console.error('Erreur lors de l\'écoute des étudiants:', error);
        errorCallback?.(error);
      });
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de l\'écoute:', error);
      errorCallback?.(error as Error);
    }
  }

  // Récupérer les étudiants avec pagination
  async getStudentsPaginated(
    pageSize: number = 10,
    lastDoc?: any,
    filters?: StudentsFilters
  ): Promise<{ students: Student[]; lastDoc: any; hasMore: boolean }> {
    try {
      const studentsRef = collection(db, this.collection);

      // Construire les contraintes séparément
      const whereConstraints = [];
      const orderConstraints = [orderBy('heure', 'desc')];
      const limitConstraints = [limit(pageSize)];
      const paginationConstraints = [];

      // Appliquer les filtres where
      if (filters?.status && filters.status !== 'all') {
        whereConstraints.push(where('etat', '==', filters.status));
      }

      if (filters?.level) {
        whereConstraints.push(where('niveau', '==', filters.level));
      }

      if (filters?.department) {
        whereConstraints.push(where('department', '==', filters.department));
      }

      // Pagination
      if (lastDoc) {
        paginationConstraints.push(startAfter(lastDoc));
      }

      // Combiner toutes les contraintes dans l'ordre correct
      const allConstraints = [
        ...whereConstraints,
        ...orderConstraints,
        ...paginationConstraints,
        ...limitConstraints
      ];

      const studentsQuery = query(studentsRef, ...allConstraints);
      const querySnapshot = await getDocs(studentsQuery);

      const students: Student[] = [];
      querySnapshot.forEach((doc) => {
        students.push({
          id: doc.id,
          ...doc.data()
        } as Student);
      });

      const lastDocument = querySnapshot.docs[querySnapshot.docs.length - 1];
      const hasMore = querySnapshot.docs.length === pageSize;

      return {
        students,
        lastDoc: lastDocument,
        hasMore
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error);
      throw error;
    }
  }

  // Rechercher des étudiants
  async searchStudents(filters: StudentSearchFilters): Promise<Student[]> {
    try {
      const studentsRef = collection(db, this.collection);
      const whereConstraints = [];

      // Ajouter les filtres where
      if (filters.status) {
        whereConstraints.push(where('etat', '==', filters.status));
      }

      if (filters.level) {
        whereConstraints.push(where('niveau', '==', filters.level));
      }

      if (filters.department) {
        whereConstraints.push(where('department', '==', filters.department));
      }

      // Construire la query avec ou sans contraintes
      const studentsQuery = whereConstraints.length > 0
        ? query(studentsRef, ...whereConstraints)
        : studentsRef;

      const querySnapshot = await getDocs(studentsQuery);
      const students: Student[] = [];

      querySnapshot.forEach((doc) => {
        const studentData = {
          id: doc.id,
          ...doc.data()
        } as Student;

        // Filtrer par recherche textuelle côté client
        if (filters.query) {
          const searchTerm = filters.query.toLowerCase();
          const matchesSearch =
            studentData.name?.toLowerCase().includes(searchTerm) ||
            studentData.email?.toLowerCase().includes(searchTerm) ||
            studentData.matricule?.toLowerCase().includes(searchTerm);

          if (matchesSearch) {
            students.push(studentData);
          }
        } else {
          students.push(studentData);
        }
      });

      return students;
    } catch (error) {
      console.error('Erreur lors de la recherche d\'étudiants:', error);
      throw error;
    }
  }

  // Mettre à jour le statut d'un étudiant
  async updateStudentStatus(
    studentId: string,
    newStatus: 'ras' | 'bloc',
    librarianMessage?: string
  ): Promise<void> {
    try {
      const studentRef = doc(db, this.collection, studentId);

      // Read current student document to check existence and previous state
      const studentSnap = await getDoc(studentRef);
      if (!studentSnap.exists()) {
        throw new Error('Étudiant non trouvé');
      }

      const studentData = studentSnap.data();
      const prevEtat = studentData.etat;

      // Update status and store reason + timestamp for the Cloud Function to use
      await updateDoc(studentRef, {
        etat: newStatus,
        updated_at: new Date(),
        blockedAt: newStatus === 'bloc' ? new Date() : null,
        blockedReason: newStatus === 'bloc' ? (librarianMessage || '') : null
      });

      // Create an in-app notification for the user (so they see it in-app)
      try {
        const title = newStatus === 'bloc' ? '⚠️ Compte bloqué' : '✅ Compte débloqué';
        const message =
          newStatus === 'bloc'
            ? `Votre compte a été bloqué. ${librarianMessage ? `Raison: ${librarianMessage}` : ''}`
            : 'Votre compte a été débloqué. Vous pouvez maintenant vous connecter.';
        
        // Use the NotificationService to add a user notification (client-side notifications)
        await notificationService.sendSimpleNotification(
          studentId, // userId (in your app email is used as id)
          newStatus === 'bloc' ? 'warning' : 'success',
          title,
          message
        );
      } catch (notifError) {
        console.warn('Erreur lors de la création de la notification in-app:', notifError);
      }

      // Note: The Cloud Function `onUserStatusChange` will send the email automatically,
      // since it is triggered by updates to BiblioUser/{userId} and uses `blockedReason`.
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  }

  // Mettre à jour les informations d'un étudiant
  async updateStudent(studentId: string, updates: Partial<Student>): Promise<void> {
    try {
      const studentRef = doc(db, this.collection, studentId);
      await updateDoc(studentRef, {
        ...updates,
        updated_at: new Date()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'étudiant:', error);
      throw error;
    }
  }

  // Supprimer un étudiant
  async deleteStudent(studentId: string): Promise<void> {
    try {
      const studentRef = doc(db, this.collection, studentId);
      await deleteDoc(studentRef);
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'étudiant:', error);
      throw error;
    }
  }

  // Actions en lot
  async bulkAction(action: StudentBulkAction): Promise<void> {
    try {
      const promises = action.studentIds.map(async (studentId) => {
        const studentRef = doc(db, this.collection, studentId);

        switch (action.action) {
          case 'block':
            return updateDoc(studentRef, { etat: 'bloc', updated_at: new Date() });
          case 'unblock':
            return updateDoc(studentRef, { etat: 'ras', updated_at: new Date() });
          case 'delete':
            return deleteDoc(studentRef);
          default:
            throw new Error(`Action non supportée: ${action.action}`);
        }
      });

      await Promise.all(promises);
    } catch (error) {
      console.error('Erreur lors de l\'action en lot:', error);
      throw error;
    }
  }

  // Récupérer les statistiques des étudiants
  async getStudentsStats(): Promise<StudentsStats> {
    try {
      const studentsSnapshot = await getDocs(collection(db, this.collection));
      const students: Student[] = [];

      studentsSnapshot.forEach((doc) => {
        students.push(doc.data() as Student);
      });

      const stats: StudentsStats = {
        total: students.length,
        active: students.filter(s => s.etat === 'ras').length,
        blocked: students.filter(s => s.etat === 'bloc').length,
        byLevel: {},
        byDepartment: {},
        recentRegistrations: 0
      };

      // Statistiques par niveau
      students.forEach(student => {
        if (student.niveau) {
          stats.byLevel[student.niveau] = (stats.byLevel[student.niveau] || 0) + 1;
        }
        if (student.department) {
          stats.byDepartment[student.department] = (stats.byDepartment[student.department] || 0) + 1;
        }
      });

      // Inscriptions récentes (derniers 30 jours)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      stats.recentRegistrations = students.filter(student => {
        const registrationDate = new Date(student.heure);
        return registrationDate >= thirtyDaysAgo;
      }).length;

      return stats;
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      throw error;
    }
  }

  // Récupérer un étudiant par ID
  async getStudentById(studentId: string): Promise<Student | null> {
    try {
      const studentDoc = await getDoc(doc(db, this.collection, studentId));

      if (!studentDoc.exists()) {
        return null;
      }

      return {
        id: studentDoc.id,
        ...studentDoc.data()
      } as Student;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'étudiant:', error);
      throw error;
    }
  }

  // Exporter les données des étudiants
  async exportStudents(filters?: StudentsFilters): Promise<Student[]> {
    try {
      let students: Student[] = [];

      if (filters) {
        students = await this.searchStudents({
          query: filters.search,
          status: filters.status !== 'all' ? filters.status : undefined,
          level: filters.level,
          department: filters.department
        });
      } else {
        const studentsSnapshot = await getDocs(collection(db, this.collection));
        studentsSnapshot.forEach((doc) => {
          students.push({
            id: doc.id,
            ...doc.data()
          } as Student);
        });
      }

      return students;
    } catch (error) {
      console.error('Erreur lors de l\'exportation:', error);
      throw error;
    }
  }

  // Filtrer et trier les étudiants
  filterAndSortStudents(
    students: Student[],
    filters: StudentsFilters
  ): Student[] {
    let filtered = [...students];

    // Filtrage par recherche
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      filtered = filtered.filter(student =>
        student.name?.toLowerCase().includes(searchTerm) ||
        student.email?.toLowerCase().includes(searchTerm) ||
        student.matricule?.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrage par statut
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(student => student.etat === filters.status);
    }

    // Filtrage par niveau
    if (filters.level) {
      filtered = filtered.filter(student => student.niveau === filters.level);
    }

    // Filtrage par département
    if (filters.department) {
      filtered = filtered.filter(student => student.department === filters.department);
    }

    // Tri
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'level':
          return a.niveau.localeCompare(b.niveau);
        case 'recent':
          return new Date(b.heure).getTime() - new Date(a.heure).getTime();
        case 'old':
          return new Date(a.heure).getTime() - new Date(b.heure).getTime();
        default:
          return 0;
      }
    });

    return filtered;
  }
}

// Instance singleton
export const studentsService = new StudentsService();