import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BiLogOut } from 'react-icons/bi';
import { FiMoreHorizontal } from 'react-icons/fi';
import useI18n from '../../hooks/useI18n';
import { useSystemAlerts } from '../../hooks/useSystemAlerts';

const MobileBottomSidebar: React.FC = () => {
	const { t } = useI18n();
	const navigate = useNavigate();
	const [showMoreMenu, setShowMoreMenu] = useState(false);
	const { alerts } = useSystemAlerts();
	const latestAlertId = alerts[0]?.id;
	const getLastAcknowledgedAlertId = () => {
		if (typeof window === 'undefined') return null;
		try {
			return window.localStorage.getItem('lastAcknowledgedAlertId');
		} catch (error) {
			console.error('Unable to read localStorage for alerts:', error);
			return null;
		}
	};
	const hasPendingAlert = Boolean(latestAlertId && latestAlertId !== getLastAcknowledgedAlertId());

	// Items principaux (4 max pour mobile)
	const mainItems = [
		{ id: 'overview', label: t('components:sidebar.overview'), icon: 'chart-pie', route: '/dashboard' },
		{ id: 'books', label: t('components:sidebar.book_management'), icon: 'book-open', route: '/dashboard/books' },
		{ id: 'users', label: t('components:sidebar.users'), icon: 'users', route: '/dashboard/users' },
		{ id: 'loans', label: t('components:sidebar.loans'), icon: 'clipboard-list', route: '/dashboard/loans' }
	];

	// Items secondaires (dans le menu "Plus")
	const moreItems = [
		{ id: 'thesis', label: t('components:sidebar.memory_management'), icon: 'academic-cap', route: '/dashboard/thesis' },
		{ id: 'reservations', label: t('components:sidebar.reservations'), icon: 'clipboard-check', route: '/dashboard/reservations' },
		{ id: 'validated-reservations', label: t('components:sidebar.validated_reservations'), icon: 'check-circle', route: '/dashboard/validated-reservations' },
		{ id: 'archives', label: t('components:sidebar.archives'), icon: 'archive', route: '/dashboard/archives' },
		{ id: 'settings', label: t('components:sidebar.settings'), icon: 'cog', route: '/dashboard/settings' },
	];

	const toggleMoreMenu = () => {
		setShowMoreMenu(!showMoreMenu);
	};

	const closeMoreMenu = () => {
		setShowMoreMenu(false);
	};

	const handleLogout = () => {
		// Handle logout logic here
		navigate('/');
		closeMoreMenu();
	};

	const renderIcon = (iconName: string, className: string = "w-5 h-5") => {
		switch (iconName) {
			case 'chart-pie':
				return (
					<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"></path>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"></path>
					</svg>
				);
			case 'book-open':
				return (
					<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
					</svg>
				);
			case 'users':
				return (
					<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
					</svg>
				);
			case 'clipboard-list':
				return (
					<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
					</svg>
				);
			case 'academic-cap':
				return (
					<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z"></path>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path>
					</svg>
				);
			case 'clipboard-check':
				return (
					<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
					</svg>
				);
			case 'cog':
				return (
					<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
					</svg>
				);
			case 'check-circle':
				return (
					<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				);
			case 'archive':
				return (
					<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12v7a2 2 0 01-2 2H6a2 2 0 01-2-2v-7M4 7h16M4 7V5a2 2 0 012-2h12a2 2 0 012 2v2" />
					</svg>
				);

			default:
				return null;
		}
	};

	return (
		<>
			{/* Overlay pour fermer le menu */}
			{showMoreMenu && (
				<div
					className="fixed inset-0 bg-black bg-opacity-25 z-40"
					onClick={closeMoreMenu}
				/>
			)}

			{/* Menu "Plus" */}
			{showMoreMenu && (
				<div className="fixed bottom-20 left-4 right-4 bg-white rounded-xl shadow-lg z-50 p-4">
					<div className="grid grid-cols-2 gap-4">
						{moreItems.map(item => (
							<NavLink
								key={item.id}
								to={item.route}
								onClick={closeMoreMenu}
								className={({ isActive }) => `flex flex-col items-center p-3 rounded-lg transition-colors ${isActive
									? 'bg-primary text-white'
									: 'hover:bg-gray-100 text-gray-600'
									}`}
							>
								{renderIcon(item.icon, "w-6 h-6")}
								<span className="text-xs mt-1 text-center relative">
									{item.label}
									{item.id === 'settings' && hasPendingAlert && (
										<span className="absolute -top-1 -right-3 w-2 h-2 bg-red-500 rounded-full" />
									)}
								</span>
							</NavLink>
						))}

						{/* Bouton de déconnexion */}
						<button
							onClick={handleLogout}
							className="flex flex-col items-center p-3 rounded-lg transition-colors text-red-600 hover:bg-red-50"
						>
							<BiLogOut className="w-6 h-6" />
							<span className="text-xs mt-1">{t('components:sidebar.logout')}</span>
						</button>
					</div>
				</div>
			)}

			{/* Bottom Navigation Bar */}
			<nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-30">
				<div className="flex justify-around items-center">
					{mainItems.map(item => (
						<NavLink
							key={item.id}
							to={item.route}
							className={({ isActive }) => `flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${isActive
								? 'text-primary'
								: 'text-gray-500 hover:text-gray-700'
								}`}
							end={item.id === 'overview'}
						>
							{renderIcon(item.icon, "w-5 h-5")}
							<span className="text-xs mt-1">{item.label}</span>
						</NavLink>
					))}

					{/* Bouton "Plus" */}
					<button
						onClick={toggleMoreMenu}
						className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${showMoreMenu
							? 'text-primary'
							: 'text-gray-500 hover:text-gray-700'
							}`}
					>
						<FiMoreHorizontal className="w-5 h-5" />
						<span className="text-xs mt-1">{t('components:sidebar.more')}</span>
					</button>
				</div>
			</nav>
		</>
	);
};

export default MobileBottomSidebar;
