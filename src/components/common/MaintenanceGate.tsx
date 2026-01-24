import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { useConfig } from '../theme/ConfigProvider';
import { db } from '../../config/firebase';
import MaintenanceScreen from './MaintenanceScreen';

const MaintenanceGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { config } = useConfig();
    const [appMaintenance, setAppMaintenance] = useState<boolean | null>(null);
    const [orgMaintenance, setOrgMaintenance] = useState<boolean | null>(null);

    useEffect(() => {
        const ref = doc(db, 'Configuration', 'AppSettings');
        const unsubscribe = onSnapshot(
            ref,
            (snapshot) => {
                if (!snapshot.exists()) {
                    setAppMaintenance(null);
                    return;
                }
                const data = snapshot.data();
                setAppMaintenance(Boolean(data?.MaintenanceMode));
            },
            (error) => {
                console.error('Maintenance listener error:', error);
                setAppMaintenance(null);
            }
        );

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const ref = doc(db, 'Configuration', 'OrgSettings');
        const unsubscribe = onSnapshot(
            ref,
            (snapshot) => {
                if (!snapshot.exists()) {
                    setOrgMaintenance(null);
                    return;
                }
                const data = snapshot.data();
                setOrgMaintenance(Boolean(data?.MaintenanceMode));
            },
            (error) => {
                console.error('Maintenance listener error:', error);
                setOrgMaintenance(null);
            }
        );

        return () => unsubscribe();
    }, []);

    const maintenanceEnabled = Boolean(appMaintenance) || Boolean(orgMaintenance) || Boolean(config?.MaintenanceMode);

    if (maintenanceEnabled) {
        return <MaintenanceScreen />;
    }

    return <>{children}</>;
};

export default MaintenanceGate;
