// src/services/thesisService.ts
import { collection, doc, addDoc, getDoc, updateDoc, deleteDoc, getDocs, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { Thesis } from '../types/thesis';

const thesisCollectionRef = collection(db, 'BiblioThesis');

/**
 * Maps a raw Firestore document to our clean `Thesis` interface.
 * @param doc - The Firestore document snapshot.
 * @returns A `Thesis` object.
 */
/**
 * Maps a raw Firestore document to our clean `Thesis` interface.
 * @param doc - The Firestore document snapshot.
 * @returns A `Thesis` object.
 */
const mapDocToThesis = (doc: any): Thesis => {
	const data = doc.data();
	return {
		id: doc.id,
		// Mapping Firestore fields (left) to our application's fields (right)
		title: data.theme || '',
		author: data.name || '',
		supervisor: data.superviseur || '',
		department: data.département || '',
		year: data.annee || 0,
		abstract: data.abstract || '',
		keywords: typeof data.keywords === 'string' ? data.keywords.split(',').map((k: string) => k.trim()) : [],
		coverImageUrl: data.image || '',
		pdfUrl: data.pdfUrl || '',
		type: data.type || 'mémoire',
		createdAt: data.createdAt || Timestamp.now(),
		matricule: data.matricule || '',
		etagere: data.etagere || '',
		commentaire: data.commentaire || [],
	};
};

/**
 * Fetches all theses for a specific academic department.
 */
export const fetchThesesByDepartment = async (departmentName: string): Promise<Thesis[]> => {
	try {
		const q = query(thesisCollectionRef, where('département', '==', departmentName));
		const querySnapshot = await getDocs(q);
		// This now uses the corrected mapping function
		const theses = querySnapshot.docs.map(mapDocToThesis);
		return theses;
	} catch (error) {
		console.error(`Error fetching theses for department "${departmentName}":`, error);
		throw new Error('Failed to fetch theses.');
	}
};

/**
 * Fetches a single thesis by its ID from Firestore.
 */
export const fetchThesisById = async (thesisId: string): Promise<Thesis | null> => {
	try {
		const thesisDocRef = doc(db, 'BiblioThesis', thesisId);
		const docSnap = await getDoc(thesisDocRef);

		if (docSnap.exists()) {
			// This now uses the corrected mapping function
			return mapDocToThesis(docSnap);
		} else {
			console.warn(`No thesis found with ID: ${thesisId}`);
			return null;
		}
	} catch (error) {
		console.error("Error fetching thesis by ID:", error);
		throw new Error('Failed to fetch thesis details.');
	}
};

/**
 * Adds a new thesis to the "BiblioThesis" collection.
 * It takes the clean app-side data and maps it to the Firestore structure.
 */
export const addThesis = async (thesisData: Omit<Thesis, 'id' | 'createdAt'>): Promise<string> => {
	try {
		// Map our clean Thesis object to the Firestore document structure
		const firestoreData = {
			theme: thesisData.title,
			name: thesisData.author,
			superviseur: thesisData.supervisor,
			département: thesisData.department,
			annee: thesisData.year,
			abstract: thesisData.abstract,
			keywords: thesisData.keywords.join(','), // Convert array back to string
			image: thesisData.coverImageUrl,
			pdfUrl: thesisData.pdfUrl,
			type: thesisData.type,
			matricule: thesisData.matricule,
			etagere: thesisData.etagere,
			commentaire: [], // Initialize with empty comments
			createdAt: Timestamp.now()
		};

		const docRef = await addDoc(thesisCollectionRef, firestoreData);
		return docRef.id;
	} catch (error) {
		console.error("Error adding thesis:", error);
		throw new Error("Failed to add the new thesis.");
	}
};

/**
 * Updates a thesis's data in Firestore.
 * It takes the clean app-side data and maps it back to the Firestore structure.
 */
export const updateThesis = async (thesisId: string, data: Partial<Thesis>): Promise<void> => {
	const thesisDocRef = doc(db, 'BiblioThesis', thesisId);

	// Create an object to hold the Firestore-compatible data
	const firestoreUpdateData: { [key: string]: any } = {};

	// Map fields from our clean Thesis object to Firestore field names
	if (data.title !== undefined) firestoreUpdateData.theme = data.title;
	if (data.author !== undefined) firestoreUpdateData.name = data.author;
	if (data.supervisor !== undefined) firestoreUpdateData.superviseur = data.supervisor;
	if (data.department !== undefined) firestoreUpdateData.département = data.department;
	if (data.year !== undefined) firestoreUpdateData.annee = data.year;
	if (data.abstract !== undefined) firestoreUpdateData.abstract = data.abstract;
	if (data.keywords !== undefined) firestoreUpdateData.keywords = data.keywords.join(',');
	if (data.coverImageUrl !== undefined) firestoreUpdateData.image = data.coverImageUrl;
	if (data.pdfUrl !== undefined) firestoreUpdateData.pdfUrl = data.pdfUrl;
	if (data.type !== undefined) firestoreUpdateData.type = data.type;
	if (data.matricule !== undefined) firestoreUpdateData.matricule = data.matricule;
	if (data.etagere !== undefined) firestoreUpdateData.etagere = data.etagere;

	await updateDoc(thesisDocRef, firestoreUpdateData);
};

/**
 * Deletes a thesis from Firestore.
 */
export const deleteThesis = async (thesisId: string): Promise<void> => {
	const thesisDocRef = doc(db, 'BiblioThesis', thesisId);
	await deleteDoc(thesisDocRef);
};
/**
 * Fetches ALL theses from the database (not filtered by department)
 */
export const fetchAllTheses = async (): Promise<Thesis[]> => {
	try {
		const querySnapshot = await getDocs(thesisCollectionRef);
		const theses = querySnapshot.docs.map(mapDocToThesis);
		return theses;
	} catch (error) {
		console.error('Error fetching all theses:', error);
		throw new Error('Failed to fetch theses.');
	}
};