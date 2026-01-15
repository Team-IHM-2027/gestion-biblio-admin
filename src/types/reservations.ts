// types/reservations.ts

export interface UserReservation {
  // Core user information
  email: string;
  name: string;
  niveau: string;
  matricule?: string;
  profilePicture?: string | null;
  imageUri?: string;
  departement?: string;
  createdAt?: string | Date | Timestamp;

  // Dynamic state slots (based on MaximumSimultaneousLoans)
  // For example: etat1, etat2, etat3
  etat1?: 'reserv' | 'emprunt' | 'ras' | 'valide' | string;
  etat2?: 'reserv' | 'emprunt' | 'ras' | 'valide' | string;
  etat3?: 'reserv' | 'emprunt' | 'ras' | 'valide' | string;
  // Add more as needed based on your max loans configuration

  // Dynamic tab state arrays
  // For example: tabEtat1, tabEtat2, tabEtat3
  tabEtat1?: any[]; // [bookId, bookName, category, imageUrl, collection, reservationDate, exemplaires]
  tabEtat2?: any[];
  tabEtat3?: any[];
  // Add more as needed

  // Reservations array from your actual structure
  reservations?: Array<{
    bookId?: string;
    name: string;
    cathegorie: string;
    image: string;
    nomBD: string;
    dateReservation: string | Date | Timestamp;
    etat: 'reserver' | 'emprunt' | string;
    exemplaire: number;
    category?: string; // Alternative spelling
    collection?: string; // Alternative field name
  }>;

  // For dynamic property access
  [key: string]: any;
}

export interface ReservationSlot {
  slotNumber: number;
  status: 'reserv' | 'emprunt' | 'ras' | 'valide';
  document: {
    id: string; // The actual book ID (first element in tabEtat array)
    name: string; // Book name (second element or fetched from book document)
    title?: string; // Alternative name field
    author?: string; // From book's auteur field
    category: string; // Book category (cathegorie)
    imageUrl: string; // Book image URL
    exemplaires: number; // Number of copies (from exemplaire field)
    collection: string; // Collection name (BiblioBooks, BiblioThesis, etc.)
    reservationDate: string; // ISO string date
    bookId?: string; // Same as id, for clarity
    auteur?: string; // Author from book document
    edition?: string; // Edition from book document
    salle?: string; // Room from book document
    etagere?: string; // Shelf from book document
  };
}

export interface ProcessedUserReservation {
  email: string;
  name: string;
  niveau: string;
  matricule?: string;
  imageUri?: string | null;
  departement?: string;
  profilePicture?: string | null;
  reservationSlots: ReservationSlot[];
  totalActiveReservations: number;
  // Additional info from user document
  lastLoginAt?: string | Date;
  adminLastReadTimestamp?: string | Date;
  reservations?: UserReservation['reservations']; // Include the raw reservations array
}

export interface ReservationFilters {
  searchTerm: string;
  status: 'all' | 'reserv' | 'emprunt' | 'ras';
  collection: 'all' | 'BiblioBooks' | 'BiblioThesis' | string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
}

// Book document interface based on your actual structure
export interface BookDocument {
  id: string;
  name: string;
  title?: string;
  auteur: string;
  cathegorie: string;
  desc?: string;
  edition?: string;
  etagere?: string;
  exemplaire: number;
  initialExemplaire?: number;
  image: string;
  salle?: string;
  type?: string;
  nomBD?: string;
  // Comments array from your structure
  commentaire?: Array<{
    heure: Timestamp | Date | string;
    nomUser: string;
    note: number | string;
    texte: string;
    userId?: string;
  }>;
}

// Notification interface based on your structure
export interface Notification {
  id?: string;
  type: 'reservation_request' | 'loan_active' | 'system' | string;
  isRead: boolean;
  read?: boolean; // Alternative field name
  processed?: boolean;
  message: string;
  recipientId: string;
  relatedDocId: string;
  senderId: string;
  createdAt: string | Date | Timestamp;

  // Reservation-specific fields
  userId?: string;
  userName?: string;
  userEmail?: string;
  bookId?: string;
  bookTitle?: string;
  status?: 'pending' | 'approved' | 'rejected';
  processedBy?: string;
  processedAt?: string | Date | Timestamp;
  rejectionReason?: string;
}

// Validation result interface
export interface ValidationResult {
  success: boolean;
  message: string;
  slotNumber?: number;
  userEmail?: string;
  bookId?: string;
  bookTitle?: string;
}

// Rejection reasons type
export type RejectionReason =
  | 'Book unavailable'
  | 'Maximum reservations reached'
  | 'User not eligible'
  | 'Reservation expired'
  | 'Other';

// Import Timestamp if needed
import { Timestamp } from 'firebase/firestore';