import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    writeBatch,
    doc,
    updateDoc,
    Timestamp,
    onSnapshot,
    deleteDoc,
    getDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';
import emailjs from '@emailjs/browser';

// Types pour les notifications
export interface BaseNotification {
    id: string;
    userId: string;
    userName?: string;
    userEmail?: string;
    type: 'success' | 'warning' | 'info' | 'error' | 'reservation' | 'reservation_update' | 'loan_validated' | 'loan_returned' | 'penalty' | 'loan_request';
    title: string;
    message: string;
    read: boolean;
    timestamp: any;
    link?: string;
    data?: any;
}

export interface ReservationNotificationData {
    bookId: string;
    bookTitle: string;
    userId: string;
    userEmail: string;
    userName: string;
    requestDate: string;
    priority?: 'normal' | 'urgent';
    slotNumber?: number;
    requestType?: 'reservation' | 'loan';
}

export interface ReservationNotification extends BaseNotification {
    type: 'reservation';
    userName: string;
    userEmail: string;
    processed?: boolean;
    decision?: 'approved' | 'rejected';
    status?: 'pending' | 'ready_for_pickup' | 'completed' | 'rejected';
    processedBy?: string;
    processedAt?: any;
    reason?: string;
    data: ReservationNotificationData;
}

export interface ReservationUpdateNotification extends BaseNotification {
    type: 'reservation_update';
    data: {
        bookId: string;
        bookTitle: string;
        status: 'approved' | 'rejected';
        reason?: string;
        librarianName?: string;
        updateDate: string;
    };
}

export interface LoanValidatedNotification extends BaseNotification {
    type: 'loan_validated';
    data: {
        bookId: string;
        bookTitle: string;
        loanDate: string;
        dueDate: string;
        librarianName?: string;
    };
}

export interface LoanRequestNotification extends BaseNotification {
    type: 'loan_request';
    userName: string;
    userEmail: string;
    processed?: boolean;
    decision?: 'approved' | 'rejected';
    status?: 'pending' | 'ready_for_pickup' | 'completed' | 'rejected';
    processedBy?: string;
    processedAt?: any;
    reason?: string;
    data: ReservationNotificationData;
}

export interface LoanReturnedNotification extends BaseNotification {
    type: 'loan_returned';
    data: {
        bookId: string;
        bookTitle: string;
        returnDate: string;
        librarianName?: string;
    };
}

export interface PenaltyNotification extends BaseNotification {
    type: 'penalty';
    data: {
        bookId: string;
        bookTitle: string;
        timeOverdue: string;
        amount: number;
    };
}

// Union type for all notification types
export type Notification = BaseNotification | ReservationNotification | ReservationUpdateNotification | LoanValidatedNotification | LoanRequestNotification | LoanReturnedNotification | PenaltyNotification;

class NotificationService {
    private readonly collectionName = 'Notifications';
    private readonly librarianNotificationCollection = 'LibrarianNotifications';

