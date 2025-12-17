import type { ArchiveTableHeaderProps } from '../../types/archives';

export const ArchiveTableHeader = ({ translations }: ArchiveTableHeaderProps) => (
  <thead className="bg-gray-50">
    <tr>
      <th className="p-3 text-left">{translations.client_info}</th>
      <th className="p-3 text-left">{translations.document_name}</th>
      <th className="p-3 text-left">{translations.return_date}</th>
      <th className="p-3 text-left">{translations.status}</th>
    </tr>
  </thead>
);