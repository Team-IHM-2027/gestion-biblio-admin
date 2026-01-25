// components/loans/DocumentLoanItem.tsx
import React from 'react';
import { FaBook, FaCalendarAlt, FaCheckCircle, FaClock } from 'react-icons/fa';
import type { DocumentLoanItemProps } from '../../types';
import useI18n from '../../hooks/useI18n';

// Type Guard pour vérifier si l'objet ressemble à un Timestamp de Firestore
const isFirestoreTimestamp = (data: any): data is { seconds: number, nanoseconds: number } =>
  typeof data === 'object' && data !== null && 'seconds' in data && 'nanoseconds' in data;

const DocumentLoanItem: React.FC<DocumentLoanItemProps> = ({ document, isProcessing, onReturn }) => {
  const { t } = useI18n();

  const formatDate = (date: any): string => {
    try {
      let jsDate: Date;

      // Si c'est un Timestamp Firestore
      if (isFirestoreTimestamp(date)) {
        jsDate = new Date(date.seconds * 1000);
      }
      // Si c'est déjà un objet Date (Correction: Utilisation d'assertion d'objet pour calmer ts(2358))
      else if (date && typeof date === 'object' && (date as object) instanceof Date) {
        jsDate = date as Date; // Assertion finale du type Date
      }
      // Si c'est une string
      else if (typeof date === 'string') {
        jsDate = new Date(date);
        if (isNaN(jsDate.getTime())) {
          return 'Date invalide';
        }
      } else {
        return 'Date invalide';
      }

      return jsDate.toLocaleString('fr-FR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date invalide';
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
      {/* Document Info */}
      <div className="flex-1 flex items-center space-x-4 min-w-0">
        {/* Image */}
        <div className="flex-shrink-0">
          {document.imageUrl ? (
            <img
              src={document.imageUrl}
              alt={document.name}
              className="w-16 h-20 object-cover rounded border shadow-sm"
            />
          ) : (
            <div className="w-16 h-20 bg-gray-200 rounded border flex items-center justify-center">
              <FaBook className="text-gray-400 text-lg" />
            </div>
          )}
        </div>

        {/* Text Info - MODIFIÉ (Tâche 4, Points 1, 2, 3) */}
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate mb-1">
            {document.name}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">

            {/* Date d'emprunt */}
            <span className="flex items-center">
              <FaCalendarAlt className="inline mr-1 text-primary-500" size={10} />
              {t('components:loans.borrowed_on')}:{' '}
              <span className="font-medium ml-1">{formatDate(document.borrowDate).split(',')[0]}</span>
            </span>

            {/* Calcul et affichage de la date de retour prévue (14 jours) */}
            {(() => {
              try {
                const rawDate = document.borrowDate;
                let borrowDate: Date | null = null;

                // Si c'est un Timestamp Firestore
                if (isFirestoreTimestamp(rawDate)) {
                  borrowDate = new Date(rawDate.seconds * 1000);
                }
                // Si c'est une string
                else if (typeof rawDate === 'string') {
                  borrowDate = new Date(rawDate);
                }
                // Correction Finale: Utilisation d'assertion de type pour résoudre ts(2358)
                else if (rawDate && typeof rawDate === 'object') {
                  if ((rawDate as object) instanceof Date) {
                    borrowDate = rawDate as Date;
                  }
                }

                if (!borrowDate || isNaN(borrowDate.getTime())) return null;

                const dueDate = new Date(borrowDate.getTime());
                dueDate.setDate(borrowDate.getDate() + 3); // Ajout de 3 jours (Politique de la bibliothèque)

                const formattedDueDate = dueDate.toLocaleDateString('fr-FR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                });

                return (
                  <span className="flex items-center text-red-600 font-medium">
                    <FaClock className="inline mr-1" size={10} />
                    {t('components:loans.due_date') || 'Retour Prévu'}: {formattedDueDate}
                  </span>
                );
              } catch (e) {
                return null;
              }
            })()}
            {/* Suppression de l'affichage de la collection {document.collection} (Tâche 4, Point 3) */}
          </div>
        </div>
      </div>

      {/* Return Button (inchangé) */}
      <div className="ml-4 flex-shrink-0 w-32">
        <button
          onClick={onReturn}
          disabled={isProcessing}
          className={`
            flex items-center justify-center space-x-2 w-full px-3 py-2 rounded-md text-sm font-medium transition-colors
            ${isProcessing
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-primary text-white hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1'
            }
          `}
        >
          {isProcessing ? (
            <>
              <FaClock className="animate-spin" size={14} />
              <span>{t('components:loans.processing')}</span>
            </>
          ) : (
            <>
              <FaCheckCircle size={14} />
              <span>{t('components:loans.confirm_return')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default DocumentLoanItem;