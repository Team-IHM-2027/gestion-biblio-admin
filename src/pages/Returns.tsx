// pages/Reservations.tsx
import React from 'react';
import { FaClock, FaCheckCircle } from 'react-icons/fa';
import { useReservations } from '../hooks/useReservations';
import { usePagination } from '../hooks/useLoans';
import useI18n from '../hooks/useI18n';

import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Notification from '../components/common/Notification';

import ReservationCard from '../components/reservations/ReservationsCard';
import type { ProcessedUserReservation } from '../types/reservations';

const Reservations: React.FC = () => {
  const { t } = useI18n();
  const {
    reservations,
    loading,
    processingItem,
    notification,
    maxLoans,
    approveReservation
  } = useReservations('reserv');

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

  const handleValidateReservation = async (user: ProcessedUserReservation, slot: number) => {
    await approveReservation(user, slot, t);
  };

  // Calculer le total des réservations actives
  const totalActiveReservations = reservations.reduce((total, user) => total + user.totalActiveReservations, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FaClock className="text-yellow-600" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('components:reservations.title') || 'Demandes de Réservation'}
              </h1>
              <p className="text-sm text-gray-600">
                {t('components:reservations.subtitle', {
                  userCount: reservations.length,
                  resCount: totalActiveReservations,
                  maxLoans: maxLoans
                })}
              </p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="hidden md:flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{totalActiveReservations}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">{t('components:reservations.pending')}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{maxLoans}</div>
              <div className="text-xs text-gray-500 uppercase tracking-wide">Max/utilisateur</div>
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
            icon={<FaClock />}
            title={t('components:reservations.no_reservations')}
            description={t('components:reservations.no_reservations_message')}
            size="lg"
          />
        ) : (
          /* Reservations List */
          <div className="max-w-4xl mx-auto">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaCheckCircle className="h-5 w-5 text-blue-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    {t('components:reservations.validation_info') || 'Validez les demandes pour les préparer au retrait.'}
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
                  onValidateReservation={handleValidateReservation}
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

export default Reservations;