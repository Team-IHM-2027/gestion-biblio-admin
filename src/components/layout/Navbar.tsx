// src/components/layout/Navbar.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { BiSearch, BiUserCircle, BiMessageDetail, BiBell, BiCheck, BiTrash } from 'react-icons/bi';
import { IoIosArrowBack } from 'react-icons/io';
import LanguageSwitcher from '../common/LanguageSwitcher';
import useI18n from '../../hooks/useI18n';
import { useSearchContext } from '../../context/SearchContext';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { usePendingReservations } from '../../hooks/usePendingReservations';
import { loanService } from '../../services/loanService';
import { notificationService } from '../../services/notificationService';
import { useEffect } from 'react';

const Navbar: React.FC = () => {
	const { searchWord, setSearchWord, onSearch } = useSearchContext();
	const location = useLocation();
	const navigate = useNavigate();
	const { t } = useI18n();

	const unreadMessagesCount = useUnreadCount(); // Example count
	const { pendingCount, notifications, loading } = usePendingReservations();
	const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
	const notificationsRef = React.useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Calculate overdue loans on mount
		loanService.checkOverdueLoans();
	}, []);

	// Handle clicks outside to close
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
				setIsNotificationsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const shouldShowSearch = onSearch !== null;

	const handleMessagesClick = () => {
		navigate('/dashboard/messages');
	};

	const handleNotificationsClick = () => {
		setIsNotificationsOpen(!isNotificationsOpen);
	};

	const handleDeleteNotification = async (e: React.MouseEvent, notifId: string) => {
		e.stopPropagation();
		try {
			await notificationService.deleteNotification(notifId, 'LibrarianNotifications');
		} catch (error) {
			console.error("Failed to delete notification", error);
		}
	};

	const handleMarkAsRead = async (e: React.MouseEvent, notifId: string) => {
		e.stopPropagation();
		try {
			await notificationService.markAsRead(notifId, 'LibrarianNotifications');
		} catch (error) {
			console.error("Failed to mark notification as read", error);
		}
	};

	/**
	 * Intelligently determines the title to display in the navbar based on the current URL.
	 * It handles static routes and dynamic routes with parameters.
	 */
	const getCurrentSectionName = () => {
		// 1. Get the path and split it into clean segments.
		// e.g., "/dashboard/books/Genie%20Informatique" -> ['dashboard', 'books', 'Genie%20Informatique']
		const pathSegments = location.pathname.split('/').filter(Boolean);

		if (pathSegments.length === 0) return t('pages:dashboard.overview');

		// 2. Check if we are inside the dashboard section.
		if (pathSegments[0] === 'dashboard') {
			if (pathSegments.length === 1) {
				return t('pages:dashboard.overview'); // Base /dashboard route
			}

			const mainSection = pathSegments[1]; // e.g., 'books'
			const dynamicParam = pathSegments[2]; // e.g., 'Genie%20Informatique'

			// 3. If a dynamic parameter exists, decode it for display.
			if (dynamicParam) {
				// This is the key change: decode the URL-encoded string.
				const decodedParam = decodeURIComponent(dynamicParam);
				const sectionTitle = t(`pages:dashboard.${mainSection}`, { defaultValue: mainSection.charAt(0).toUpperCase() + mainSection.slice(1) });
				// Return a combined title, e.g., "Books: Genie Informatique"
				return `${sectionTitle}: ${decodedParam}`;
			}

			// 4. For static dashboard sections like /dashboard/users.
			return t(`pages:dashboard.${mainSection}`, { defaultValue: mainSection.charAt(0).toUpperCase() + mainSection.slice(1) });
		}


		// 5. Fallback for any other top-level routes.
		return pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1);
	};

	// const shouldShowSearch = () => location.pathname.includes('/books') || location.pathname.includes('/users');
	const shouldShowBackButton = () => location.pathname !== '/dashboard';
	const goBack = () => navigate(-1);
	const goToProfile = () => navigate('/dashboard/profile'); // ✅ Correction: ajouter /dashboard

	return (
		<header className="bg-white shadow-sm sticky top-0 z-10">
			<div className="px-6 py-3 flex items-center justify-between flex-wrap">
				{/* Left section */}
				<div className="flex items-center">
					{shouldShowBackButton() && (
						<button onClick={goBack} className="mr-3 p-2 rounded-full hover:bg-secondary-100" title={t('components:navbar.back')}>
							<IoIosArrowBack className="text-primary-800 text-xl" />
						</button>
					)}
					<h1 className="text-xl font-semibold text-gray-800">
						{getCurrentSectionName()}
					</h1>
				</div>

				{/* Center section with a smarter search bar */}
				<div className="flex-grow max-w-lg mx-4 hidden md:block">
					{shouldShowSearch && (
						<div className="relative">
							<input
								type="text"
								value={searchWord}
								onChange={(e) => setSearchWord(e.target.value)}
								placeholder={t('common:search_placeholder')}
								className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
							/>
							<BiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
						</div>
					)}
				</div>

				{/* Right section */}
				<div className="flex items-center space-x-2">
					<LanguageSwitcher />

					<div className="relative" ref={notificationsRef}>
						<button
							onClick={handleNotificationsClick}
							className="relative p-2 rounded-full hover:bg-secondary-100 outline-none"
							title={t('components:navbar.navbar_notifications')}
						>
							<BiBell className="text-primary-800 text-xl" />
							{pendingCount > 0 && (
								<span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center animate-pulse">
									{pendingCount}
								</span>
							)}
						</button>

						{isNotificationsOpen && (
							<div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 py-3 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
								<div className="px-4 pb-3 border-b border-gray-100 flex justify-between items-center">
									<span className="font-bold text-gray-800">{t('components:navbar.navbar_notifications')}</span>
									{pendingCount > 0 && (
										<span className="text-xs bg-red-100 text-red-600 px-2.5 py-1 rounded-full font-bold">
											{pendingCount} {t('common:pending')}
										</span>
									)}
								</div>

								<div className="max-h-[400px] overflow-y-auto">
									{loading ? (
										<div className="p-8 text-center">
											<div className="w-8 h-8 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mx-auto mb-3"></div>
											<p className="text-gray-500 text-sm">{t('common:loading')}</p>
										</div>
									) : notifications.length > 0 ? (
										<div className="divide-y divide-gray-50">
											{notifications.map((notif) => (
												<div
													key={notif.id}
													className="px-4 py-4 hover:bg-primary-50/30 cursor-pointer transition-colors group"
													onClick={() => {
														setIsNotificationsOpen(false);
														// Route based on status
														if (notif.status === 'ready_for_pickup') {
															navigate('/dashboard/validated-reservations');
														} else {
															navigate('/dashboard/reservations');
														}
													}}
												>
													<div className="flex justify-between items-start mb-1">
														<div className="flex flex-col">
															<span className="font-bold text-sm text-gray-900 group-hover:text-primary-700">{notif.userName}</span>
															{notif.status === 'ready_for_pickup' && (
																<span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold w-fit mt-0.5">
																	Prêt pour retrait
																</span>
															)}
														</div>
														<span className="text-[10px] text-gray-400 font-medium whitespace-nowrap ml-2">
															{notif.timestamp?.toDate
																? notif.timestamp.toDate().toLocaleDateString()
																: new Date(notif.timestamp).toLocaleDateString()}
														</span>
													</div>
													<p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{notif.message}</p>
													<div className="mt-2 flex items-center justify-between">
														<div className="text-[10px] text-primary-600 font-bold bg-primary-50 w-fit px-2 py-0.5 rounded">
															<span className="truncate max-w-[120px]">{notif.data?.bookTitle}</span>
														</div>
														<div className="flex space-x-2">
															{!notif.read && (
																<button
																	onClick={(e) => handleMarkAsRead(e, notif.id)}
																	className="p-1 hover:bg-green-100 rounded-full text-green-600 transition-colors"
																	title={t('common:mark_as_read')}
																>
																	<BiCheck size={16} />
																</button>
															)}
															<button
																onClick={(e) => handleDeleteNotification(e, notif.id)}
																className="p-1 hover:bg-red-100 rounded-full text-red-600 transition-colors"
																title={t('common:delete')}
															>
																<BiTrash size={16} />
															</button>
														</div>
													</div>
												</div>
											))}
										</div>
									) : (
										<div className="p-10 text-center">
											<div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
												<BiBell className="text-gray-300 text-3xl" />
											</div>
											<p className="text-gray-500 text-sm font-medium">{t('components:reservations.no_active_reservations')}</p>
											<p className="text-gray-400 text-xs mt-1">{t('components:reservations.no_pending_message', { defaultValue: 'No pending requests at the moment.' })}</p>
										</div>
									)}
								</div>

								<div className="bg-gray-50/80 px-4 py-3 text-center border-t border-gray-100">
									<button
										onClick={() => {
											setIsNotificationsOpen(false);
											navigate('/dashboard/reservations');
										}}
										className="text-xs text-primary-600 font-bold hover:text-primary-700 transition-colors"
									>
										{t('components:sidebar.reservations', { defaultValue: 'View all reservations' })}
									</button>
								</div>
							</div>
						)}
					</div>

					<button onClick={handleMessagesClick} className="relative p-2 rounded-full hover:bg-secondary-100" title={t('components:navbar.messages')}>

						<BiMessageDetail className="text-primary-800 text-xl" />
						{unreadMessagesCount > 0 && (
							<span className="absolute top-0 right-0 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center animate-pulse">
								{unreadMessagesCount}
							</span>
						)}
					</button>

					{/* ✅ Correction: onClick sur le bouton parent */}
					<button
						onClick={goToProfile}
						className="flex items-center space-x-2 ml-2 p-1 rounded-full hover:bg-secondary-100 cursor-pointer"
						title={t('components:navbar.profile')}
					>
						<BiUserCircle className="text-primary-800 text-2xl" />

					</button>
				</div>
			</div>
		</header>
	);
};

export default Navbar;
