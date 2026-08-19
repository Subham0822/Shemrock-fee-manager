import { SchoolClass, Student, SchoolSettings, MonthPaymentRecord } from '../types';

export const ACADEMIC_MONTHS = [
  'April',
  'May',
  'June',
  'July',
  'August',
  'Sept/Oct',
  'Nov/Dec',
  'Jan/Feb/March',
];

export const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'Greenwood Valley Public School',
  academicYear: '2026-2027',
  term: 'Academic Year 2026-27',
  defaultMonth: 'August',
};

export const INITIAL_CLASSES: SchoolClass[] = [
  { id: 'class-pg', name: 'Playgroup', order: 1 },
  { id: 'class-nur', name: 'Nursery', order: 2 },
  { id: 'class-lkg', name: 'LKG', order: 3 },
  { id: 'class-ukg', name: 'UKG', order: 4 },
  { id: 'class-1', name: 'Class 1', order: 5 },
  { id: 'class-2', name: 'Class 2', order: 6 },
  { id: 'class-3', name: 'Class 3', order: 7 },
  { id: 'class-4', name: 'Class 4', order: 8 },
  { id: 'class-5', name: 'Class 5', order: 9 },
];

export function generateSeedStudents(): Student[] {
  return [];
}
