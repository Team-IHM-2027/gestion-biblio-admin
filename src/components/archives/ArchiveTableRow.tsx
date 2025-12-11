// components/archives/ArchiveTableRow.tsx

import { FormattedDate } from '../common/FormattedDate';
import type { ArchiveTableRowProps } from '../../types/archives';

export const ArchiveTableRow = ({ item, index, returnedText }: ArchiveTableRowProps) => (
  // Lignes zébrées (pour un look moderne, souvent géré par un if/else sur l'index, mais ici on compte sur un hover fort)
  <tr className="border-b border-gray-100 transition-colors duration-200 hover:bg-primary/5"> 
    
    {/* Info Client et Index (Numéro de Ligne) */}
    <td className="p-4 text-sm font-medium text-gray-900">
      <div className="flex items-center justify-between">
        {/* Nom mis en avant */}
        <span className="font-semibold text-base">{item.nomEtudiant}</span> 
        {/* Index du document (masqué si non pertinent, mais conservé ici) */}
        <span className="text-xs font-mono text-primary/70 bg-primary/10 px-2 py-0.5 rounded-full">
          #{index}
        </span>
      </div>
    </td>
    
    {/* Nom du Document */}
    <td className="p-4 text-sm text-gray-700">{item.nomDoc}</td>
    
    {/* Date de Retour */}
    <td className="p-4 text-sm text-gray-500">
      <FormattedDate date={item.heure} format="datetime" />
    </td>
    
    {/* Statut (Badge) */}
    <td className="p-4">
      <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-700 ring-2 ring-green-200 shadow-sm"> 
        {returnedText}
      </span>
    </td>
  </tr>
);