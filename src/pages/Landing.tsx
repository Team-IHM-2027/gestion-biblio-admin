// src/pages/Landing.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useConfig } from '../components/theme/ConfigProvider';
import { motion } from "framer-motion";

const Landing: React.FC = () => {
    const { config } = useConfig();

    const renderLogo = () => {
        if (!config?.Logo) return null;
        return (
            <img
                src={config.Logo}
                alt={`${config.Name} Logo`}
                className="w-14 h-14 object-contain drop-shadow-lg"
                onError={(e) => {
                    console.error("Failed to load logo:", config.Logo);
                    e.currentTarget.style.display = "none";
                }}
            />
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-black text-white flex flex-col">

            {/* HEADER */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-3">
                        {renderLogo()}
                        <span className="text-2xl font-extrabold tracking-wide">
                            {config?.Name}
                        </span>
                    </Link>

                    <nav className="flex items-center space-x-4">
                        <Link
                            to="/authentication"
                            className="px-5 py-2 rounded-lg border border-white/30 hover:bg-white/10 transition font-medium"
                        >
                            Connexion
                        </Link>
                        <Link
                            to="/authentication/register"
                            className="px-6 py-2 rounded-lg bg-white text-primary font-semibold hover:bg-gray-100 transition shadow-lg"
                        >
                            Inscription
                        </Link>
                    </nav>
                </div>
            </header>

            {/* HERO */}
            <main className="flex-1 flex items-center justify-center pt-28 pb-20 text-center">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="px-6"
                >
                    <div className="flex justify-center mb-10">{renderLogo()}</div>

                    <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 drop-shadow-xl">
                        {config?.Name}
                    </h1>

                    <p className="text-xl sm:text-2xl text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Gérez votre bibliothèque avec un système moderne, fluide,
                        performant et pensé pour les utilisateurs.
                    </p>

                    <Link
                        to="/authentication"
                        className="inline-block px-10 py-4 text-lg bg-white text-primary font-semibold rounded-2xl shadow-xl hover:bg-gray-100 hover:shadow-2xl transition-transform transform hover:-translate-y-1"
                    >
                        Commencer maintenant
                    </Link>
                </motion.div>
            </main>

            {/* FOOTER */}
            <footer className="bg-black/30 backdrop-blur-lg border-t border-white/10 py-4">
                <div className="container mx-auto px-6 flex items-center justify-center text-white/70 text-sm">
                    © 2026 {config?.Name} — Tous droits réservés.
                </div>
            </footer>
        </div>
    );
};

export default Landing;
