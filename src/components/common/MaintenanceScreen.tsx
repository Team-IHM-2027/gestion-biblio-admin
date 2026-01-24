import React from 'react';

const MaintenanceScreen: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center px-6">
            <div className="max-w-xl text-center space-y-4">
                <div className="mx-auto h-12 w-12 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                <h1 className="text-3xl font-semibold">Maintenance en cours</h1>
                <p className="text-white/80">
                    L'application est actuellement en maintenance. Veuillez revenir plus tard.
                </p>
            </div>
        </div>
    );
};

export default MaintenanceScreen;
