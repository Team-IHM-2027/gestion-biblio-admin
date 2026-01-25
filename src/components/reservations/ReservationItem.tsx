import React from 'react';
import { FaBook, FaCalendarAlt, FaCheckCircle, FaClock } from 'react-icons/fa';
import type { ReservationItemProps } from '../../types';
import useI18n from '../../hooks/useI18n';

const isFirestoreTimestamp = (data: any): data is { seconds: number, nanoseconds: number } =>
  typeof data === 'object' && data !== null && 'seconds' in data && 'nanoseconds' in data;

const ReservationItem: React.FC<ReservationItemProps> = ({
  reservation,
  isProcessing,
  onValidate
}) => {
  const { t } = useI18n();

  const formatDate = (date: any): string => {
    try {
      let jsDate: Date;
      if (isFirestoreTimestamp(date)) {
        jsDate = new Date(date.seconds * 1000);
      } else if (date instanceof Date) {
        jsDate = date;
      } else if (typeof date === 'string') {
        jsDate = new Date(date);
        if (isNaN(jsDate.getTime())) return 'Date invalide';
      } else {
        return 'Date invalide';
      }

      return jsDate.getUTCDate().toString().padStart(2, '0') + '/' +
        (jsDate.getUTCMonth() + 1).toString().padStart(2, '0') + '/' +
        jsDate.getUTCFullYear() + ' ' +
        jsDate.getUTCHours().toString().padStart(2, '0') + ':' +
        jsDate.getUTCMinutes().toString().padStart(2, '0');
    } catch (error) {
      return 'Date invalide';
    }
  };

  return (
    <div className="group flex items-center justify-between p-4 mb-3 bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-100 transition-all duration-200">

      {/* Section Gauche : Image et Infos */}
      <div className="flex items-center space-x-5 flex-1 min-w-0">

        {/* Conteneur Image optimisé */}
        <div className="relative flex-shrink-0">
          {reservation.document.imageUrl ? (
            <img
              src={reservation.document.imageUrl}
              alt="" // Laissé vide pour éviter le texte superposé si l'image charge mal
              className="w-14 h-20 object-cover rounded-lg shadow-sm border border-gray-100"
            />
          ) : (
            <div className="w-14 h-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
              <FaBook className="text-gray-300 text-xl" />
            </div>
          )}
        </div>

        {/* Textes */}
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-bold text-gray-800 truncate leading-tight mb-1 group-hover:text-primary-600 transition-colors">
            {reservation.document.name || "Sans titre"}
          </h4>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Badge Date */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
              <FaCalendarAlt className="mr-1.5 text-gray-400" size={10} />
              {t('components:reservations.reserved_on') || 'Réservé le'}: {formatDate(reservation.document.reservationDate)}
            </span>
          </div>
        </div>
      </div>

      {/* Section Droite : Action */}
      <div className="ml-6 flex-shrink-0">
        <button
          onClick={onValidate}
          disabled={isProcessing}
          className={`
            relative flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all
            ${isProcessing
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600 hover:shadow-lg active:scale-95 focus:ring-4 focus:ring-primary-100'
            }
          `}
        >
          {isProcessing ? (
            <>
              <FaClock className="animate-spin" size={16} />
              <span>{t('components:reservations.processing')}</span>
            </>
          ) : (
            <>
              <FaCheckCircle size={16} />
              <span>{t('components:reservations.confirm_pickup') || t('components:reservations.approve_request')}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ReservationItem;