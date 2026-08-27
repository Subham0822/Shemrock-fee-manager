export type FeeStatus = 'PAID' | 'UNPAID';

export type PaymentMode = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER';

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
  // Current active month / period status
  feeStatus: FeeStatus;
  paymentMode: PaymentMode | null;
  paymentDate: string | null;
  paymentNote?: string;
  // Exam fee status (specifically for July)
  examFeeStatus?: FeeStatus;
  examFeePaymentMode?: PaymentMode | null;
  examFeePaymentDate?: string | null;
  // Period-wise record dictionary (e.g. { "April": {...}, "Sept/Oct": {...}, "Jan/Feb/March": {...} })
  monthlyRecords?: Record<string, MonthPaymentRecord>;
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

