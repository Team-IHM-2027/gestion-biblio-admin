// src/components/layout/AuthLayout.tsx
import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useConfig } from '../theme/ConfigProvider';

const AuthLayout: React.FC = () => {
    const { config } = useConfig();

    const renderLogo = () => {
        if (!config?.Logo) return null;
        return (
            <img
                src={config.Logo}
                alt={`${config.Name} Logo`}
                className="w-16 h-16 object-contain mx-auto"
                onError={(e) => {
                    console.error("Failed to load logo:", config.Logo);
                    e.currentTarget.style.display = "none";
                }}
            />
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Carte d'authentification */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {/* Logo + Titre */}
                    <div className="text-center mb-8">
                        <Link to="/" className="inline-block mb-4">
                            {renderLogo()}
                        </Link>
                        <h2 className="text-2xl font-bold text-primary">{config.Name}</h2>
                    </div>

                    {/* Contenu (Login ou Register) */}
                    <Outlet />
                </div>

                {/* Footer */}
                <div className="text-center mt-6 text-white/80 text-sm">
                    <Link to="/" className="hover:text-white transition">
                        ← Retour à l'accueil
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;