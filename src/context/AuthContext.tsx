// src/context/AuthContext.tsx
import React, {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from 'react';

import * as authService from '../services/authService';
import type { AdminData } from '../services/authService';
import Spinner from '../components/common/Spinner';

interface AuthContextType {
	admin: AdminData | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<AdminData>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
	const [admin, setAdmin] = useState<AdminData | null>(null);
	const [loading, setLoading] = useState(true);

	/**
	 * Charger la session depuis le localStorage au démarrage
	 */
	useEffect(() => {
		try {
			const storedAdmin = localStorage.getItem('biblioAdmin');
			if (storedAdmin) {
				setAdmin(JSON.parse(storedAdmin));
			}
		} catch (error) {
			console.error('Erreur lors du chargement de la session:', error);
			localStorage.removeItem('biblioAdmin');
		} finally {
			setLoading(false);
		}
	}, []);

	/**
	 * Connexion
	 */
	const login = async (email: string, password: string): Promise<AdminData> => {
		const adminData = await authService.loginAdmin(email, password);

		// 🔒 Compte bloqué
		if (adminData.etat === 'bloc') {
			throw new Error("Votre compte est bloqué. Contactez l'administration.");
		}

		// 📧 Email non vérifié
		if (!adminData.isVerified) {
			throw new Error(
				"Votre adresse e-mail n'est pas encore vérifiée. Veuillez consulter votre boîte mail."
			);
		}

		setAdmin(adminData);
		localStorage.setItem('biblioAdmin', JSON.stringify(adminData));

		return adminData;
	};

	/**
	 * Déconnexion
	 */
	const logout = () => {
		setAdmin(null);
		localStorage.removeItem('biblioAdmin');
	};

	/**
	 * Écran de chargement global
	 */
	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-900">
				<Spinner />
			</div>
		);
	}

	return (
		<AuthContext.Provider value={{ admin, loading, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
