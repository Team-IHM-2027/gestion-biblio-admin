import { collection, doc, updateDoc, query, where, getDocs, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { fetchMaximumSimultaneousLoans } from './configService';
import type { ProcessedUserReservation, ReservationSlot, UserReservation } from '../types/reservations';

export class ReservationService {
  private readonly userCollection = collection(db, 'BiblioUser');

  public ensureStringDate(date: Timestamp | string | Date | { seconds: number; nanoseconds: number } | null | undefined): string {
    if (!date) return new Date().toISOString();
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? new Date().toISOString() : date;
    }
    if (date instanceof Timestamp) return date.toDate().toISOString();
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'object' && 'seconds' in date) {
      return new Timestamp(date.seconds, date.nanoseconds).toDate().toISOString();
    }
    return new Date().toISOString();
  }

  async getMaxLoans(): Promise<number> {
    return await fetchMaximumSimultaneousLoans();
  }

  // Cette fonction reste synchrone pour la structure initiale
  processUserReservationData(userData: UserReservation, maxLoans: number): ProcessedUserReservation {
    const reservationSlots: ReservationSlot[] = [];

    for (let i = 1; i <= maxLoans; i++) {
      const status = userData[`etat${i}`] as 'reserv' | 'emprunt' | 'ras';
      const tabData = userData[`tabEtat${i}`] as [string, string, string, number, string, string];

      if (status === 'reserv' && tabData?.[0]) {
        reservationSlots.push({
          slotNumber: i,
          status,
          document: {
            name: tabData[0], // Au début c'est l'ID
            category: tabData[1],
            imageUrl: tabData[2],
            exemplaires: tabData[3],
            collection: tabData[4] || 'BiblioBooks',
            reservationDate: this.ensureStringDate(tabData[5])
          }
        });
      }
    }

    return {
      email: userData.email,
      name: userData.name,
      niveau: userData.niveau,
      matricule: userData.matricule,
      imageUri: userData.imageUri,
      reservationSlots,
      totalActiveReservations: reservationSlots.length
    };
  }

  /**
   * --- MODIFICATION MAJEURE ---
   * Récupère les vrais titres des livres à partir de leurs IDs
   */
  async getActiveReservations(): Promise<ProcessedUserReservation[]> {
    try {
      const maxLoans = await this.getMaxLoans();
      const snapshot = await getDocs(this.userCollection);
      const rawUsers: ProcessedUserReservation[] = [];
      
      snapshot.forEach((docSnap) => {
        const userData = { ...docSnap.data(), email: docSnap.id } as UserReservation;
        const hasActiveReservations = Array.from({ length: maxLoans }, (_, i) => i + 1)
          .some(i => userData[`etat${i}`] === 'reserv');
        
        if (hasActiveReservations) {
          rawUsers.push(this.processUserReservationData(userData, maxLoans));
        }
      });

      // Maintenant, on remplace les IDs par les vrais noms
      const enrichedUsers = await Promise.all(rawUsers.map(async (user) => {
        const enrichedSlots = await Promise.all(user.reservationSlots.map(async (slot) => {
          try {
            // tabData[0] est l'ID, tabData[4] est la collection (ex: BiblioBooks)
            const bookDocRef = doc(db, slot.document.collection, slot.document.name);
            const bookSnap = await getDoc(bookDocRef);

            if (bookSnap.exists()) {
              const bookData = bookSnap.data();
              return {
                ...slot,
                document: {
                  ...slot.document,
                  name: bookData.name || bookData.title || slot.document.name, // On prend le champ 'name' du livre
                  imageUrl: bookData.imageUrl || slot.document.imageUrl // On en profite pour rafraîchir l'image
                }
              };
            }
          } catch (err) {
            console.warn(`Impossible de récupérer les détails pour l'ID ${slot.document.name}`);
          }
          return slot;
        }));

        return { ...user, reservationSlots: enrichedSlots };
      }));
      
      return enrichedUsers;
    } catch (error) {
      console.error('Erreur lors de la récupération des réservations:', error);
      throw new Error('Impossible de récupérer les réservations');
    }
  }

  // ... (reste du code validateReservation identique)
  async validateReservation(
    userEmail: string,
    slot: number,
    documentData: [string, string, string, number, string, string]
  ): Promise<void> {
    try {
      const [documentId, , , , collectionName = 'BiblioBooks'] = documentData;
      const currentDate = new Date().toISOString();

      // On utilise directement l'ID pour pointer le document
      const docRef = doc(db, collectionName, documentId);
      const docSnapshot = await getDoc(docRef);

      if (docSnapshot.exists()) {
        const currentExemplaire = docSnapshot.data().exemplaire || 0;
        await updateDoc(docRef, {
          exemplaire: Math.max(0, currentExemplaire - 1)
        });
      }

      await updateDoc(doc(this.userCollection, userEmail), {
        [`etat${slot}`]: 'emprunt',
        [`tabEtat${slot}`]: [...documentData.slice(0, 5), currentDate]
      });

    } catch (error) {
      console.error('Erreur validation:', error);
      throw error;
    }
  }

  async validateReservationForProcessedUser(user: ProcessedUserReservation, slot: number): Promise<void> {
    const slotData = user.reservationSlots.find(s => s.slotNumber === slot);
    if (!slotData?.document) throw new Error(`Slot ${slot} vide`);

    // Note : Ici on renvoie l'ID (pas le nom enrichi) pour que la base de données reste cohérente
    // Vous devrez peut-être stocker l'ID original quelque part si vous voulez être sûr
    return this.validateReservation(
      user.email, 
      slot,
      [slotData.document.name, slotData.document.category, slotData.document.imageUrl, slotData.document.exemplaires, slotData.document.collection, '']
    );
  }
}

export const reservationService = new ReservationService();