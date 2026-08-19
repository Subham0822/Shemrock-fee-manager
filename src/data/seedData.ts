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

const FIRST_NAMES = [
  'Aarav', 'Sneha', 'Kabir', 'Ananya', 'Rohan', 'Priya', 'Ishaan', 'Diya', 'Vihaan',
  'Meera', 'Aditya', 'Tanvi', 'Reyansh', 'Saanvi', 'Aryan', 'Kyra', 'Advait', 'Riya',
  'Arjun', 'Isha', 'Vivaan', 'Tara', 'Dev', 'Avani', 'Dhruv', 'Anushka', 'Samarth',
  'Navya', 'Shaurya', 'Myra', 'Kiaan', 'Zoya', 'Atharv', 'Shanaya', 'Manan', 'Siya',
  'Ayush', 'Kavya', 'Yash', 'Shruti', 'Pranav', 'Bhavya', 'Harsh', 'Trisha', 'Nikhil',
  'Pari', 'Varun', 'Gauri', 'Karan', 'Sara', 'Laksh', 'Anika', 'Aadi', 'Ira', 'Rudra'
];

const LAST_NAMES = [
  'Sharma', 'Chopra', 'Mishra', 'Patel', 'Verma', 'Singh', 'Gupta', 'Nair', 'Rao',
  'Joshi', 'Kumar', 'Deshmukh', 'Sen', 'Shah', 'Reddy', 'Kapoor', 'Menon', 'Singhania',
  'Bhatia', 'Malhotra', 'Mehta', 'Kulkarni', 'Iyer', 'Agarwal', 'Chatterjee', 'Dubey',
  'Choudhury', 'Pandey', 'Saxena', 'Mukherjee', 'Trivedi', 'Bose', 'Pillai', 'Ghosh'
];

const PAYMENT_MODES: Array<'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER'> = [
  'UPI', 'UPI', 'UPI', 'CASH', 'CASH', 'BANK_TRANSFER', 'CHEQUE', 'OTHER'
];

// Target realistic student seed data
export function generateSeedStudents(): Student[] {
  const students: Student[] = [];
  
  // Total ~ 350-400 students across 9 classes
  const classCounts = [35, 42, 45, 45, 48, 46, 44, 40, 38]; // Total 383
  const totalStudents = classCounts.reduce((a, b) => a + b, 0);

  // Deterministic random
  let seed = 42;
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Generate paid flags (~70% paid in August)
  const isPaidPattern: boolean[] = [];
  const paidTarget = Math.round(totalStudents * 0.70);
  for (let i = 0; i < paidTarget; i++) isPaidPattern.push(true);
  for (let i = 0; i < totalStudents - paidTarget; i++) isPaidPattern.push(false);

  for (let i = isPaidPattern.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [isPaidPattern[i], isPaidPattern[j]] = [isPaidPattern[j], isPaidPattern[i]];
  }

  let studentIndex = 0;
  let nameIndex = 0;

  INITIAL_CLASSES.forEach((cls, cIdx) => {
    const countForClass = classCounts[cIdx] || 40;
    for (let r = 1; r <= countForClass; r++) {
      const firstName = FIRST_NAMES[(nameIndex + r * 3) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(nameIndex + r * 7) % LAST_NAMES.length];
      const fullName = `${firstName} ${lastName}`;
      nameIndex++;

      const isAugustPaid = isPaidPattern[studentIndex] ?? true;
      const augustMode = isAugustPaid ? PAYMENT_MODES[Math.floor(seededRandom() * PAYMENT_MODES.length)] : null;
      
      const dayOffset = Math.floor(seededRandom() * 20);
      const augustDate = new Date(2026, 7, 19 - dayOffset);
      const augustDateStr = augustDate.toISOString().split('T')[0];

      // Generate period records for all academic periods
      const monthlyRecords: Record<string, MonthPaymentRecord> = {};
      
      ACADEMIC_MONTHS.forEach((m, mIdx) => {
        let mPaid = false;
        let mMode: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER' | null = null;
        let mDate: string | null = null;

        if (m === 'August') {
          mPaid = isAugustPaid;
          mMode = augustMode;
          mDate = isAugustPaid ? augustDateStr : null;
        } else if (mIdx < 4) {
          // April, May, June, July
          const priorThreshold = 0.88 - mIdx * 0.04;
          mPaid = seededRandom() < priorThreshold;
          if (mPaid) {
            mMode = PAYMENT_MODES[Math.floor(seededRandom() * PAYMENT_MODES.length)];
            const pMonth = 3 + mIdx;
            const pDay = 5 + Math.floor(seededRandom() * 20);
            mDate = new Date(2026, pMonth, pDay).toISOString().split('T')[0];
          }
        } else {
          // Sept/Oct, Nov/Dec, Jan/Feb/March
          const futureThreshold = Math.max(0.06, 0.22 - (mIdx - 4) * 0.05);
          mPaid = seededRandom() < futureThreshold;
          if (mPaid) {
            mMode = PAYMENT_MODES[Math.floor(seededRandom() * PAYMENT_MODES.length)];
            const pDay = 1 + Math.floor(seededRandom() * 15);
            mDate = new Date(2026, 7, pDay).toISOString().split('T')[0];
          }
        }

        monthlyRecords[m] = {
          feeStatus: mPaid ? 'PAID' : 'UNPAID',
          paymentMode: mMode,
          paymentDate: mDate,
        };
      });

      students.push({
        id: `stu-${cls.id}-${r}`,
        name: fullName,
        classId: cls.id,
        className: cls.name,
        feeStatus: isAugustPaid ? 'PAID' : 'UNPAID',
        paymentMode: augustMode,
        paymentDate: isAugustPaid ? augustDateStr : null,
        monthlyRecords,
        createdAt: new Date(2026, 3, 1).toISOString(),
        updatedAt: isAugustPaid ? augustDate.toISOString() : new Date(2026, 3, 1).toISOString(),
      });

      studentIndex++;
    }
  });

  return students;
}
