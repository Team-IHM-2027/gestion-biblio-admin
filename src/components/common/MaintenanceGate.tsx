import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useConfig } from '../theme/ConfigProvider';
import { db } from '../../config/firebase';
import MaintenanceScreen from './MaintenanceScreen';

const MaintenanceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { config } = useConfig();
    const [liveMaintenance, setLiveMaintenance] = useState<boolean | null>(null);

    useEffect(() => {
        const ref = doc(db, 'Configuration', 'OrgSettings');
        const unsubscribe = onSnapshot(
            ref,
            (snapshot) => {
                if (!snapshot.exists()) {
                    setLiveMaintenance(null);
                    return;
                }
                const data = snapshot.data();
                setLiveMaintenance(Boolean(data?.MaintenanceMode));
            },
            (error) => {
                console.error('Maintenance listener error:', error);
                setLiveMaintenance(null);
            }
        );

        return () => unsubscribe();
    }, []);

    const maintenanceEnabled = liveMaintenance ?? Boolean(config?.MaintenanceMode);

    if (maintenanceEnabled) {
        return <MaintenanceScreen />;
    }

    return <>{children}</>;
};

export default MaintenanceGate;
