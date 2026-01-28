import { collection, doc, updateDoc, query, where, getDocs, getDoc, Timestamp, arrayUnion, addDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { notificationService } from './notificationService';
import { fetchMaximumSimultaneousLoans } from './configService';
import type { ProcessedUserReservation, ReservationSlot, UserReservation } from '../types/reservations';

export class ReservationService {
    private readonly userCollection = collection(db, 'BiblioUser');
    //private readonly booksCollection = collection(db, 'BiblioBooks');

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

    processUserReservationData(userData: UserReservation, maxLoans: number, statusFilter: string = 'reserv'): ProcessedUserReservation {
        const reservationSlots: ReservationSlot[] = [];

        for (let i = 1; i <= maxLoans; i++) {
            const status = userData[`etat${i}`] as 'reserv' | 'emprunt' | 'ras' | 'valide';
            const tabData = userData[`tabEtat${i}`] as [string, string, string, string, string, string, number] | any[];

            if (status === statusFilter && tabData?.[0]) {
                reservationSlots.push({
                    slotNumber: i,
                    status,
                    document: {
                        id: tabData[0], // C'est l'ID du livre
                        name: tabData[1] || tabData[0], // Le nom (tabData[1] dans votre structure)
                        category: tabData[2] || tabData[1] || 'General',
                        imageUrl: tabData[3] || tabData[2] || '',
                        collection: tabData[4] || 'BiblioBooks',
                        reservationDate: this.ensureStringDate(tabData[5]),
                        exemplaires: tabData[6] || 1
                    }
                });
            }
        }

        return {
            email: userData.email,
            name: userData.name,
            niveau: userData.niveau,
            matricule: userData.matricule,
            imageUri: userData.profilePicture || userData.imageUri,
            reservationSlots,
            totalActiveReservations: reservationSlots.length
        };
    }

    async getActiveReservations(statusFilter: string = 'reserv'): Promise<ProcessedUserReservation[]> {
        try {
            const maxLoans = await this.getMaxLoans();
            const snapshot = await getDocs(this.userCollection);
            const rawUsers: ProcessedUserReservation[] = [];

            snapshot.forEach((docSnap) => {
                const userData = { ...docSnap.data(), email: docSnap.id } as UserReservation; // Cast to UserReservation
                const hasActiveReservations = Array.from({ length: maxLoans }, (_, i) => i + 1)
                    .some(i => userData[`etat${i}`] === statusFilter);

                if (hasActiveReservations) {
                    rawUsers.push(this.processUserReservationData(userData as UserReservation, maxLoans, statusFilter));
                }
            });

            // Enrichir avec les vraies données des livres
            const enrichedUsers = await Promise.all(rawUsers.map(async (user) => {
                const enrichedSlots = await Promise.all(user.reservationSlots.map(async (slot) => {
                    try {
                        const bookDocRef = doc(db, slot.document.collection, slot.document.id);
                        const bookSnap = await getDoc(bookDocRef);

                        if (bookSnap.exists()) {
                            const bookData = bookSnap.data();
                            return {
                                ...slot,
                                document: {
                                    ...slot.document,
                                    name: bookData.name || slot.document.name,
                                    author: bookData.auteur,
                                    exemplaires: bookData.exemplaire,
                                    category: bookData.cathegorie || slot.document.category,
                                    imageUrl: bookData.image || slot.document.imageUrl
                                }
                            };
                        }
                    } catch (err) {
                        console.warn(`Impossible de récupérer les détails pour ${slot.document.id}:`, err);
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

    /**
     * Valide une réservation (change de 'reserv' à 'emprunt')
     * NE PAS réduire les exemplaires (déjà fait lors de la réservation)
     */
    async validateReservation(
        userEmail: string,
        slot: number,
        documentData: [string, string, string, string, string, string, number] // Adjusted for your structure
    ): Promise<void> {
        try {
            const [bookId, bookName, , , collectionName] = documentData;  // Use commas to skip unused variables
            const currentDate = new Date().toISOString();

            const userRef = doc(this.userCollection, userEmail);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                throw new Error('Utilisateur non trouvé');
            }

            // 1. Mettre à jour l'état de l'utilisateur
            await updateDoc(userRef, {
                [`etat${slot}`]: 'emprunt',
                [`tabEtat${slot}`]: [...documentData.slice(0, 5), currentDate, documentData[6]] // Garder les données, mettre à jour date et exemplaires
            });

            // 2. Mettre à jour le array reservations
            const userData = userSnap.data();
            const reservations = userData.reservations || [];

            // Trouver la réservation correspondante
            const updatedReservations = reservations.map((res: any) => {
                if (res.bookId === bookId && res.nomBD === collectionName) {
                    return {
                        ...res,
                        etat: 'emprunt',
                        dateEmprunt: new Date().toISOString(),
                        validatedBy: 'librarian' // Vous pouvez ajouter l'email du bibliothécaire
                    };
                }
                return res;
            });

            // Prepare Notification
            const approvalNotification = {
                id: `notif_approval_${Date.now()}`,
                type: 'reservation_approved',
                title: 'Réservation approuvée', // Using hardcoded simplified text as we don't have 't' here
                message: `Le livre "${bookName}" est prêt à être retiré!`,
                date: Timestamp.now(),
                read: false,
                bookId: bookId,
                bookTitle: bookName,
            };

            await updateDoc(userRef, {
                reservations: updatedReservations,
                notifications: arrayUnion(approvalNotification)
            });

            // 3. OPTIONNEL: Mettre à jour un champ dans le livre si nécessaire
            // (Mais ne PAS toucher à exemplaire car déjà déduit)
            const bookRef = doc(db, collectionName, bookId);
            const bookSnap = await getDoc(bookRef);

            if (bookSnap.exists()) {
                bookSnap.data();
                // Vous pouvez ajouter un champ de statut si vous voulez
                await updateDoc(bookRef, {
                    // Optionnel: marquer comme emprunté sans changer le compteur
                    lastBorrowed: new Date().toISOString(),
                    // ou créer un sous-collection pour le suivi
                });
            }


            // Send notification with 5-minute warning (Demo mode)
            const dueDate = new Date();
            dueDate.setTime(dueDate.getTime() + 5 * 60 * 1000); // 5 minutes

            await notificationService.sendLoanValidated(
                userEmail,
                bookId,
                bookName,
                dueDate,
                "Bibliothécaire"
            );

            // Update librarian notification to COMPLETED
            const notifId = await notificationService.findLibrarianNotification(userEmail, bookId);
            if (notifId) {
                await notificationService.updateReservationStatus(notifId, 'completed', true);
            }

            // Sync with global collections: Remove from Reservations and Add to Emprunts
            try {
                // 1. Remove from global Reservations
                const globalResRef = collection(db, 'Reservations');
                const qRes = query(globalResRef, where('userId', '==', userEmail), where('livreId', '==', bookId));
                const resSnap = await getDocs(qRes);
                const deletePromises = resSnap.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);

                // 2. Add to global Emprunts
                const globalLoansRef = collection(db, 'Emprunts');
                await addDoc(globalLoansRef, {
                    userId: userEmail,
                    livreId: bookId,
                    nomLivre: bookName,
                    startDate: Timestamp.now(),
                    endDate: Timestamp.fromDate(dueDate),
                    status: 'emprunt'
                });
                console.log(`✅ Collections globales synchronisées pour l'emprunt de ${userEmail}`);
            } catch (syncError) {
                console.warn('⚠️ Erreur synchronisation collections globales (emprunt):', syncError);
            }

            console.log(`✅ Réservation validée pour ${userEmail}, slot ${slot}`);
        } catch (error) {
            console.error('Erreur validation:', error);
            throw error;
        }
    }

    /**
     * Version simplifiée pour l'interface utilisateur
     */
    async validateReservationForProcessedUser(user: ProcessedUserReservation, slot: number): Promise<void> {
        const slotData = user.reservationSlots.find(s => s.slotNumber === slot);
        if (!slotData?.document) throw new Error(`Slot ${slot} vide`);

        return this.validateReservation(
            user.email,
            slot,
            [
                slotData.document.id,           // bookId
                slotData.document.name,         // bookName
                slotData.document.category,     // category
                slotData.document.imageUrl,     // imageUrl
                slotData.document.collection,   // collectionName
                slotData.document.reservationDate, // original reservation date (or previous date)
                slotData.document.exemplaires   // exemplaires count
            ]
        );
    }

    /**
     * REJETER une réservation (doit RESTAURER les exemplaires)
     */
    async rejectReservation(
        userEmail: string,
        slot: number,
        bookId: string,
        collectionName: string = 'BiblioBooks',
        reason: string = 'Réservation rejetée'
    ): Promise<void> {
        try {
            const userRef = doc(this.userCollection, userEmail);
            const bookRef = doc(db, collectionName, bookId);

            // 1. Restaurer les exemplaires du livre
            const bookSnap = await getDoc(bookRef);
            // Fallback for bookName if we can't get it from doc easily without extra read,
            // but for notification we might want it.
            let bookName = 'Livre';
            if (bookSnap.exists()) {
                const bookData = bookSnap.data();
                bookName = bookData.name || bookName;
                const currentCopies = bookData.exemplaire || 0;
                await updateDoc(bookRef, {
                    exemplaire: currentCopies + 1
                });
            }

            // 2. Réinitialiser le slot utilisateur
            await updateDoc(userRef, {
                [`etat${slot}`]: 'ras',
                [`tabEtat${slot}`]: []
            });

            // 3. Supprimer de l'array reservations and Add Notification
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data();
                const reservations = userData.reservations || [];
                const filteredReservations = reservations.filter((res: any) =>
                    !(res.bookId === bookId && res.nomBD === collectionName)
                );

                // Prepare Rejection Notification
                const rejectionNotification = {
                    id: `notif_reject_${Date.now()}`,
                    type: 'reservation_rejected',
                    title: 'Réservation refusée',
                    message: `Votre réservation pour "${bookName}" a été refusée. ${reason}`,
                    date: Timestamp.now(),
                    read: false,
                    bookId: bookId,
                    bookTitle: bookName,
                };

                await updateDoc(userRef, {
                    reservations: filteredReservations,
                    notifications: arrayUnion(rejectionNotification)
                });
            }

            console.log(`❌ Réservation rejetée pour ${userEmail}, slot ${slot}`);

        } catch (error) {
            console.error('Erreur rejet:', error);
            throw error;
        }
    }

    /**
     * APPROUVER une réservation (change de 'reserv' à 'valide')
     * Signifie que le livre est mis de côté et prêt à être retiré.
     */
    async approveReservation(
        user: ProcessedUserReservation,
        slot: number
    ): Promise<void> {
        const slotData = user.reservationSlots.find(s => s.slotNumber === slot);
        if (!slotData?.document) throw new Error(`Slot ${slot} vide`);

        const documentData = [
            slotData.document.id,
            slotData.document.name,
            slotData.document.category,
            slotData.document.imageUrl,
            slotData.document.collection,
            slotData.document.reservationDate,
            slotData.document.exemplaires
        ];

        try {
            const userRef = doc(this.userCollection, user.email);

            // 1. Mettre à jour l'état de l'utilisateur vers 'valide'
            await updateDoc(userRef, {
                [`etat${slot}`]: 'valide',
                [`tabEtat${slot}`]: documentData
            });

            // 2. Notification (Optionnel : notifier que la demande est validée et le livre est mis de coté)
            const approvalNotification = {
                id: `notif_ready_${Date.now()}`,
                type: 'reservation_ready',
                title: 'Réservation validée',
                message: `Le livre "${slotData.document.name}" a été mis de côté. Vous pouvez passer le récupérer.`,
                date: Timestamp.now(),
                read: false,
                bookId: slotData.document.id,
                bookTitle: slotData.document.name,
            };

            await updateDoc(userRef, {
                notifications: arrayUnion(approvalNotification)
            });

            // Also send a formal reservation update notification via service
            await notificationService.sendReservationUpdate(
                user.email,
                slotData.document.id,
                slotData.document.name,
                'approved',
                'Votre livre est prêt à être récupéré.',
                'Bibliothécaire'
            );

            // Update librarian notification to READY_FOR_PICKUP (still counts as pending in bell)
            const notifId = await notificationService.findLibrarianNotification(user.email, slotData.document.id);
            if (notifId) {
                await notificationService.updateReservationStatus(notifId, 'ready_for_pickup', false);
            }

            // Sync with global Reservations collection
            try {
                const globalResRef = collection(db, 'Reservations');
                const q = query(globalResRef, where('userId', '==', user.email), where('livreId', '==', slotData.document.id));
                const querySnapshot = await getDocs(q);
                const updatePromises = querySnapshot.docs.map(d => updateDoc(d.ref, { status: 'valide' }));
                await Promise.all(updatePromises);
                console.log(`✅ Statut de réservation mis à jour dans la collection globale pour ${user.email}`);
            } catch (syncError) {
                console.warn('⚠️ Erreur synchronisation collection Reservations:', syncError);
            }

            console.log(`✅ Réservation approuvée (valide) pour ${user.email}, slot ${slot}`);

        } catch (error) {
            console.error('Erreur approbation:', error);
            throw error;
        }
    }
}

export const reservationService = new ReservationService();