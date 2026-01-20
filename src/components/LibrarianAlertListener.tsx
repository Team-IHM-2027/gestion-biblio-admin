// src/components/LibrarianAlertListener.tsx
'use client';
import { useEffect } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    doc,
    serverTimestamp} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useNotifications } from '../context/notificationContext';
import { notificationService } from '../services/notificationService';

export default function LibrarianAlertListener() {
    const { addNotification } = useNotifications();

    useEffect(() => {
        // Ecoute les alertes non lues destinees aux bibliothecaires
        const q = query(
            collection(db, 'SystemAlerts'),
            where('targetRole', '==', 'librarian'),
            where('read', '==', false)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            snapshot.docChanges().forEach((change) => {
                if (change.type === 'added') {
                    const data = change.doc.data();
                    const type = ['success', 'error', 'warning', 'info'].includes(data.type)
                        ? data.type
                        : 'warning';

                    addNotification({
                        type,
                        title: data.title || 'Alerte Systeme',
                        message: data.message,
                        duration: 10000
                    });

                    updateDoc(doc(db, 'SystemAlerts', change.doc.id), {
                        read: true,
                        readAt: serverTimestamp()
                    }).catch((error) => {
                        console.error('Error marking alert as read:', error);
                    });
                }
            });
        });

        return () => unsubscribe();
    }, [addNotification]);

    // NEW: Watch for incoming reservations
    useEffect(() => {
        const usersCollection = collection(db, 'BiblioUser');
        const processedReservations = new Set<string>(); // Track processed reservations

        const unsubscribe = onSnapshot(usersCollection, async (snapshot) => {
            try {
                for (const userDoc of snapshot.docs) {
                    const userData = userDoc.data();
                    const userEmail = userDoc.id;
                    const userName = userData.name || 'Utilisateur';

                    // Check etat1, etat2, etat3 for 'reserv' status
                    for (let i = 1; i <= 3; i++) {
                        const etatKey = `etat${i}`;
                        const tabKey = `tabEtat${i}`;

                        if (userData[etatKey] === 'reserv' && userData[tabKey]?.[0]) {
                            const tabData = userData[tabKey];
                            const bookId = tabData[0];
                            const bookName = tabData[1] || 'Livre';
                            
                            // Create unique key for this reservation
                            const reservationKey = `${userEmail}-${bookId}-${i}`;

                            // Only process if not already processed
                            if (!processedReservations.has(reservationKey)) {
                                processedReservations.add(reservationKey);

                                // Check if notification already exists
                                const existingNotif = await notificationService.findLibrarianNotification(userEmail, bookId);

                                if (!existingNotif) {
                                    // Create notification for this reservation
                                    await notificationService.createReservationNotification(
                                        userEmail,
                                        userName,
                                        userEmail,
                                        bookId,
                                        bookName,
                                        i,
                                        'reservation'
                                    );
                                    console.log(`📚 Notification créée pour réservation: ${userName} - ${bookName}`);
                                }
                            }
                        }
                    }
                }
            } catch (error) {
                console.error('Erreur lors de la surveillance des réservations:', error);
            }
        });

        return () => unsubscribe();
    }, []);

    return null;
}
