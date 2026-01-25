// pages/ValidatedReservations.tsx
import React from 'react';
import { FaCalendarCheck, FaCheckCircle, FaClipboardCheck } from 'react-icons/fa';
import { useReservations } from '../hooks/useReservations';
import { usePagination } from '../hooks/useLoans';
import useI18n from '../hooks/useI18n';

import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Notification from '../components/common/Notification';

import ReservationCard from '../components/reservations/ReservationsCard';
import type { ProcessedUserReservation } from '../types/reservations';

const ValidatedReservations: React.FC = () => {
    const { t } = useI18n();
    // Filter for 'valide' status which means "Validated/Approved" and ready for pickup
    const {
        reservations,
        loading,
        processingItem,
        notification,
        validateReservation
    } = useReservations('valide');

    const {
        currentItems,
        currentPage,
        totalPages,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
        goToPage
    } = usePagination(reservations, 5);

    const handleValidateLoan = async (user: ProcessedUserReservation, slot: number) => {
        // This will move it from 'valide' -> 'emprunt'
        await validateReservation(user, slot, t);
    };

    // Calculer le total des réservations validées
    const totalValidatedReservations = reservations.reduce((total, user) => total + user.totalActiveReservations, 0);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <FaClipboardCheck className="text-green-600" size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                {t('components:reservations.validated_title')}
                            </h1>
                            <p className="text-sm text-gray-600">
                                {t('components:reservations.validated_subtitle', {
                                    userCount: reservations.length,
                                    resCount: totalValidatedReservations
                                })}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
                {loading ? (
                    /* Loading State */
                    <div className="flex justify-center items-center py-20">
                        <LoadingSpinner
                            size="lg"
                            text={t('components:reservations.loading')}
                        />
                    </div>
                ) : reservations.length === 0 ? (
                    /* Empty State */
                    <EmptyState
                        icon={<FaCalendarCheck />}
                        title={t('components:reservations.no_validated_reservations')}
                        description={t('components:reservations.no_validated_message')}
                        size="lg"
                    />
                ) : (
                    /* Reservations List */
                    <div className="max-w-4xl mx-auto">
                        {/* Info Banner */}
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <FaCheckCircle className="h-5 w-5 text-green-400" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-green-700">
                                        {t('components:reservations.validated_info_banner')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Reservations Cards */}
                        <div className="space-y-6 mb-8">
                            {currentItems.map((user) => (
                                <ReservationCard
                                    key={user.email}
                                    user={user}
                                    processingItem={processingItem}
                                    onValidateReservation={handleValidateLoan}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                hasNextPage={hasNextPage}
                                hasPrevPage={hasPrevPage}
                                onNextPage={nextPage}
                                onPrevPage={prevPage}
                                onGoToPage={goToPage}
                                className="mt-8"
                            />
                        )}
                    </div>
                )}
            </div>

            {/* Notification */}
            <Notification
                visible={notification.visible}
                type={notification.type}
                message={notification.message}
                position="top-right"
            />
        </div>
    );
};

export default ValidatedReservations;
