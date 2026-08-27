export type FeeStatus = 'PAID' | 'UNPAID';

export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';

export type AdmissionType = 'UNPACKAGED' | 'PACKAGED';

export type PackageIntervalKey = 'interval_1' | 'interval_2' | 'interval_3';

export interface PackageIntervalRecord {
  intervalKey: PackageIntervalKey;
  intervalName: string; // 'First Interval' | 'Second Interval' | 'Third Interval'
  feeStatus: FeeStatus;
  paymentMode: PaymentMode | null;
  paymentDate: string | null;
  dueDate?: string | null; // e.g. '2026-07-15'
  paymentNote?: string;
}

export const PACKAGE_INTERVALS: { key: PackageIntervalKey; name: string; shortName: string }[] = [
  { key: 'interval_1', name: 'First Interval', shortName: '1st Interval' },
  { key: 'interval_2', name: 'Second Interval', shortName: '2nd Interval' },
  { key: 'interval_3', name: 'Third Interval', shortName: '3rd Interval' },
];

export interface MonthPaymentRecord {
  feeStatus: FeeStatus;
  paymentMode: PaymentMode | null;
  paymentDate: string | null; // e.g. '2026-08-15'
  paymentNote?: string;
  examFeeStatus?: FeeStatus;
  examFeePaymentMode?: PaymentMode | null;
  examFeePaymentDate?: string | null;
}

export interface Student {
  id: string;
  name: string;
  classId: string;
  className: string;
  admissionType?: AdmissionType; // defaults to 'UNPACKAGED'
  // Current active month / period status (for UNPACKAGED students)
  feeStatus: FeeStatus;
  paymentMode: PaymentMode | null;
  paymentDate: string | null;
  paymentNote?: string;
  // Exam fee status (specifically for July for UNPACKAGED students)
  examFeeStatus?: FeeStatus;
  examFeePaymentMode?: PaymentMode | null;
  examFeePaymentDate?: string | null;
  // Period-wise record dictionary (for UNPACKAGED students)
  monthlyRecords?: Record<string, MonthPaymentRecord>;
  // Packaged Intervals records (for PACKAGED students - 3 intervals)
  packageRecords?: Partial<Record<PackageIntervalKey, PackageIntervalRecord>>;
  createdAt: string;
  updatedAt: string;
}

export interface SchoolClass {
  id: string;
  name: string;
  order: number;
}

export interface SchoolSettings {
  schoolName: string;
  academicYear: string;
  term?: string;
  defaultMonth: string;
}

export type ActiveTab = 'dashboard' | 'classes' | 'students' | 'settings';

export interface RouteState {
  tab: ActiveTab;
  classId?: string | null;
  studentId?: string | null;
}

