import {
  collection,
  getDocs,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { ArchiveItem, ArchivesData, ArchiveStats } from '../types/archives';

export class ArchiveService {
  private archivesCollection = collection(db, 'ArchivesBiblio');
  private livresCollection = collection(db, 'Livres');

  private normalizeDate(date: Timestamp | string): string {
    return date instanceof Timestamp
      ? date.toDate().toISOString()
      : date;
  }

  async getArchives(): Promise<ArchiveItem[]> {
    /** 1️Charger TOUS les livres */
    const livresSnapshot = await getDocs(this.livresCollection);
    const livresMap = new Map<string, string>();

    livresSnapshot.forEach(doc => {
      const data = doc.data() as { nom?: string };
      if (data.nom) {
        livresMap.set(doc.id, data.nom);
      }
    });

    /** 2️ Charger les archives */
    const archiveSnapshot = await getDocs(this.archivesCollection);
    const result: ArchiveItem[] = [];

    archiveSnapshot.forEach(docSnap => {
      const data = docSnap.data() as ArchivesData;

      data.tableauArchives.forEach(item => {
        result.push({
          id: docSnap.id,
          nomEtudiant: item.nomEtudiant,
          nomDoc: livresMap.get(item.nomDoc) || item.nomDoc, //  conversion ici
          heure: this.normalizeDate(item.heure),
        });
      });
    });

    return result;
  }

  async getArchiveStatistics(): Promise<ArchiveStats> {
    const archives = await this.getArchives();

    const sorted = [...archives].sort(
      (a, b) => new Date(b.heure).getTime() - new Date(a.heure).getTime()
    );

    return {
      totalArchives: archives.length,
      lastArchiveDate: sorted[0]?.heure || null,
    };
  }
}

export const archiveService = new ArchiveService();
