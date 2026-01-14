import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, XCircle, Clock } from 'lucide-react';
import { notificationService } from '../services/notificationService';

const ReservationNotifications: React.FC = () => {
    const [pendingReservations, setPendingReservations] = useState<any[]>([]);
    const [showPanel, setShowPanel] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [librarianName] = useState(localStorage.getItem('librarianName') || 'Bibliothécaire');

    useEffect(() => {
        // Écouter les nouvelles demandes de réservation
        const unsubscribe = notificationService.subscribeToReservationRequests((notifications) => {
            const pending = notifications.filter(n => !n.read || !n.processed);
            setPendingReservations(pending);
            setUnreadCount(pending.length);
        });

        return () => unsubscribe();
    }, []);

    const handleApprove = async (reservation: any) => {
        try {
            // Ici, vous devrez obtenir le slotNumber depuis les données utilisateur
            // Pour simplifier, on utilise le slot 1
            await notificationService.processReservationRequest(
                reservation.id,
                'approved',
                librarianName,
                'Réservation approuvée'
            );
            
            alert('✅ Réservation approuvée');
        } catch (error) {
            console.error('Error approving reservation:', error);
            alert('❌ Erreur lors de l\'approbation');
        }
    };

    const handleReject = async (reservation: any) => {
        const reason = prompt('Raison du refus (optionnel):', 'Non disponible');
        
        if (reason === null) return;
        
        try {
            await notificationService.processReservationRequest(
                reservation.id,
                'rejected',
                librarianName,
                reason
            );
            
            alert('❌ Réservation refusée');
        } catch (error) {
            console.error('Error rejecting reservation:', error);
            alert('❌ Erreur lors du refus');
        }
    };

    return (
        <div className="relative">
            {/* Bouton de notification */}
            <button
                onClick={() => setShowPanel(!showPanel)}
                className="relative p-2 rounded-lg hover:bg-gray-100"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>

            {/* Panneau des notifications */}
            {showPanel && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4 border-b">
                        <h3 className="font-semibold">Demandes de réservation</h3>
                        <p className="text-sm text-gray-600">{pendingReservations.length} en attente</p>
                    </div>
                    
                    <div className="max-h-96 overflow-y-auto">
                        {pendingReservations.map(reservation => (
                            <div key={reservation.id} className="p-4 border-b">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className="font-medium">{reservation.data.userName}</h4>
                                        <p className="text-sm text-gray-600">{reservation.data.userEmail}</p>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(reservation.data.requestDate).toLocaleTimeString()}
                                    </span>
                                </div>
                                
                                <p className="text-sm mb-3">
                                    <strong>Livre:</strong> {reservation.data.bookTitle}
                                </p>
                                
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleApprove(reservation)}
                                        className="flex-1 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                    >
                                        <CheckCircle className="inline w-4 h-4 mr-1" />
                                        Approuver
                                    </button>
                                    <button
                                        onClick={() => handleReject(reservation)}
                                        className="flex-1 px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                    >
                                        <XCircle className="inline w-4 h-4 mr-1" />
                                        Refuser
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ReservationNotifications;