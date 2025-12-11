import React, { useState } from 'react';
// CORRECTION : Sidebar est dans le MÊME dossier 'layout/'
import Sidebar from './Sidebar'; 
// CORRECTION : DashboardHeader est dans le dossier voisin 'common/'
import DashboardHeader from '../common/DashboardHeader'; 

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
    // État pour gérer la visibilité de la Sidebar sur les écrans mobiles
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        // Conteneur principal: flex horizontal, prend toute la hauteur de l'écran
        <div className="flex h-screen bg-gray-50"> 
            {/* 1. Barre Latérale (Sidebar) */}
            {/* Le logo "BiblioENSPY" est déjà intégré dans ce composant sur Desktop */}
            <Sidebar 
                isMobileOpen={isSidebarOpen} 
                setIsMobileOpen={setIsSidebarOpen} 
            /> 

            {/* Contenu principal (se décale de 64px sur desktop) */}
            <div className="flex-1 flex flex-col overflow-hidden md:ml-64"> 
                {/* 2. En-tête (Header) */}
                {/* Le logo "BiblioENSPY" est intégré dans cet composant pour les mobiles */}
                <DashboardHeader 
                    onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
                />

                {/* 3. Contenu de la Page */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
                    {/* Affiche les composants enfants (Pages comme Students, Users, etc.) */}
                    {children} 
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;