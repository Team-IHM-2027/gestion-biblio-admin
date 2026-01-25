// pages/Loans.tsx
import React from 'react';
import { FaBook } from 'react-icons/fa';
import { useLoans, usePagination } from '../hooks/useLoans';
import useI18n from '../hooks/useI18n';
import LoanCard from '../components/loans/LoanCard';
import Pagination from '../components/common/Pagination';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';
import Notification from '../components/common/Notification';
import type { ProcessedUserLoan } from '../types';

const Loans: React.FC = () => {
  const { t } = useI18n();
  const {
    loans,
    loading,
    processingItem,
    notification,
    maxLoans,
    returnDocument
  } = useLoans();

  const {
    currentItems,
    currentPage,
    totalPages,
    hasNextPage,
    hasPrevPage,
    nextPage,
    prevPage,
    goToPage
  } = usePagination(loans, 5);

  const handleReturnDocument = async (user: ProcessedUserLoan, slot: number) => {
    await returnDocument(user, slot, t);
  };

  const handleNewLoan = () => {
    // Logique pour créer un nouvel emprunt
    // À implémenter selon vos besoins
    console.log('Créer un nouvel emprunt');
  };

  // Calculer le total des emprunts actifs
  const totalActiveLoans = loans.reduce((total, user) => total + user.totalActiveLoans, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <FaBook className="text-primary-600" size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {t('components:loans.title')}
              </h1>
              <p className="text-sm text-gray-600">
                {t('components:loans.subtitle', {
                  userCount: loans.length,
                  loanCount: totalActiveLoans,
                  maxLoans: maxLoans
                })}
              </p>
            </div>
          </div>

          {/* Actions */}
          {/* <div className="flex items-center space-x-3">
            <button
              onClick={handleNewLoan}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <FaPlus size={14} />
              <span>{t('components:loans.register_loan')}</span>
            </button>
          </div> */}
        </div>
      </div>

      {/* Content */}
      <div className="px-6 py-6">
        {loading ? (
          /* Loading State */
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner
              size="lg"
              text={t('components:loans.loading')}
            />
          </div>
        ) : loans.length === 0 ? (
          /* Empty State */
          <EmptyState
            icon={<FaBook />}
            title={t('components:loans.no_loans')}
            description={t('components:loans.no_loans_message')}
            action={{
              label: t('components:loans.new_loan'),
              onClick: handleNewLoan,
              variant: 'primary'
            }}
          />
        ) : (
          /* Loans List */
          <div className="max-w-4xl mx-auto">
            {/* Loans Cards */}
            <div className="space-y-6 mb-8">
              {currentItems.map((user) => (
                <LoanCard
                  key={user.email}
                  user={user}
                  processingItem={processingItem}
                  onReturnDocument={handleReturnDocument}
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

export default Loans;