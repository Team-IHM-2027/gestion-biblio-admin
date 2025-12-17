// src/components/layout/AuthLayout.tsx
import React from 'react';
import { Outlet } from 'react-router-dom';
import { useConfig } from '../theme/ConfigProvider';
import Spinner from '../common/Spinner';

const AuthLayout: React.FC = () => {
	const { loading: configLoading } = useConfig();

	if (configLoading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-900">
				<Spinner />
			</div>
		);
	}

	return (
		<div className="min-h-screen w-full animated-gradient bg-gradient-to-br from-gray-900 via-primary-900 to-secondary-800">
			<main className="min-h-screen flex flex-col items-center justify-center p-4">
				{/* L'Outlet rendra le composant enfant (Login, Register, etc.) */}
				<Outlet />
			</main>
		</div>
	);
};

export default AuthLayout;