// services/loanService.ts
import { collection, doc, updateDoc, arrayUnion, getDocs, getDoc, query, where, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { notificationService } from './notificationService';
import type { UserLoan, ProcessedUserLoan, UserLoanSlot } from '../types';
import { fetchMaximumSimultaneousLoans } from './configService';

export class LoanService {
  private userCollection = collection(db, 'BiblioUser');
  private archiveCollection = collection(db, 'ArchivesBiblio');

  // Récupérer le nombre maximum d'emprunts
  async getMaxLoans(): Promise<number> {
    return await fetchMaximumSimultaneousLoans();
  }

  // Traiter les données utilisateur pour extraire les slots actifs
  processUserLoanData(userData: UserLoan, maxLoans: number): ProcessedUserLoan {
    const activeSlots: UserLoanSlot[] = [];

    for (let i = 1; i <= maxLoans; i++) {
      const etatKey = `etat${i}`;
      const tabKey = `tabEtat${i}`;

      const status = userData[etatKey] as 'emprunt' | 'ras';
      const tabData = userData[tabKey] as any[];

      if (status === 'emprunt' && tabData && Array.isArray(tabData) && tabData[0]) {
        let id, name, category, imageUrl, exemplaires, collection, borrowDate;

        if (typeof tabData[3] === 'number') {
          // Ancien format: [Name, Category, ImageUrl, Exemplaires, Collection, BorrowDate]
          // On utilise Name comme ID par défaut
          id = tabData[0];
          name = tabData[0];
          category = tabData[1];
          imageUrl = tabData[2];
          exemplaires = Number(tabData[3]);
          collection = tabData[4];
          borrowDate = tabData[5];
        } else {
          // Nouveau format (ReservationService): [Id, Name, Category, ImageUrl, Collection, BorrowDate, Exemplaires]
          id = tabData[0];
          name = tabData[1];
          category = tabData[2];
          imageUrl = tabData[3];
          collection = tabData[4];
          borrowDate = tabData[5];
          exemplaires = Number(tabData[6]);
        }

        activeSlots.push({
          slotNumber: i,
          status: 'emprunt',
          document: {
            id,
            name,
            category,
            imageUrl,
            exemplaires,
            collection,
            borrowDate
          }
        });
      }
    }

    return {
      email: userData.email,
      name: userData.name,
      niveau: userData.niveau,
      imageUri: userData.imageUri,
      activeSlots,
      totalActiveLoans: activeSlots.length
    };
  }

  // Récupérer tous les emprunts actifs
  async getActiveLoans(): Promise<ProcessedUserLoan[]> {
    try {
      const maxLoans = await this.getMaxLoans();
      const snapshot = await getDocs(this.userCollection);
      const users: ProcessedUserLoan[] = [];

      snapshot.forEach((docSnap) => {
        const userData = { ...docSnap.data(), email: docSnap.id } as UserLoan;
        let hasActiveLoans = false;
        for (let i = 1; i <= maxLoans; i++) {
          if (userData[`etat${i}`] === 'emprunt') {
            hasActiveLoans = true;
            break;
          }
        }
        if (hasActiveLoans) {
          const processedUser = this.processUserLoanData(userData, maxLoans);
          users.push(processedUser);
        }
      });

      return users;
    } catch (error) {
      console.error('Erreur lors de la récupération des emprunts:', error);
      throw new Error('Impossible de récupérer les emprunts');
    }
  }

  // Obtenir les données d'un document pour un slot donné
  async getDocumentDataForSlot(userEmail: string, slot: number): Promise<any[] | null> {
    try {
      const userRef = doc(this.userCollection, userEmail);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return null;

      const userData = userSnap.data() as UserLoan;
      const tabKey = `tabEtat${slot}`;
      const tabData = userData[tabKey];

      return Array.isArray(tabData) ? (tabData as any[]) : null;
    } catch (error) {
      console.error('Erreur lors de la récupération des données du document:', error);
      return null;
    }
  }

  // Ajouter à l'archive
  private async addToArchive(studentName: string, documentName: string): Promise<void> {
    try {
      const archiveRef = doc(this.archiveCollection, 'Arch');
      const currentDate = new Date().toISOString().slice(0, 25);

      await updateDoc(archiveRef, {
        tableauArchives: arrayUnion({
          nomEtudiant: studentName,
          nomDoc: documentName,
          heure: currentDate
        })
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout à l\'archive:', error);
      throw new Error('Impossible d\'ajouter à l\'archive');
    }
  }

  async returnDocument(
    userEmail: string,
    documentSlot: number,
    documentData: any[],
    userName: string
  ): Promise<void> {
    try {
      const documentId = documentData[0];
      const collectionName = 'BiblioBooks';

      // 1. Tenter l'accès direct via ID
      let docSnap = await getDoc(doc(db, collectionName, documentId));
      let finalDocId = documentId;

      // 2. Fallback: recherche par nom si l'ID direct échoue (cas fréquent des emprunts mobile)
      if (!docSnap.exists()) {
        console.log(`[loanService] Document ID "${documentId}" non trouvé. Tentative de recherche par nom...`);
        const q = query(collection(db, collectionName), where('name', '==', documentId));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          docSnap = querySnapshot.docs[0];
          finalDocId = docSnap.id;
          console.log(`[loanService] Document trouvé par nom. Nouvel ID: ${finalDocId}`);
        } else {
          throw new Error(`Document "${documentId}" introuvable dans la collection ${collectionName}`);
        }
      }

      // Mettre à jour le nombre d'exemplaires
      const currentBookData = docSnap.data() as any;
      const currentExemplaires = Number(currentBookData.exemplaire || 0);

      await updateDoc(doc(db, collectionName, finalDocId), { exemplaire: currentExemplaires + 1 });

      // Ajouter à l'archive
      await this.addToArchive(userName, finalDocId);

      // Mettre à jour l'état de l'utilisateur
      const userRef = doc(this.userCollection, userEmail);
      const updateData: any = {};
      updateData[`etat${documentSlot}`] = 'ras';
      updateData[`tabEtat${documentSlot}`] = ['', '', '', 0, '', ''];
      await updateDoc(userRef, updateData);

      // Sync with global Emprunts collection
      try {
        const globalEmpruntsRef = collection(db, 'Emprunts');
        const q = query(
          globalEmpruntsRef,
          where('userId', '==', userEmail),
          where('livreId', '==', documentId)
        );
        const querySnapshot = await getDocs(q);
        const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);
        console.log(`✅ Emprunt synchronisé et supprimé de la collection globale pour ${userEmail}`);
      } catch (syncError) {
        console.warn('⚠️ Erreur lors de la synchronisation de la collection Emprunts:', syncError);
      }

      // Send return notification
      try {
        const bookTitle = documentData[1] || 'Livre'; // Try index 1, fallback to 'Livre'
        await notificationService.sendLoanReturned(
          userEmail, // Using email as ID
          documentId,
          bookTitle,
          "Bibliothécaire"
        );
      } catch (notifyError) {
        console.error("Failed to send return notification:", notifyError);
      }

    } catch (error) {
      console.error('Erreur lors du retour du document:', error);
      throw error;
    }
  }

  // Retourner document pour un slot donné d'un utilisateur traité
  async returnDocumentForProcessedUser(user: ProcessedUserLoan, slot: number): Promise<void> {
    const slotData = user.activeSlots.find(s => s.slotNumber === slot);
    if (!slotData || !slotData.document) throw new Error(`Aucun document emprunté trouvé dans le slot ${slot}`);

    // Reconstruction des données au format attendu (Nouveau format)
    const documentData: any[] = [
      slotData.document.id,
      slotData.document.name,
      slotData.document.category,
      slotData.document.imageUrl,
      slotData.document.collection,
      slotData.document.borrowDate,
      slotData.document.exemplaires
    ];

    return this.returnDocument(user.email, slot, documentData, user.name);
  }

  // Statistiques
  async getLoanStatistics(): Promise<{
    totalActiveLoans: number;
    totalUsers: number;
    averageLoansPerUser: number;
    maxLoansAllowed: number;
  }> {
    try {
      const maxLoans = await this.getMaxLoans();
      const users = await this.getActiveLoans();
      const totalActiveLoans = users.reduce((total, user) => total + user.totalActiveLoans, 0);

      return {
        totalActiveLoans,
        totalUsers: users.length,
        averageLoansPerUser: users.length > 0 ? totalActiveLoans / users.length : 0,
        maxLoansAllowed: maxLoans
      };
    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
      return { totalActiveLoans: 0, totalUsers: 0, averageLoansPerUser: 0, maxLoansAllowed: 3 };
    }
  }

  // Vérifier si un utilisateur peut emprunter
  async canUserBorrow(userEmail: string): Promise<{ canBorrow: boolean; reason?: string }> {
    try {
      const maxLoans = await this.getMaxLoans();
      const userRef = doc(this.userCollection, userEmail);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return { canBorrow: false, reason: 'Utilisateur non trouvé' };

      const userData = userSnap.data() as UserLoan;
      const currentLoans = Array.from({ length: maxLoans }, (_, i) => userData[`etat${i + 1}`]).filter(e => e === 'emprunt').length;

      if (currentLoans >= maxLoans) return { canBorrow: false, reason: `Limite de ${maxLoans} emprunts simultanés atteinte (${currentLoans}/${maxLoans})` };
      return { canBorrow: true };
    } catch (error) {
      console.error('Erreur lors de la vérification des emprunts:', error);
      return { canBorrow: false, reason: 'Erreur lors de la vérification' };
    }
  }

  // Trouver slot libre
  async findNextAvailableSlot(userEmail: string): Promise<number | null> {
    try {
      const maxLoans = await this.getMaxLoans();
      const userRef = doc(this.userCollection, userEmail);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) return null;

      const userData = userSnap.data() as UserLoan;
      for (let i = 1; i <= maxLoans; i++) if (userData[`etat${i}`] !== 'emprunt') return i;
      return null;
    } catch (error) {
      console.error('Erreur lors de la recherche de slot libre:', error);
      return null;
    }
  }

  // Vérifier les retards et envoyer des notifications de pénalité
  async checkOverdueLoans(): Promise<void> {
    try {
      const users = await this.getActiveLoans();
      const now = new Date();
      // const threeDaysInMillis = 3 * 24 * 60 * 60 * 1000;
      const threeDaysInMillis = 10 * 60 * 1000;

      for (const user of users) {
        for (const slot of user.activeSlots) {
          // Clean up date string if needed
          // Optional check for document just in case
          if (!slot.document) continue;

          const loanDateStr = slot.document.borrowDate;
          // Ensure loanDate is valid
          if (!loanDateStr) continue;

          const loanDate = new Date(loanDateStr);
          if (isNaN(loanDate.getTime())) continue;

          const timeDiff = now.getTime() - loanDate.getTime();

          if (timeDiff > threeDaysInMillis) {
            const daysOverdue = Math.floor((timeDiff - threeDaysInMillis) / (24 * 60 * 60 * 1000));
            // Amount = 100 FCFA * daysOverdue (starting at 1 day)
            const amount = 100 * (Math.max(1, daysOverdue));

            // TODO: Implement deduplication to prevent spamming (e.g., check last notification date)
            // For now, we rely on the caller to call this sparingly or on a specific event

            await notificationService.sendPenaltyNotification(
              user.email,
              slot.document.id,
              slot.document.name || 'Livre',
              Math.max(1, daysOverdue),
              amount
            );
            console.log(`Penalty notification sent to ${user.email} for ${slot.document.name}`);
          }
        }
      }
    } catch (error) {
      console.error("Error checking overdue loans:", error);
    }
  }
}

// Instance singleton
export const loanService = new LoanService();
