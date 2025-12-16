// src/components/common/DashboardHeader.tsx
import React from 'react';
import { FiMenu } from 'react-icons/fi';
import { useConfig } from '../theme/ConfigProvider';
import { NavLink } from 'react-router-dom';

interface DashboardHeaderProps {
    onToggleSidebar: () => void;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onToggleSidebar }) => {
    const { config } = useConfig();

    const renderLogo = () => {
        if (!config?.Logo) return null;
        return (
            <img
                src={config.Logo}
                alt={`${config.Name} Logo`}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                    console.error("Failed to load logo:", config.Logo);
                    e.currentTarget.style.display = "none";
                }}
            />
        );
    };

    return (
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
            <div className="flex items-center justify-between px-4 py-3">
                {/* Section gauche : Menu burger + Logo (mobile) */}
                <div className="flex items-center space-x-3">
                    {/* Bouton menu burger (visible uniquement sur mobile) */}
                    <button
                        onClick={onToggleSidebar}
                        className="md:hidden text-gray-600 hover:text-primary focus:outline-none"
                    >
                        <FiMenu className="w-6 h-6" />
                    </button>

                    {/* Logo visible uniquement sur mobile */}
                    <NavLink to="/dashboard" className="md:hidden flex items-center space-x-2">
                        {renderLogo()}
                        <h1 className="text-lg font-bold text-primary">{config.Name}</h1>
                    </NavLink>
                </div>

                {/* Section droite : Actions utilisateur, notifications, etc. */}
                <div className="flex items-center space-x-4">
                    {/* Ajoutez ici vos composants (notifications, profil, etc.) */}
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;