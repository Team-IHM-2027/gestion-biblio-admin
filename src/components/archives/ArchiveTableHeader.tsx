// components/archives/ArchiveTableHeader.tsx

import type { ArchiveTableHeaderProps } from '../../types/archives';

export const ArchiveTableHeader = ({ translations }: ArchiveTableHeaderProps) => (
  // Fond blanc légèrement bleuté, bordure basse subtile
  <thead className="bg-white sticky top-0 z-[5]">
    <tr>
      {/* Colonne d'info Client - plus large */}
      <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {translations.client_info}
      </th>
      {/* Colonne Document */}
      <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {translations.document_name}
      </th>
      {/* Colonne Date de Retour */}
      <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {translations.return_date}
      </th>
      {/* Colonne Statut - aligné différemment si nécessaire */}
      <th className="p-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
        {translations.status}
      </th>
    </tr>
  </thead>
);