import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useConfig } from "../theme/ConfigProvider.tsx";
import { BiLogOut } from "react-icons/bi";
import { FiChevronDown, FiChevronRight, FiX } from "react-icons/fi";
import useI18n from '../../hooks/useI18n';
import { useAuth } from '../../context/AuthContext.tsx';

interface SidebarProps {
	isMobileOpen: boolean;
	setIsMobileOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
	const { config } = useConfig();
	const navigate = useNavigate();
	const { t } = useI18n();
	const location = useLocation();
	const [isBookManagementOpen, setIsBookManagementOpen] = useState(false);
	const { logout } = useAuth();

	const sidebarItems = [
		{ id: 'overview', label: t('components:sidebar.overview'), icon: 'chart-pie' },
		{ id: 'users', label: t('components:sidebar.users'), icon: 'users' },
		{ id: 'loans', label: t('components:sidebar.loans'), icon: 'clipboard-list' },
		{ id: 'reservations', label: t('components:sidebar.reservations'), icon: 'clipboard-check' },
		{ id: 'archives', label: t('components:sidebar.archives'), icon: 'archive' },
		{ id: 'settings', label: t('components:sidebar.settings'), icon: 'cog' },
	];

	const bookManagementItems = [
		{ id: 'books', label: t('components:sidebar.book_management'), icon: 'book-open' },
		{ id: 'thesis', label: t('components:sidebar.memory_management'), icon: 'academic-cap' }
	];

	// Vérifier si l'un des éléments du menu de gestion des livres est actif
	const isBookManagementActive = bookManagementItems.some(
		item => location.pathname.includes(`/dashboard/${item.id}`)
	);

	// Ouvrir automatiquement le dropdown si un de ses éléments est actif
	useEffect(() => {
		if (isBookManagementActive && !isBookManagementOpen) {
			setIsBookManagementOpen(true);
		}
	}, [location.pathname, isBookManagementActive, isBookManagementOpen]);

	// Fermer la sidebar mobile lors du changement de route
	useEffect(() => {
		setIsMobileOpen(false);
	}, [location.pathname, setIsMobileOpen]);

	const toggleBookManagement = () => {
		setIsBookManagementOpen(!isBookManagementOpen);
	};

	const renderLogo = () => {
		if (!config?.Logo) return null;
		return (
			<img
				src={config.Logo}
				alt={`${config.Name} Logo`}
				className="w-10 h-10 object-contain"
				onError={(e) => {
					console.error("Failed to load logo:", config.Logo);
					e.currentTarget.style.display = "none";
				}}
			/>
		);
	};

	const renderIcon = (iconName: string) => {
		switch (iconName) {
			case 'chart-pie':
				return (
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
					</svg>
				);
			case 'book-open':
				return (
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13M12 6.253C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253M12 6.253C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
					</svg>
				);
			case 'academic-cap':
				return (
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
					</svg>
				);
			case 'users':
				return (
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
					</svg>
				);
			case 'clipboard-list':
				return (
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
					</svg>
				);
			case 'clipboard-check':
				return (
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
					</svg>
				);
			case 'cog':
				return (
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
					</svg>
				);
			case 'library':
				return (
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
					</svg>
				);
			case 'archive':
				return (
					<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7M4 7h16M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2" />
					</svg>
				);
			default:
				return null;
		}
	};

	const handleLogout = async () => {
		try {
			await logout();
			navigate('/');
		} catch (error) {
			console.error("Erreur lors de la déconnexion :", error);
		}
	};

	return (
		<>
			{/* Overlay pour mobile */}
			{isMobileOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
					onClick={() => setIsMobileOpen(false)}
				/>
			)}

			{/* Sidebar */}
			<div className={`bg-secondary-100 w-64 shadow-md fixed h-full flex-col z-50 transition-transform duration-300 ease-in-out ${
				isMobileOpen ? 'translate-x-0' : '-translate-x-full'
			} md:translate-x-0 md:flex`}>
				{/* Header avec bouton de fermeture pour mobile */}
				<div className="p-6 border-b border-secondary-300 flex justify-between items-center">
					<NavLink to="/" className="flex items-center space-x-3">
						<div className="flex items-center space-x-3">
							{renderLogo()}
							<h1 className="text-lg font-bold text-primary">{config.Name}</h1>
						</div>
					</NavLink>
					{/* Bouton de fermeture visible uniquement sur mobile */}
					<button
						onClick={() => setIsMobileOpen(false)}
						className="md:hidden text-primary-800 hover:text-primary"
					>
						<FiX className="w-6 h-6" />
					</button>
				</div>

				<nav className="mt-6 flex-grow overflow-y-auto">
					<div className="px-6 pb-4">
						<p className="text-xs font-medium text-primary-800 uppercase tracking-wider mb-4">
							{t('components:sidebar.main')}
						</p>
						<ul className="space-y-2">
							{sidebarItems.filter(i => i.id === 'overview').map(item => (
								<li key={item.id}>
									<NavLink to="/dashboard" className={({ isActive }) => `flex items-center w-full px-4 py-2 rounded-md transition-colors ${
										isActive ? 'bg-primary text-white' : 'hover:bg-secondary-300 text-primary-800'
									}`} end>
										<span className="mr-3">{renderIcon(item.icon)}</span>
										<span>{item.label}</span>
									</NavLink>
								</li>
							))}

							<li>
								<button
									onClick={toggleBookManagement}
									className={`flex items-center justify-between w-full px-4 py-2 rounded-md transition-colors ${
										isBookManagementActive 
											? 'bg-primary text-white' 
											: 'hover:bg-secondary-300 text-primary-800'
									}`}
								>
									<div className="flex items-center">
										<span className="mr-3">{renderIcon('library')}</span>
										<span>{t('components:sidebar.documents')}</span>
									</div>
									{isBookManagementOpen ? <FiChevronDown className="w-4 h-4" /> : <FiChevronRight className="w-4 h-4" />}
								</button>

								{isBookManagementOpen && (
									<ul className="mt-2 ml-6 space-y-1">
										{bookManagementItems.map(item => (
											<li key={item.id}>
												<NavLink to={`/dashboard/${item.id}`} className={({ isActive }) => `flex items-center w-full px-4 py-2 rounded-md transition-colors text-sm ${
													isActive ? 'bg-primary text-white' : 'hover:bg-secondary-300 text-primary-700'
												}`}>
													<span className="mr-3">{renderIcon(item.icon)}</span>
													<span>{item.label}</span>
												</NavLink>
											</li>
										))}
									</ul>
								)}
							</li>

							{sidebarItems.filter(i => i.id !== 'overview').map(item => (
								<li key={item.id}>
									<NavLink to={`/dashboard/${item.id}`} className={({ isActive }) => `flex items-center w-full px-4 py-2 rounded-md transition-colors ${
										isActive ? 'bg-primary text-white' : 'hover:bg-secondary-300 text-primary-800'
									}`}>
										<span className="mr-3">{renderIcon(item.icon)}</span>
										<span>{item.label}</span>
									</NavLink>
								</li>
							))}
						</ul>
					</div>
				</nav>

				<div className="mt-auto p-6 border-t border-secondary-300">
					<button
						onClick={handleLogout}
						className="flex items-center w-full px-4 py-2 rounded-md transition-colors text-red-600 hover:bg-red-100 hover:text-red-800"
					>
						<span className="mr-3"><BiLogOut className="w-5 h-5" /></span>
						<span>{t('components:sidebar.logout')}</span>
					</button>
				</div>
			</div>
		</>
	);
};

export default Sidebar;