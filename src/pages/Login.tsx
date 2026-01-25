// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../components/theme/ConfigProvider';
import { FiMail, FiLock, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';

const Login: React.FC = () => {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const { login } = useAuth();
	const { config } = useConfig();
	const navigate = useNavigate();

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError('');
		setIsLoading(true);
		try {
			// 1. Attendre les données de l'admin après la connexion
			const adminData = await login(email, password);

			// 2. Rediriger vers le dashboard en passant un message dans l'état
			navigate('/dashboard', {
				state: {
					notification: `Bienvenue, ${adminData.name} !`
				},
				replace: true // Remplace la page de login dans l'historique
			});
		} catch (err: any) {
			setError(err.message || 'Une erreur est survenue.');
		}
		try {
			await login(email, password);
			navigate('/dashboard');
		} catch (error: any) {
			setError(error.message);
		}
		finally {
			setIsLoading(false);
		}
	};

	// Added code for logo display
	const renderLogo = () => {
		if (!config?.Logo) return null; // wait until config is loaded
		return (
			<img
				src={config.Logo}
				alt={`${config.Name} Logo`}
				className="w-10 h-10 object-contain"
				onError={(e) => {
					console.error("Failed to load logo:", config.Logo);
					e.currentTarget.style.display = "none"; // optional fallback
				}}
			/>
		);
	};

	return (
		<div className="w-full max-w-md p-8 space-y-6 bg-gray-800 bg-opacity-50 backdrop-blur-md rounded-2xl shadow-2xl animate-fade-in">
			<div className="text-center animate-slide-up">
				<h1 className="text-4xl font-bold text-white flex items-center justify-center gap-3">
					{renderLogo()}
					<span>{config.Name || 'Biblio Admin'}</span>
				</h1>
				<p className="text-secondary-300 mt-2">Connectez-vous pour accéder au panneau d'administration.</p>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				{/* ... le reste du formulaire est identique ... */}
				<div className="relative">
					<FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
					<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full pl-10 pr-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary" />
				</div>
				<div className="relative">
					<FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary-400" />
					<input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" required className="w-full pl-10 pr-10 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:ring-2 focus:ring-primary" />
					<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-white">
						{showPassword ? <FiEyeOff /> : <FiEye />}
					</button>
				</div>
				<div className="flex items-center justify-end text-sm">
					<Link to="/authentication/forgot-password" className="font-medium text-primary-400 hover:underline">Mot de passe oublié ?</Link>
				</div>

				{error && <div className="text-center text-red-400 bg-red-900 bg-opacity-50 p-2 rounded-lg">{error}</div>}

				<div>
					<button type="submit" disabled={isLoading} className="w-full flex items-center justify-center py-3 px-4 bg-primary text-white font-bold rounded-lg hover:bg-primary-600 transition-all disabled:opacity-50">
						{isLoading ? <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"></div> : <><FiLogIn className="mr-2" />Se connecter</>}
					</button>
				</div>
			</form>
			<p className="text-center text-sm text-secondary-300">
				Pas encore de compte ? <Link to="/authentication/register" className="font-medium text-primary-400 hover:underline">S'inscrire</Link>
			</p>
		</div>
	);
};

export default Login;