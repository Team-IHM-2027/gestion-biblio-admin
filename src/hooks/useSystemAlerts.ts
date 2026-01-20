import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface SystemAlert {
    id: string;
    title?: string;
    message?: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    createdAt?: { toMillis?: () => number } | null;
    read?: boolean;
}

const MAX_ALERTS = 10;

export const useSystemAlerts = () => {
    const [alerts, setAlerts] = useState<SystemAlert[]>([]);

    useEffect(() => {
        const q = query(
            collection(db, 'SystemAlerts'),
            where('targetRole', '==', 'librarian')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const next = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...(doc.data() as SystemAlert)
            }));

            next.sort((a, b) => {
                const aTime = a.createdAt?.toMillis?.() || 0;
                const bTime = b.createdAt?.toMillis?.() || 0;
                return bTime - aTime;
            });

            setAlerts(next.slice(0, MAX_ALERTS));
        });

        return () => unsubscribe();
    }, []);

    return { alerts };
};
