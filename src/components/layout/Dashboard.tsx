import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

import Navbar from './Navbar';
import MobileBottomSidebar from './MobileBottomSidebar';

const Dashboard: React.FC = () => {
	return (
		<div className="min-h-screen bg-gray-50">
			{/* Sidebar Desktop */}
			<Sidebar />

			{/* Bottom Navbar Mobile */}
			<MobileBottomSidebar />

			{/* Main Content Area */}
			<div className="md:ml-64 pb-16 md:pb-0">
				{/* Top Navbar */}
				<Navbar />

				{/* Page Content */}
				<main className="p-4">
					<Outlet />
				</main>
			</div>
		</div>
	);
};

export default Dashboard;