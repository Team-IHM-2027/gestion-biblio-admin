import { collection, getDocs } from 'firebase/firestore';
import { db } from './src/config/firebase.ts';

async function getLevels() {
  try {
    const studentsSnapshot = await getDocs(collection(db, 'BiblioUser'));
    const levels = new Set();
    const depts = new Set();
    studentsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.niveau) levels.add(data.niveau);
      if (data.department) depts.add(data.department);
    });
    console.log('Levels found in DB:', Array.from(levels));
    console.log('Departments found in DB:', Array.from(depts));
  } catch (err) {
    console.error(err);
  }
}

getLevels();
