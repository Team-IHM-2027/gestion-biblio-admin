// src/types/thesis.ts
import type { Timestamp } from 'firebase/firestore';

// This represents a comment, similar to the one for books
export interface ThesisComment {
	heure: Timestamp;
	nomUser: string;
	note: number;
	texte: string;
}

/**
 * Defines the clean data structure for a single thesis used within the application.
 * This is what components and hooks will interact with.
 */
export interface Thesis {
	id: string; // The unique ID from Firestore
	title: string;
	author: string; // Student's name (from 'name' field in Firestore)
	supervisor: string;
	department: string;
	year: number;
	abstract: string;
	keywords: string[];
	coverImageUrl: string;
	pdfUrl: string;
	type: 'mémoire' | 'thèse';
	createdAt: Timestamp;

	// Additional fields from your Firestore structure
	matricule: string;
	etagere: string;
	commentaire?: ThesisComment[];
}