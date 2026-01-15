import { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import type { ReservationNotification } from '../services/notificationService';

export const usePendingReservations = () => {
    const [pendingCount, setPendingCount] = useState(0);
    const [notifications, setNotifications] = useState<ReservationNotification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = notificationService.subscribeToReservationRequests((notifs) => {
            const pending = notifs.filter(n => !n.processed);
            setNotifications(pending);
            setPendingCount(pending.length);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { pendingCount, notifications, loading };
};
