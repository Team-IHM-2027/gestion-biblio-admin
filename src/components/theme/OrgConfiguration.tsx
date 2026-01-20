import React, { useEffect, useState } from 'react';
import { useConfig } from './ConfigProvider.tsx';
import { Modal } from '../common/Modal';
import { useSystemAlerts } from '../../hooks/useSystemAlerts';
import type { SystemAlert } from '../../hooks/useSystemAlerts';

// Helper function to parse opening hours from JSON string
const parseOpeningHours = (hoursString: string) => {
	try {
		return JSON.parse(hoursString);
	} catch (error) {
		console.error('Failed to parse opening hours:', hoursString, error);
		return { open: "Unknown", close: "Unknown" };
	}
};

const OrgConfiguration: React.FC = () => {
	const { config, loading } = useConfig();
	const { alerts } = useSystemAlerts();
	const [isAlertOpen, setIsAlertOpen] = useState(false);
	const [activeAlert, setActiveAlert] = useState<SystemAlert | null>(null);

	useEffect(() => {
		if (!alerts.length) return;
		const latest = alerts[0];
		if (typeof window === 'undefined') return;
		let lastAck: string | null = null;
		try {
			lastAck = window.localStorage.getItem('lastAcknowledgedAlertId');
		} catch (error) {
			console.error('Unable to read localStorage for alerts:', error);
		}
		if (latest.id && latest.id !== lastAck) {
			setActiveAlert(latest);
			setIsAlertOpen(true);
		}
	}, [alerts]);

	const handleAlertAck = () => {
		if (activeAlert?.id && typeof window !== 'undefined') {
			try {
				window.localStorage.setItem('lastAcknowledgedAlertId', activeAlert.id);
			} catch (error) {
				console.error('Unable to write localStorage for alerts:', error);
			}
		}
		setIsAlertOpen(false);
	};

	if (loading) {
		return (
			<div className="text-center p-8">
				<div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
				<p className="mt-4 text-gray-600">Loading organization configuration...</p>
			</div>
		);
	}

	// Debug output
	console.log('Rendering OrgConfiguration with config:', config);

	return (
		<div className="bg-white p-6 rounded-lg shadow-md">
			<Modal
				isOpen={isAlertOpen}
				onClose={handleAlertAck}
				title={activeAlert?.title || 'Alerte'}
			>
				<p className="text-gray-700 mb-6">
					{activeAlert?.message || 'Une mise a jour vient d\'etre effectuee.'}
				</p>
				<div className="flex justify-end">
					<button
						onClick={handleAlertAck}
						className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
					>
						OK
					</button>
				</div>
			</Modal>
			{/* Debug info - can be removed in production */}
			<div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
				<p>Current time: {new Date().toISOString()}</p>
				<p>Config data loaded: {config ? 'Yes' : 'No'}</p>
				<p>Organization name: {config?.Name || 'Not set'}</p>
			</div>

			{/* Header with organization info */}
			<div className="flex items-center space-x-6 mb-8">
				{config?.Logo && (
					<img
						src={config.Logo}
						alt={`${config.Name} Logo`}
						className="w-16 h-16 object-contain"
						onError={(e) => {
							console.error('Failed to load logo');
							// Set a default image or hide the element
							e.currentTarget.style.display = 'none';
						}}
					/>
				)}
				<div>
					<h1 className="text-3xl font-bold text-gray-800">
						{config?.Name || 'Organization Name'}
					</h1>
					{config?.Address && (
						<p className="text-gray-600 mt-1">{config.Address}</p>
					)}
				</div>
			</div>

			{/* Contact Information */}
			<div className="grid md:grid-cols-2 gap-8 mb-8">
				<div className="bg-gray-50 p-6 rounded-lg">
					<h2 className="text-xl font-semibold mb-4 text-gray-800">Contact Information</h2>
					<div className="space-y-3">
						{config?.Contact?.Phone && (
							<div className="flex items-center">
								<span className="font-medium text-gray-600 w-24">Phone:</span>
								<span>{config.Contact.Phone}</span>
							</div>
						)}
						{config?.Contact?.WhatsApp && (
							<div className="flex items-center">
								<span className="font-medium text-gray-600 w-24">WhatsApp:</span>
								<span>{config.Contact.WhatsApp}</span>
							</div>
						)}
						{config?.Contact?.Email && (
							<div className="flex items-center">
								<span className="font-medium text-gray-600 w-24">Email:</span>
								<span>{config.Contact.Email}</span>
							</div>
						)}
						{config?.Contact?.Facebook && (
							<div className="flex items-center">
								<span className="font-medium text-gray-600 w-24">Facebook:</span>
								<a href={config.Contact.Facebook} className="text-blue-600 hover:underline">
									Facebook Page
								</a>
							</div>
						)}
						{config?.Contact?.Instagram && (
							<div className="flex items-center">
								<span className="font-medium text-gray-600 w-24">Instagram:</span>
								<a href={config.Contact.Instagram} className="text-blue-600 hover:underline">
									Instagram Page
								</a>
							</div>
						)}
					</div>
				</div>

				{/* Opening Hours */}
				<div className="bg-gray-50 p-6 rounded-lg">
					<h2 className="text-xl font-semibold mb-4 text-gray-800">Opening Hours</h2>
					<div className="space-y-2">
						{config?.OpeningHours && Object.entries(config.OpeningHours).map(([day, hours]) => {
							try {
								const parsedHours = parseOpeningHours(hours);
								return (
									<div key={day} className="flex justify-between">
										<span className="font-medium text-gray-600">{day}:</span>
										<span>
                      {parsedHours.open === 'closed'
	                      ? 'Closed'
	                      : `${parsedHours.open} - ${parsedHours.close}`
                      }
                    </span>
									</div>
								);
							} catch (error) {
								console.error(`Error rendering opening hours for ${day}:`, error);
								return (
									<div key={day} className="flex justify-between text-red-500">
										<span className="font-medium">{day}:</span>
										<span>Error displaying hours</span>
									</div>
								);
							}
						})}
					</div>
				</div>
			</div>

			{/* Rules and Policies */}
			<div className="grid md:grid-cols-2 gap-8">
				<div className="bg-blue-50 p-6 rounded-lg">
					<h2 className="text-xl font-semibold mb-4 text-gray-800">Borrowing Rules</h2>
					<div className="mb-4">
						<span className="font-medium text-gray-600">Maximum Simultaneous Loans: </span>
						<span className="font-semibold">{config?.MaximumSimultaneousLoans || 'Not specified'}</span>
					</div>
					{config?.SpecificBorrowingRules && config.SpecificBorrowingRules.filter(rule => rule && rule.trim()).length > 0 && (
						<div>
							<h3 className="font-medium text-gray-600 mb-2">Specific Rules:</h3>
							<ul className="list-disc list-inside space-y-1">
								{config.SpecificBorrowingRules
									.filter(rule => rule && rule.trim())
									.map((rule, index) => (
										<li key={index} className="text-gray-700">{rule}</li>
									))}
							</ul>
						</div>
					)}
				</div>

				<div className="bg-red-50 p-6 rounded-lg">
					<h2 className="text-xl font-semibold mb-4 text-gray-800">Late Return Penalties</h2>
					{config?.LateReturnPenalties && config.LateReturnPenalties.filter(penalty => penalty && penalty.trim()).length > 0 ? (
						<ul className="list-disc list-inside space-y-1">
							{config.LateReturnPenalties
								.filter(penalty => penalty && penalty.trim())
								.map((penalty, index) => (
									<li key={index} className="text-gray-700">{penalty}</li>
								))}
						</ul>
					) : (
						<p className="text-gray-600">No specific penalties defined</p>
					)}
				</div>
			</div>

			{/* Theme Colors */}
			{config?.Theme && (config.Theme.Primary || config.Theme.Secondary) && (
				<div className="mt-8 bg-gray-50 p-6 rounded-lg">
					<h2 className="text-xl font-semibold mb-4 text-gray-800">Theme Colors</h2>
					<div className="flex space-x-6">
						{config.Theme.Primary && (
							<div className="flex items-center space-x-2">
								<div
									className="w-8 h-8 rounded border"
									style={{ backgroundColor: config.Theme.Primary }}
								></div>
								<span>Primary: {config.Theme.Primary}</span>
							</div>
						)}
						{config.Theme.Secondary && (
							<div className="flex items-center space-x-2">
								<div
									className="w-8 h-8 rounded border"
									style={{ backgroundColor: config.Theme.Secondary }}
								></div>
								<span>Secondary: {config.Theme.Secondary}</span>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
};

export default OrgConfiguration;