    /**
     * Ajoute une notification pour un utilisateur
     */
    async addUserNotification(data: Omit<BaseNotification, 'id' | 'read' | 'timestamp'>): Promise<string> {
        try {
            const notificationCollection = collection(db, this.collectionName);

            // 🔥 FIX: Filter out undefined values to prevent FirebaseError
            const cleanData = Object.entries(data).reduce((acc, [key, value]) => {
                if (value !== undefined) {
                    acc[key] = value;
                }
                return acc;
            }, {} as any);

            const docRef = await addDoc(notificationCollection, {
                ...cleanData,
                read: false,
                timestamp: Timestamp.now()
            });
            console.log(`✅ Notification créée pour l'utilisateur ${data.userId}: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            console.error("❌ Erreur lors de la création de la notification:", error);
            throw error;
        }
    }



    /**
     * Envoie un email via EmailJS
     */
    async sendEmailNotification(
        toEmail: string,
        toName: string,
        templateParams: Record<string, any>
    ): Promise<void> {
        try {
            // Ces valeurs doivent être fournies par l'utilisateur ou stockées dans des variables d'env
            // Pour l'instant on utilise des placeholders que l'utilisateur devra remplacer
            const SERVICE_ID = 'service_ojdlhqh';
            const TEMPLATE_ID = 'template_m8k96ae';
            const PUBLIC_KEY = 'cFpAuuBpgFKTfWm16';

            await emailjs.send(
                SERVICE_ID,
                TEMPLATE_ID,
                {
                    to_email: toEmail,
                    to_name: toName,
                    ...templateParams
                },
                PUBLIC_KEY
            );
            console.log(`📧 Email envoyé via EmailJS à ${toEmail}`);
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi EmailJS:", error);
            throw error;
        }
    }

    /**
     * Crée une notification de réservation pour un bibliothécaire
     */
    async createReservationNotification(
        userId: string,
        userName: string,
        userEmail: string,
        bookId: string,
        bookTitle: string,
        slotNumber?: number,
        requestType: 'reservation' | 'loan' = 'reservation'
    ): Promise<string> {
        try {
            const notificationCollection = collection(db, this.librarianNotificationCollection);

            const notificationData: any = {
                userId: 'librarians', // Special ID for all librarians
                userName: userName,
                userEmail: userEmail,
                type: requestType === 'loan' ? 'loan_request' : 'reservation',
                title: requestType === 'loan' ? '📖 Nouvelle demande d\'emprunt' : '📚 Nouvelle demande de réservation',
                message: requestType === 'loan'
                    ? `${userName} souhaite emprunter "${bookTitle}"`
                    : `${userName} souhaite réserver "${bookTitle}"`,
                read: false,
                processed: false,
                status: 'pending',
                data: {
                    bookId,
                    bookTitle,
                    userId,
                    userEmail,
                    userName,
                    requestDate: new Date().toISOString(),
                    slotNumber,
                    priority: 'normal',
                    requestType: requestType
                }
            };

            const docRef = await addDoc(notificationCollection, {
                ...notificationData,
                timestamp: Timestamp.now()
            });

            console.log(`📚 Notification ${requestType === 'loan' ? 'd\'emprunt' : 'de réservation'} créée: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            console.error("❌ Erreur lors de la création de la notification:", error);
            throw error;
        }
    }

    /**
     * Crée une notification de demande d'emprunt pour un bibliothécaire
     */
    async createLoanRequestNotification(
        userId: string,
        userName: string,
        userEmail: string,
        bookId: string,
        bookTitle: string
    ): Promise<string> {
        try {
            return await this.createReservationNotification(
                userId,
                userName,
                userEmail,
                bookId,
                bookTitle,
                undefined,
                'loan'
            );
        } catch (error) {
            console.error("❌ Erreur lors de la création de la notification d'emprunt:", error);
            throw error;
        }
    }

    /**
     * Envoie une mise à jour de réservation à l'utilisateur
     */
    async sendReservationUpdate(
        userId: string,
        bookId: string,
        bookTitle: string,
        status: 'approved' | 'rejected',
        reason?: string,
        librarianName?: string
    ): Promise<string> {
        try {
            const notificationId = await this.addUserNotification({
                userId,
                type: 'reservation_update',
                title: status === 'approved'
                    ? '🎉 Réservation approuvée'
                    : '❌ Réservation refusée',
                message: status === 'approved'
                    ? `Votre réservation pour "${bookTitle}" a été approuvée${librarianName ? ` par ${librarianName}` : ''}.`
                    : `Votre réservation pour "${bookTitle}" a été refusée${reason ? `: ${reason}` : ''}.`,
                data: {
                    bookId,
                    bookTitle,
                    status,
                    reason,
                    librarianName,
                    updateDate: new Date().toISOString()
                }
            });

            return notificationId;
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de la mise à jour de réservation:", error);
            throw error;
        }
    }

    /**
     * Envoie une notification de validation d'emprunt à l'utilisateur
     */
    async sendLoanValidated(
        userId: string,
        bookId: string,
        bookTitle: string,
        dueDate: Date,
        librarianName: string = 'Bibliothécaire'
    ): Promise<string> {
        try {
            const notificationId = await this.addUserNotification({
                userId,
                type: 'loan_validated',
                title: '📖 Prêt Validé',
                message: `Votre emprunt pour "${bookTitle}" a été validé par ${librarianName}. À rendre avant le ${dueDate.toLocaleDateString()}.`,
                data: {
                    bookId,
                    bookTitle,
                    loanDate: new Date().toISOString(),
                    dueDate: dueDate.toISOString(),
                    librarianName
                }
            });
            console.log(`✅ Notification de prêt validé envoyée à ${userId}`);
            return notificationId;
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de la validation d'emprunt:", error);
            throw error;
        }
    }

    /**
     * Envoie une notification de pénalité pour retard
     */
    async sendPenaltyNotification(
        userId: string,
        userName: string,
        bookId: string,
        bookTitle: string,
        timeOverdue: string,
        amount: number
    ): Promise<string> {
        try {
            // Send email notification
            const templateParams = {
                to_name: userName,
                message: `Vous avez un retard de ${timeOverdue} pour le livre "${bookTitle}". Veuillez le retourner dès que possible. Pénalité actuelle : ${amount} FCFA.`,
                reason: 'Retard de restitution',
                type: 'penalty'
            };

            // Don't await the email so it doesn't block the UI/notification creation if it fails or takes time
            this.sendEmailNotification(userId, userName, templateParams).catch(err =>
                console.error("Failed to send penalty email:", err)
            );

            return await this.addUserNotification({
                userId,
                userName,
                type: 'penalty',
                title: '⚠️ Retard de restitution',
                message: `Vous avez ${timeOverdue} de retard pour "${bookTitle}". Pénalité actuelle : ${amount} FCFA.`,
                data: {
                    bookId,
                    bookTitle,
                    timeOverdue,
                    amount,
                    date: new Date().toISOString()
                }
            });
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de la notification de pénalité:", error);
            throw error;
        }
    }

    /**
     * Envoie une notification de retour de livre
     */
    async sendLoanReturned(
        userId: string,
        bookId: string,
        bookTitle: string,
        librarianName: string = 'Bibliothécaire'
    ): Promise<string> {
        try {
            return await this.addUserNotification({
                userId,
                type: 'loan_returned',
                title: '✅ Retour Confirmé',
                message: `Le retour du livre "${bookTitle}" a été confirmé par ${librarianName}. Merci !`,
                data: {
                    bookId,
                    bookTitle,
                    returnDate: new Date().toISOString(),
                    processedBy: librarianName
                }
            });
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de la notification de retour:", error);
            throw error;
        }
    }

    /**
     * Traite une demande de réservation ou d'emprunt
     */
    async processReservationRequest(
        notificationId: string,
        decision: 'approved' | 'rejected',
        librarianName: string,
        reason?: string,
        dueDate?: Date // Ajouté pour les emprunts
    ): Promise<void> {
        try {
            const notifRef = doc(db, this.librarianNotificationCollection, notificationId);
            const notificationSnap = await getDoc(notifRef);

            if (!notificationSnap.exists()) {
                throw new Error('Notification non trouvée');
            }

            const notification = notificationSnap.data();
            const isLoanRequest = notification.type === 'loan_request' || notification.data?.requestType === 'loan';

            // Marquer comme traitée
            const updateData: any = {
                processed: true,
                decision,
                processedBy: librarianName,
                processedAt: Timestamp.now(),
                reason: reason || '',
                read: true,
                status: decision === 'approved' ? 'completed' : 'rejected'
            };

            await updateDoc(notifRef, updateData);

            // Envoyer une notification à l'utilisateur
            if (notification.data) {
                if (isLoanRequest) {
                    if (decision === 'approved' && dueDate) {
                        // Envoyer une notification de prêt validé
                        await this.sendLoanValidated(
                            notification.data.userId,
                            notification.data.bookId,
                            notification.data.bookTitle,
                            dueDate,
                            librarianName
                        );
                    } else if (decision === 'rejected') {
                        // Envoyer une notification de refus d'emprunt
                        await this.sendReservationUpdate(
                            notification.data.userId,
                            notification.data.bookId,
                            notification.data.bookTitle,
                            'rejected',
                            reason,
                            librarianName
                        );
                    }
                } else {
                    // Pour les réservations normales
                    await this.sendReservationUpdate(
                        notification.data.userId,
                        notification.data.bookId,
                        notification.data.bookTitle,
                        decision,
                        reason,
                        librarianName
                    );
                }
            }

            console.log(`✅ Demande ${isLoanRequest ? 'd\'emprunt' : 'de réservation'} traitée: ${decision}`);
        } catch (error) {
            console.error("❌ Erreur lors du traitement de la demande:", error);
            throw error;
        }
    }

    /**
     * Écoute les nouvelles notifications pour un utilisateur (temps réel)
     */
    subscribeToUserNotifications(
        userId: string,
        callback: (notifications: Notification[]) => void
    ) {
        const q = query(
            collection(db, this.collectionName),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limit(20)
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];
            callback(notifications);
        });
    }

    /**
     * Écoute toutes les demandes (réservations et emprunts) pour les bibliothécaires
     */
    subscribeToLibrarianRequests(callback: (notifications: (ReservationNotification | LoanRequestNotification)[]) => void) {
        const q = query(
            collection(db, this.librarianNotificationCollection),
            orderBy('timestamp', 'desc'),
            limit(100)
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => {
                const data = doc.data();
                const type = data.type;

                // Determine request type
                let requestType: 'reservation' | 'loan' = 'reservation';
                if (type === 'loan_request') {
                    requestType = 'loan';
                } else if (data.data?.requestType) {
                    requestType = data.data.requestType;
                }

                const baseNotification = {
                    id: doc.id,
                    userId: data.userId || 'librarians',
                    userName: data.userName || data.data?.userName || data.nomEtudiant || 'Étudiant',
                    userEmail: data.userEmail || data.data?.userEmail || data.emailEtudiant || '',
                    type: type,
                    title: data.title || (requestType === 'loan' ? '📖 Demande d\'emprunt' : '📚 Demande de réservation'),
                    message: data.message || `${data.userName || data.nomEtudiant || 'Un étudiant'} souhaite ${requestType === 'loan' ? 'emprunter' : 'réserver'} un livre`,
                    read: data.read || false,
                    timestamp: data.timestamp,
                    processed: data.processed || (data.status && data.status !== 'pending'),
                    status: data.status || (data.processed ? 'completed' : 'pending'),
                    decision: data.decision,
                    processedBy: data.processedBy,
                    processedAt: data.processedAt,
                    reason: data.reason,
                    data: {
                        bookId: data.data?.bookId || data.bookId || data.livreId || '',
                        bookTitle: data.data?.bookTitle || data.bookTitle || data.nomLivre || 'Livre',
                        userId: data.data?.userId || data.userId || '',
                        userEmail: data.data?.userEmail || data.userEmail || data.emailEtudiant || '',
                        userName: data.data?.userName || data.userName || data.nomEtudiant || '',
                        requestDate: data.timestamp ? (typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate().toISOString() : new Date(data.timestamp).toISOString()) : new Date().toISOString(),
                        requestType: requestType,
                        slotNumber: data.data?.slotNumber || data.slotNumber,
                        priority: data.data?.priority || 'normal'
                    } as ReservationNotificationData
                };

                if (requestType === 'loan' || type === 'loan_request') {
                    return {
                        ...baseNotification,
                        type: 'loan_request' as const
                    } as LoanRequestNotification;
                } else {
                    return {
                        ...baseNotification,
                        type: 'reservation' as const
                    } as ReservationNotification;
                }
            });
            callback(notifications);
        });
    }

    /**
     * Écoute seulement les demandes de réservation
     */
    subscribeToReservationRequests(callback: (notifications: ReservationNotification[]) => void): () => void {
        const q = query(
            collection(db, this.librarianNotificationCollection),
            orderBy('timestamp', 'desc'),
            limit(50)
        );

        // onSnapshot returns an unsubscribe function
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                const notifications = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const requestType = data.data?.requestType || (data.type === 'loan_request' ? 'loan' : 'reservation');

                    return {
                        id: doc.id,
                        userId: data.userId || 'librarians',
                        userName: data.userName || data.data?.userName || '',
                        userEmail: data.userEmail || data.data?.userEmail || '',
                        type: 'reservation',
                        title: data.title || (requestType === 'loan' ? '📖 Demande d\'emprunt' : '📚 Demande de réservation'),
                        message: data.message || '',
                        read: data.read || false,
                        timestamp: data.timestamp,
                        processed: data.processed || false,
                        decision: data.decision,
                        processedBy: data.processedBy,
                        processedAt: data.processedAt,
                        reason: data.reason,
                        data: {
                            bookId: data.data?.bookId || data.bookId || '',
                            bookTitle: data.data?.bookTitle || data.bookTitle || '',
                            userId: data.data?.userId || data.userId || '',
                            userEmail: data.data?.userEmail || data.userEmail || '',
                            userName: data.data?.userName || data.userName || '',
                            requestDate: data.timestamp ? (typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate().toISOString() : new Date(data.timestamp).toISOString()) : new Date().toISOString(),
                            requestType: requestType,
                            slotNumber: data.data?.slotNumber || data.slotNumber,
                            priority: data.data?.priority || 'normal'
                        } as ReservationNotificationData
                    } as ReservationNotification;
                });
                callback(notifications);
            },
            (error) => {
                console.error('Error in reservation requests subscription:', error);
                callback([]);
            }
        );

        // Explicitly return the unsubscribe function
        return unsubscribe;
    }
    /**
     * Écoute seulement les demandes d'emprunt
     */
    subscribeToLoanRequests(callback: (notifications: LoanRequestNotification[]) => void) {
        this.subscribeToLibrarianRequests((allNotifications) => {
            const loans = allNotifications.filter(n =>
                n.type === 'loan_request' || n.data.requestType === 'loan'
            ) as LoanRequestNotification[];
            callback(loans);
        });
    }

    /**
     * Marque une notification spécifique comme lue
     */
    async markAsRead(notificationId: string, collectionName: string = this.collectionName): Promise<void> {
        try {
            const notifRef = doc(db, collectionName, notificationId);
            await updateDoc(notifRef, {
                read: true,
                readAt: Timestamp.now()
            });
        } catch (error) {
            console.error("❌ Erreur lors de la mise à jour de la notification:", error);
        }
    }

    /**
     * Marque toutes les notifications non lues d'un utilisateur comme lues
     */
    async markAllAsRead(userId: string): Promise<void> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                where('read', '==', false)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) return;

            const batch = writeBatch(db);
            querySnapshot.forEach(doc => {
                batch.update(doc.ref, {
                    read: true,
                    readAt: Timestamp.now()
                });
            });
            await batch.commit();
        } catch (error) {
            console.error("❌ Erreur lors de la mise à jour de toutes les notifications:", error);
        }
    }

    /**
     * Récupère le nombre de notifications non lues
     */
    async getUnreadCount(userId: string): Promise<number> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                where('read', '==', false)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.size;
        } catch (error) {
            console.error("❌ Erreur lors du comptage des notifications non lues:", error);
            return 0;
        }
    }

    /**
     * Récupère le nombre de demandes en attente (réservations et emprunts)
     */
    async getPendingRequestsCount(): Promise<{ reservations: number, loans: number }> {
        try {
            const q = query(
                collection(db, this.librarianNotificationCollection),
                where('read', '==', false),
                where('processed', '==', false)
            );
            const querySnapshot = await getDocs(q);

            let reservations = 0;
            let loans = 0;

            querySnapshot.forEach(doc => {
                const data = doc.data();
                const type = data.type;
                const requestType = data.data?.requestType || (type === 'loan_request' ? 'loan' : 'reservation');

                if (requestType === 'loan') {
                    loans++;
                } else {
                    reservations++;
                }
            });

            return { reservations, loans };
        } catch (error) {
            console.error("❌ Erreur lors du comptage des demandes en attente:", error);
            return { reservations: 0, loans: 0 };
        }
    }

    /**
     * Récupère le nombre de demandes de réservation en attente (pour les bibliothécaires)
     */
    async getPendingReservationCount(): Promise<number> {
        try {
            const q = query(
                collection(db, this.librarianNotificationCollection),
                where('read', '==', false),
                where('processed', '==', false)
            );
            const querySnapshot = await getDocs(q);

            let count = 0;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const type = data.type;
                const requestType = data.data?.requestType || (type === 'loan_request' ? 'loan' : 'reservation');

                if (requestType === 'reservation') {
                    count++;
                }
            });

            return count;
        } catch (error) {
            console.error("❌ Erreur lors du comptage des réservations en attente:", error);
            return 0;
        }
    }

    /**
     * Récupère le nombre de demandes d'emprunt en attente
     */
    async getPendingLoanCount(): Promise<number> {
        try {
            const q = query(
                collection(db, this.librarianNotificationCollection),
                where('read', '==', false),
                where('processed', '==', false)
            );
            const querySnapshot = await getDocs(q);

            let count = 0;
            querySnapshot.forEach(doc => {
                const data = doc.data();
                const type = data.type;
                const requestType = data.data?.requestType || (type === 'loan_request' ? 'loan' : 'reservation');

                if (requestType === 'loan') {
                    count++;
                }
            });

            return count;
        } catch (error) {
            console.error("❌ Erreur lors du comptage des emprunts en attente:", error);
            return 0;
        }
    }

    /**
     * Supprime une notification
     */
    async deleteNotification(notificationId: string, collectionName: string = this.collectionName): Promise<void> {
        try {
            await deleteDoc(doc(db, collectionName, notificationId));
        } catch (error) {
            console.error("❌ Erreur lors de la suppression de la notification:", error);
            throw error;
        }
    }

    /**
     * Récupère les notifications pour un utilisateur donné
     */
    async getNotificationsForUser(userId: string, count: number = 50): Promise<Notification[]> {
        try {
            const q = query(
                collection(db, this.collectionName),
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(count)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Notification[];
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des notifications:", error);
            return [];
        }
    }

    /**
     * Récupère toutes les demandes en attente
     */
    async getPendingRequests(): Promise<(ReservationNotification | LoanRequestNotification)[]> {
        try {
            const q = query(
                collection(db, this.librarianNotificationCollection),
                where('read', '==', false),
                where('processed', '==', false),
                orderBy('timestamp', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                const type = data.type;
                const requestType = data.data?.requestType || (type === 'loan_request' ? 'loan' : 'reservation');

                const notificationData: ReservationNotificationData = {
                    bookId: data.data?.bookId || data.bookId || data.livreId || '',
                    bookTitle: data.data?.bookTitle || data.bookTitle || data.nomLivre || 'Livre',
                    userId: data.data?.userId || data.userId || '',
                    userEmail: data.data?.userEmail || data.userEmail || data.emailEtudiant || '',
                    userName: data.data?.userName || data.userName || data.nomEtudiant || '',
                    requestDate: data.timestamp ? (typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate().toISOString() : new Date(data.timestamp).toISOString()) : new Date().toISOString(),
                    requestType: requestType,
                    slotNumber: data.data?.slotNumber || data.slotNumber,
                    priority: data.data?.priority || 'normal'
                };

                if (requestType === 'loan') {
                    return {
                        id: doc.id,
                        userId: data.userId || 'librarians',
                        userName: data.userName || data.data?.userName || '',
                        userEmail: data.userEmail || data.data?.userEmail || '',
                        type: 'loan_request' as const,
                        title: data.title || '📖 Demande d\'emprunt',
                        message: data.message || '',
                        read: data.read || false,
                        timestamp: data.timestamp,
                        processed: data.processed || false,
                        decision: data.decision,
                        processedBy: data.processedBy,
                        processedAt: data.processedAt,
                        reason: data.reason,
                        data: notificationData
                    } as LoanRequestNotification;
                } else {
                    return {
                        id: doc.id,
                        userId: data.userId || 'librarians',
                        userName: data.userName || data.data?.userName || '',
                        userEmail: data.userEmail || data.data?.userEmail || '',
                        type: 'reservation' as const,
                        title: data.title || '📚 Demande de réservation',
                        message: data.message || '',
                        read: data.read || false,
                        timestamp: data.timestamp,
                        processed: data.processed || false,
                        decision: data.decision,
                        processedBy: data.processedBy,
                        processedAt: data.processedAt,
                        reason: data.reason,
                        data: notificationData
                    } as ReservationNotification;
                }
            });
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des demandes en attente:", error);
            return [];
        }
    }

    /**
     * Récupère toutes les demandes de réservation en attente
     */
    async getPendingReservations(): Promise<ReservationNotification[]> {
        try {
            const requests = await this.getPendingRequests();
            return requests.filter(req =>
                req.type === 'reservation' && req.data.requestType === 'reservation'
            ) as ReservationNotification[];
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des réservations en attente:", error);
            return [];
        }
    }

    /**
     * Récupère toutes les demandes d'emprunt en attente
     */
    async getPendingLoans(): Promise<LoanRequestNotification[]> {
        try {
            const requests = await this.getPendingRequests();
            return requests.filter(req =>
                req.type === 'loan_request' || req.data.requestType === 'loan'
            ) as LoanRequestNotification[];
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des emprunts en attente:", error);
            return [];
        }
    }

    /**
     * Récupère les demandes traitées
     */
    async getProcessedRequests(): Promise<(ReservationNotification | LoanRequestNotification)[]> {
        try {
            const q = query(
                collection(db, this.librarianNotificationCollection),
                where('processed', '==', true),
                orderBy('processedAt', 'desc'),
                limit(50)
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => {
                const data = doc.data();
                const type = data.type;
                const requestType = data.data?.requestType || (type === 'loan_request' ? 'loan' : 'reservation');

                const notificationData: ReservationNotificationData = {
                    bookId: data.data?.bookId || data.bookId || data.livreId || '',
                    bookTitle: data.data?.bookTitle || data.bookTitle || data.nomLivre || 'Livre',
                    userId: data.data?.userId || data.userId || '',
                    userEmail: data.data?.userEmail || data.userEmail || data.emailEtudiant || '',
                    userName: data.data?.userName || data.userName || data.nomEtudiant || '',
                    requestDate: data.timestamp ? (typeof data.timestamp.toDate === 'function' ? data.timestamp.toDate().toISOString() : new Date(data.timestamp).toISOString()) : new Date().toISOString(),
                    requestType: requestType,
                    slotNumber: data.data?.slotNumber || data.slotNumber,
                    priority: data.data?.priority || 'normal'
                };

                if (requestType === 'loan') {
                    return {
                        id: doc.id,
                        userId: data.userId || 'librarians',
                        userName: data.userName || data.data?.userName || '',
                        userEmail: data.userEmail || data.data?.userEmail || '',
                        type: 'loan_request' as const,
                        title: data.title || '',
                        message: data.message || '',
                        read: data.read || false,
                        timestamp: data.timestamp,
                        processed: data.processed || false,
                        decision: data.decision,
                        processedBy: data.processedBy,
                        processedAt: data.processedAt,
                        reason: data.reason,
                        data: notificationData
                    } as LoanRequestNotification;
                } else {
                    return {
                        id: doc.id,
                        userId: data.userId || 'librarians',
                        userName: data.userName || data.data?.userName || '',
                        userEmail: data.userEmail || data.data?.userEmail || '',
                        type: 'reservation' as const,
                        title: data.title || '',
                        message: data.message || '',
                        read: data.read || false,
                        timestamp: data.timestamp,
                        processed: data.processed || false,
                        decision: data.decision,
                        processedBy: data.processedBy,
                        processedAt: data.processedAt,
                        reason: data.reason,
                        data: notificationData
                    } as ReservationNotification;
                }
            });
        } catch (error) {
            console.error("❌ Erreur lors de la récupération des demandes traitées:", error);
            return [];
        }
    }

    /**
     * Envoie une notification simple à un utilisateur
     */
    async sendSimpleNotification(
        userId: string,
        type: BaseNotification['type'],
        title: string,
        message: string,
        link?: string
    ): Promise<string> {
        return this.addUserNotification({
            userId,
            type,
            title,
            message,
            link
        });
    }

    /**
     * Trouve une notification de bibliothécaire par utilisateur et livre
     */
    async findLibrarianNotification(userId: string, bookId: string): Promise<string | null> {
        try {
            const q = query(
                collection(db, this.librarianNotificationCollection),
                where('data.userId', '==', userId),
                where('data.bookId', '==', bookId),
                where('processed', '==', false),
                limit(1)
            );
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                return querySnapshot.docs[0].id;
            }
            return null;
        } catch (error) {
            console.error("❌ Erreur lors de la recherche de la notification:", error);
            return null;
        }
    }

    /**
     * Met à jour le statut d'une notification de réservation
     */
    async updateReservationStatus(
        notificationId: string,
        status: ReservationNotification['status'],
        processed: boolean = false
    ): Promise<void> {
        try {
            const notifRef = doc(db, this.librarianNotificationCollection, notificationId);
            await updateDoc(notifRef, {
                status,
                processed,
                processedAt: Timestamp.now()
            });
        } catch (error) {
            console.error("❌ Erreur lors de la mise à jour du statut de la notification:", error);
        }
    }

    /**
     * Envoie une notification de rappel 3 jours avant la date de retour
     */
    async sendReminderNotification(
        userId: string,
        bookId: string,
        bookTitle: string,
        dueDate: Date
    ): Promise<string> {
        try {
            const dueDateString = dueDate.toLocaleDateString('fr-FR');
            return await this.addUserNotification({
                userId,
                type: 'warning',
                title: '⏰ Rappel de retour',
                message: `Le livre "${bookTitle}" doit être retourné avant le ${dueDateString}. Il reste 3 jours.`,
                data: {
                    bookId,
                    bookTitle,
                    dueDate: dueDate.toISOString(),
                    reminderDate: new Date().toISOString(),
                    daysLeft: 3
                }
            });
        } catch (error) {
            console.error("❌ Erreur lors de l'envoi de la notification de rappel:", error);
            throw error;
        }
    }

    /**
     * Notifie les bibliothécaires d'un emprunt en retard
     */
    async notifyLateLoanToLibrarian(
        userId: string,
        userName: string,
        userEmail: string,
        bookId: string,
        bookTitle: string,
        daysOverdue: number
    ): Promise<string> {
        try {
            const notificationCollection = collection(db, this.librarianNotificationCollection);

            const notificationData = {
                userId: 'librarians',
                userName,
                userEmail,
                type: 'warning' as const,
                title: '⚠️ Emprunt en retard',
                message: `${userName} a ${daysOverdue} jours de retard pour le livre "${bookTitle}"`,
                read: false,
                data: {
                    bookId,
                    bookTitle,
                    userId,
                    userEmail,
                    userName,
                    daysOverdue,
                    notificationDate: new Date().toISOString()
                }
            };

            const docRef = await addDoc(notificationCollection, {
                ...notificationData,
                timestamp: Timestamp.now()
            });

            console.log(`⚠️ Notification d'emprunt en retard créée: ${docRef.id}`);
            return docRef.id;
        } catch (error) {
            console.error("❌ Erreur lors de la création de la notification d'emprunt en retard:", error);
            throw error;
        }
    }

    /**
     * Watches for new incoming reservations and creates notifications for librarians
     * Should be called when the admin app initializes
     */
    subscribeToIncomingReservations(callback?: () => void) {
        try {
            const usersCollection = collection(db, 'BiblioUser');

            // Subscribe to all users
            const unsubscribe = onSnapshot(usersCollection, async (snapshot) => {
                // Check each user for new reservations
                for (const userDoc of snapshot.docs) {
                    const userData = userDoc.data();

                    // Check etat1, etat2, etat3 for 'reserv' status
                    for (let i = 1; i <= 3; i++) {
                        const etatKey = `etat${i}`;
                        const tabKey = `tabEtat${i}`;

                        if (userData[etatKey] === 'reserv' && userData[tabKey]?.[0]) {
                            const tabData = userData[tabKey];
                            const bookId = tabData[0];
                            const bookName = tabData[1] || 'Livre';
                            //const _reservationDate = tabData[5];

                            // Check if notification already exists for this reservation
                            const existingNotif = await this.findLibrarianNotification(userDoc.id, bookId);

                            if (!existingNotif) {
                                // Create a new notification for this reservation
                                await this.createReservationNotification(
                                    userDoc.id,
                                    userData.name || 'Utilisateur',
                                    userDoc.id, // email/ID
                                    bookId,
                                    bookName,
                                    i, // slotNumber
                                    'reservation'
                                );
                                console.log(`📚 Notification créée pour nouvelle réservation: ${userDoc.id} - ${bookName}`);
                            }
                        }
                    }
                }

                if (callback) callback();
            });

            return unsubscribe;
        } catch (error) {
            console.error("Erreur lors de l'écoute des réservations entrantes:", error);
            return () => { };
        }
    }
}

export const notificationService = new NotificationService();