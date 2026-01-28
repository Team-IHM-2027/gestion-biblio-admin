export interface DocumentLoan {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  exemplaires: number;
  collection: string;
  borrowDate: string;
}

export interface UserLoan {
  email: string;
  name: string;
  niveau: string;
  imageUri?: string;
  // États et tableaux dynamiques basés sur MaximumSimultaneousLoans
  // Le nombre exact d'etat et tabEtat dépend de MaximumSimultaneousLoans
  [key: string]: any; // Pour permettre etat1, etat2, ..., etatN et tabEtat1, tabEtat2, ..., tabEtatN
}

export interface UserLoanSlot {
  slotNumber: number;
  status: 'emprunt' | 'ras';
  document?: DocumentLoan;
  penaltySent?: boolean;
}

export interface ProcessedUserLoan {
  email: string;
  name: string;
  niveau: string;
  imageUri?: string;
  activeSlots: UserLoanSlot[];
  totalActiveLoans: number;
}

export interface NotificationState {
  visible: boolean;
  type: 'success' | 'error';
  message: string;
}

export interface LoanFilters {
  searchTerm: string;
  department: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}