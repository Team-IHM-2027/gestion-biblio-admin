export const ACADEMIC_LEVELS: AcademicLevel[] = [
    { id: 'licence1', name: 'Licence 1', code: 'L1' },
    { id: 'licence2', name: 'Licence 2', code: 'L2' },
    { id: 'licence3', name: 'Licence 3', code: 'L3' },
    { id: 'master1', name: 'Master 1', code: 'M1' },
    { id: 'master2', name: 'Master 2', code: 'M2' },
    { id: 'doctorat', name: 'Doctorat', code: 'DOC' }
];

export interface AcademicLevel {
    id: string;
    name: string;
    code: string;
}