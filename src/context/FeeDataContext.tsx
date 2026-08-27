import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Student,
  SchoolClass,
  SchoolSettings,
  PaymentMode,
  MonthPaymentRecord,
  FeeStatus,
  AdmissionType,
  PackageIntervalKey,
  PackageIntervalRecord,
  PACKAGE_INTERVALS,
} from '../types';
import { DEFAULT_SETTINGS, INITIAL_CLASSES, ACADEMIC_MONTHS } from '../data/seedData';
import { db, handleFirestoreError, OperationType, testConnection, isFirebaseConfigured } from '../firebase';
import { collection, doc, onSnapshot, setDoc, deleteDoc, writeBatch, getDocs, limit, query } from 'firebase/firestore';

interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

export interface FeeStats {
  total: number;
  paid: number;
  unpaid: number;
  percentage: number;
}

interface FeeDataContextType {
  classes: SchoolClass[];
  students: Student[];
  settings: SchoolSettings;
  activeMonth: string;
  monthsList: string[];
  isCloudConnected: boolean;
  isSyncing: boolean;
  cloudError: string | null;
  retryConnection: () => Promise<void>;
  setActiveMonth: (month: string) => void;
  toasts: ToastMessage[];
  showToast: (title: string, message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
  removeToast: (id: string) => void;
  getStudentMonthRecord: (student: Student, month?: string) => MonthPaymentRecord;
  getStudentPackageRecord: (student: Student, intervalKey: PackageIntervalKey) => PackageIntervalRecord;
  toggleExamFeeStatus: (studentId: string, month?: string) => Promise<boolean>;
  markExamFeePaid: (studentId: string, month?: string, paymentMode?: PaymentMode, paymentDate?: string) => Promise<boolean>;
  markExamFeeUnpaid: (studentId: string, month?: string) => Promise<boolean>;
  markStudentPaid: (
    studentId: string,
    paymentMode: PaymentMode,
    note?: string,
    months?: string | string[],
    paymentDate?: string,
    includeJulyExamFee?: boolean
  ) => Promise<boolean>;
  markStudentUnpaid: (studentId: string, months?: string | string[]) => Promise<boolean>;
  markPackageIntervalPaid: (
    studentId: string,
    intervalKey: PackageIntervalKey,
    paymentMode?: PaymentMode,
    paymentDate?: string,
    note?: string
  ) => Promise<boolean>;
  markPackageIntervalsPaid: (
    studentId: string,
    intervalKeys: PackageIntervalKey[],
    paymentMode?: PaymentMode,
    paymentDate?: string,
    note?: string
  ) => Promise<boolean>;
  markPackageIntervalUnpaid: (studentId: string, intervalKey: PackageIntervalKey) => Promise<boolean>;
  addStudent: (data: { name: string; classId: string; admissionType?: AdmissionType }) => Promise<{ success: boolean; error?: string; student?: Student }>;
  updateStudent: (studentId: string, data: { name: string; classId: string; admissionType?: AdmissionType }) => Promise<{ success: boolean; error?: string }>;
  deleteStudent: (studentId: string) => Promise<boolean>;
  deleteAllStudents: () => Promise<void>;
  updateSettings: (newSettings: Partial<SchoolSettings>) => Promise<void>;
  getOverallStats: (month?: string) => FeeStats;
  getClassStats: (classId: string, month?: string) => FeeStats;
}

const STORAGE_KEY_STUDENTS = 'sfm_students_v3';
const STORAGE_KEY_CLASSES = 'sfm_classes_v3';
const STORAGE_KEY_SETTINGS = 'sfm_settings_v3';
const STORAGE_KEY_ACTIVE_MONTH = 'sfm_active_month_v3';
const STORAGE_KEY_BACKUP = 'sfm_students_backup';

const ALL_LEGACY_KEYS = [
  'sfm_students_v3',
  'sfm_students_backup',
  'sfm_students_v2_monthly',
  'sfm_students_v2',
  'sfm_students',
  'students',
];

const FeeDataContext = createContext<FeeDataContextType | undefined>(undefined);

// Helper to remove any undefined properties which cause Firestore setDoc to fail
function sanitizeFirestoreData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

export const FeeDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [classes] = useState<SchoolClass[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CLASSES);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return INITIAL_CLASSES;
  });

  const [settings, setSettings] = useState<SchoolSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [activeMonth, setActiveMonthState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_ACTIVE_MONTH);
      if (saved && ACADEMIC_MONTHS.includes(saved)) return saved;
    } catch {
      // ignore
    }
    return settings.defaultMonth || 'August';
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      for (const key of ALL_LEGACY_KEYS) {
        const saved = localStorage.getItem(key);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log(`[FeeDataContext] Restored ${parsed.length} students from storage key "${key}"`);
            return parsed.map((s: any) => ({
              id: s.id || `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              name: s.name || 'Unnamed',
              classId: s.classId || 'class_1',
              className: s.className || 'Class 1',
              admissionType: (s.admissionType as AdmissionType) || 'UNPACKAGED',
              feeStatus: s.feeStatus || 'UNPAID',
              paymentMode: s.paymentMode || null,
              paymentDate: s.paymentDate || null,
              paymentNote: s.paymentNote,
              examFeeStatus: s.examFeeStatus || 'UNPAID',
              examFeePaymentMode: s.examFeePaymentMode || null,
              examFeePaymentDate: s.examFeePaymentDate || null,
              monthlyRecords: s.monthlyRecords || {},
              packageRecords: s.packageRecords || {},
              createdAt: s.createdAt || new Date().toISOString(),
              updatedAt: s.updatedAt || new Date().toISOString(),
            }));
          }
        }
      }
    } catch (e) {
      console.warn('[FeeDataContext] Error reading local students cache:', e);
    }
    return [];
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(isFirebaseConfigured);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const studentsRef = useRef<Student[]>(students);
  studentsRef.current = students;

  const retryConnection = useCallback(async () => {
    setIsSyncing(true);
    setCloudError(null);
    const ok = await testConnection();
    if (ok) {
      setIsCloudConnected(true);
    }
    setRetryTrigger((prev) => prev + 1);
    setIsSyncing(false);
  }, []);

  const showToast = useCallback((title: string, message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const setActiveMonth = useCallback((month: string) => {
    if (!ACADEMIC_MONTHS.includes(month)) return;
    setActiveMonthState(month);
    try {
      localStorage.setItem(STORAGE_KEY_ACTIVE_MONTH, month);
    } catch {
      // ignore
    }
  }, []);

  // Initialize Firestore listeners & safe sync
  useEffect(() => {
    testConnection().then((connected) => {
      if (connected) {
        setIsCloudConnected(true);
        setCloudError(null);
      }
    });

    // 1. Settings listener
    const settingsDocRef = doc(db, 'settings', 'school');
    const unsubSettings = onSnapshot(
      settingsDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as Partial<SchoolSettings>;
          setSettings((prev) => ({ ...prev, ...data }));
          try {
            localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify({ ...DEFAULT_SETTINGS, ...data }));
          } catch {
            // ignore
          }
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/school');
        setIsCloudConnected(false);
        setCloudError(error instanceof Error ? error.message : String(error));
      }
    );

    // 2. Students listener (realtime sync without dummy seeding)
    const studentsColRef = collection(db, 'students');
    const unsubStudents = onSnapshot(
      studentsColRef,
      async (snapshot) => {
        setIsCloudConnected(true);
        setCloudError(null);

        if (snapshot.empty) {
          // If remote cloud collection is empty BUT we have existing local students,
          // upload our local students to the cloud instead of wiping them!
          const currentLocal = studentsRef.current;
          if (currentLocal && currentLocal.length > 0) {
            console.log(`[FeeDataContext] Cloud is empty but local has ${currentLocal.length} students. Syncing local to cloud...`);
            for (const st of currentLocal) {
              try {
                await setDoc(doc(db, 'students', st.id), sanitizeFirestoreData(st));
              } catch (err) {
                console.error(`Failed to push local student ${st.id} to cloud:`, err);
              }
            }
          }
          return;
        }

        const remoteStudents: Student[] = [];
        snapshot.forEach((d) => {
          remoteStudents.push(d.data() as Student);
        });
        // Sort by class and student name
        remoteStudents.sort((a, b) => {
          if (a.classId !== b.classId) return a.classId.localeCompare(b.classId);
          return a.name.localeCompare(b.name);
        });
        setStudents(remoteStudents);
        try {
          localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(remoteStudents));
          localStorage.setItem(STORAGE_KEY_BACKUP, JSON.stringify(remoteStudents));
        } catch {
          // ignore
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'students');
        setIsCloudConnected(false);
        setCloudError(error instanceof Error ? error.message : String(error));
      }
    );

    return () => {
      unsubSettings();
      unsubStudents();
    };
  }, [retryTrigger]);

  // Sync to local storage backup
  useEffect(() => {
    try {
      if (students.length > 0) {
        localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
        localStorage.setItem(STORAGE_KEY_BACKUP, JSON.stringify(students));
      }
    } catch (e) {
      console.error('Failed to persist students to local backup:', e);
    }
  }, [students]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist settings:', e);
    }
  }, [settings]);

  const getStudentMonthRecord = useCallback((student: Student, month?: string): MonthPaymentRecord => {
    const targetMonth = month || activeMonth;
    if (student.monthlyRecords && student.monthlyRecords[targetMonth]) {
      const rec = student.monthlyRecords[targetMonth];
      return {
        feeStatus: rec.feeStatus || 'UNPAID',
        paymentMode: rec.paymentMode || null,
        paymentDate: rec.paymentDate || null,
        paymentNote: rec.paymentNote,
        examFeeStatus: rec.examFeeStatus || (targetMonth === 'July' && student.examFeeStatus ? student.examFeeStatus : 'UNPAID'),
        examFeePaymentMode: rec.examFeePaymentMode || null,
        examFeePaymentDate: rec.examFeePaymentDate || null,
      };
    }
    if (targetMonth === activeMonth && student.feeStatus) {
      return {
        feeStatus: student.feeStatus,
        paymentMode: student.paymentMode,
        paymentDate: student.paymentDate,
        paymentNote: student.paymentNote,
        examFeeStatus: student.examFeeStatus || 'UNPAID',
        examFeePaymentMode: student.examFeePaymentMode || null,
        examFeePaymentDate: student.examFeePaymentDate || null,
      };
    }
    return {
      feeStatus: 'UNPAID',
      paymentMode: null,
      paymentDate: null,
      examFeeStatus: 'UNPAID',
      examFeePaymentMode: null,
      examFeePaymentDate: null,
    };
  }, [activeMonth]);

  const toggleExamFeeStatus = useCallback(async (studentId: string, month = 'July') => {
    const targetStudent = studentsRef.current.find((s) => s.id === studentId) || students.find((s) => s.id === studentId);
    if (!targetStudent) return false;

    const currentRecords = targetStudent.monthlyRecords || {};
    const existingRec = currentRecords[month] || {
      feeStatus: 'UNPAID',
      paymentMode: null,
      paymentDate: null,
    };

    const isCurrentlyPaid = existingRec.examFeeStatus === 'PAID' || (month === 'July' && targetStudent.examFeeStatus === 'PAID');
    const newStatus: FeeStatus = isCurrentlyPaid ? 'UNPAID' : 'PAID';
    const dateStr = newStatus === 'PAID' ? new Date().toLocaleDateString('en-CA') : null;

    const updatedRecords: Record<string, MonthPaymentRecord> = {
      ...currentRecords,
      [month]: {
        ...existingRec,
        examFeeStatus: newStatus,
        examFeePaymentDate: dateStr,
        examFeePaymentMode: newStatus === 'PAID' ? 'CASH' : null,
      },
    };

    const updatedStudent: Student = {
      ...targetStudent,
      examFeeStatus: month === 'July' ? newStatus : targetStudent.examFeeStatus,
      examFeePaymentDate: month === 'July' ? dateStr : targetStudent.examFeePaymentDate,
      examFeePaymentMode: month === 'July' ? (newStatus === 'PAID' ? 'CASH' : null) : targetStudent.examFeePaymentMode,
      monthlyRecords: updatedRecords,
      updatedAt: new Date().toISOString(),
    };

    studentsRef.current = studentsRef.current.map((s) => (s.id === studentId ? updatedStudent : s));
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updatedStudent : s)));
    showToast(
      'Exam Fee Updated',
      `${targetStudent.name}'s ${month} Exam Fee marked as ${newStatus}`,
      newStatus === 'PAID' ? 'success' : 'info'
    );

    try {
      await setDoc(doc(db, 'students', studentId), sanitizeFirestoreData(updatedStudent));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
      return true;
    }
  }, [students, showToast]);

  const markExamFeePaid = useCallback(async (
    studentId: string,
    month = 'July',
    paymentMode: PaymentMode = 'CASH',
    paymentDate?: string
  ) => {
    const targetStudent = studentsRef.current.find((s) => s.id === studentId) || students.find((s) => s.id === studentId);
    if (!targetStudent) return false;

    const currentRecords = targetStudent.monthlyRecords || {};
    const existingRec = currentRecords[month] || {
      feeStatus: 'UNPAID',
      paymentMode: null,
      paymentDate: null,
    };

    const dateStr = paymentDate || new Date().toLocaleDateString('en-CA');
    const updatedRecords: Record<string, MonthPaymentRecord> = {
      ...currentRecords,
      [month]: {
        ...existingRec,
        examFeeStatus: 'PAID',
        examFeePaymentDate: dateStr,
        examFeePaymentMode: paymentMode,
      },
    };

    const updatedStudent: Student = {
      ...targetStudent,
      examFeeStatus: month === 'July' ? 'PAID' : targetStudent.examFeeStatus,
      examFeePaymentDate: month === 'July' ? dateStr : targetStudent.examFeePaymentDate,
      examFeePaymentMode: month === 'July' ? paymentMode : targetStudent.examFeePaymentMode,
      monthlyRecords: updatedRecords,
      updatedAt: new Date().toISOString(),
    };

    studentsRef.current = studentsRef.current.map((s) => (s.id === studentId ? updatedStudent : s));
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updatedStudent : s)));
    showToast('Exam Fee Paid', `${targetStudent.name}'s ${month} Exam Fee marked as PAID on ${dateStr}`, 'success');

    try {
      await setDoc(doc(db, 'students', studentId), sanitizeFirestoreData(updatedStudent));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
      return true;
    }
  }, [students, showToast]);

  const markExamFeeUnpaid = useCallback(async (studentId: string, month = 'July') => {
    const targetStudent = studentsRef.current.find((s) => s.id === studentId) || students.find((s) => s.id === studentId);
    if (!targetStudent) return false;

    const currentRecords = targetStudent.monthlyRecords || {};
    const existingRec = currentRecords[month] || {
      feeStatus: 'UNPAID',
      paymentMode: null,
      paymentDate: null,
    };

    const updatedRecords: Record<string, MonthPaymentRecord> = {
      ...currentRecords,
      [month]: {
        ...existingRec,
        examFeeStatus: 'UNPAID',
        examFeePaymentDate: null,
        examFeePaymentMode: null,
      },
    };

    const updatedStudent: Student = {
      ...targetStudent,
      examFeeStatus: month === 'July' ? 'UNPAID' : targetStudent.examFeeStatus,
      examFeePaymentDate: month === 'July' ? null : targetStudent.examFeePaymentDate,
      examFeePaymentMode: month === 'July' ? null : targetStudent.examFeePaymentMode,
      monthlyRecords: updatedRecords,
      updatedAt: new Date().toISOString(),
    };

    studentsRef.current = studentsRef.current.map((s) => (s.id === studentId ? updatedStudent : s));
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updatedStudent : s)));
    showToast('Exam Fee Reverted', `${targetStudent.name}'s ${month} Exam Fee reverted to UNPAID`, 'info');

    try {
      await setDoc(doc(db, 'students', studentId), sanitizeFirestoreData(updatedStudent));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
      return true;
    }
  }, [students, showToast]);

  const markStudentPaid = useCallback(async (
    studentId: string,
    paymentMode: PaymentMode,
    note?: string,
    months?: string | string[],
    customPaymentDate?: string,
    includeJulyExamFee?: boolean
  ) => {
    const targetMonths = Array.isArray(months)
      ? months
      : [months || activeMonth];

    if (targetMonths.length === 0) return false;

    const dateStr = customPaymentDate || new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const targetStudent = studentsRef.current.find((s) => s.id === studentId) || students.find((s) => s.id === studentId);
    if (!targetStudent) return false;

    const currentRecords = targetStudent.monthlyRecords || {};
    const updatedRecords: Record<string, MonthPaymentRecord> = { ...currentRecords };

    targetMonths.forEach((m) => {
      const existing = currentRecords[m] || {
        feeStatus: 'UNPAID',
        paymentMode: null,
        paymentDate: null,
      };
      const isJuly = m === 'July';
      const markExamAsPaid = isJuly && (includeJulyExamFee || existing.examFeeStatus === 'PAID');

      updatedRecords[m] = {
        ...existing,
        feeStatus: 'PAID',
        paymentMode,
        paymentDate: dateStr,
        paymentNote: note?.trim() || undefined,
        examFeeStatus: markExamAsPaid ? 'PAID' : (existing.examFeeStatus || 'UNPAID'),
        examFeePaymentDate: markExamAsPaid ? (existing.examFeePaymentDate || dateStr) : (existing.examFeePaymentDate || null),
        examFeePaymentMode: markExamAsPaid ? (existing.examFeePaymentMode || paymentMode) : (existing.examFeePaymentMode || null),
      };
    });

    const isCurrentActiveIncluded = targetMonths.includes(activeMonth);
    const updatedStudent: Student = {
      ...targetStudent,
      feeStatus: isCurrentActiveIncluded ? 'PAID' : targetStudent.feeStatus,
      paymentMode: isCurrentActiveIncluded ? paymentMode : targetStudent.paymentMode,
      paymentDate: isCurrentActiveIncluded ? dateStr : targetStudent.paymentDate,
      paymentNote: isCurrentActiveIncluded ? (note?.trim() || undefined) : targetStudent.paymentNote,
      examFeeStatus: (targetMonths.includes('July') && includeJulyExamFee) ? 'PAID' : targetStudent.examFeeStatus,
      examFeePaymentDate: (targetMonths.includes('July') && includeJulyExamFee) ? dateStr : targetStudent.examFeePaymentDate,
      examFeePaymentMode: (targetMonths.includes('July') && includeJulyExamFee) ? paymentMode : targetStudent.examFeePaymentMode,
      monthlyRecords: updatedRecords,
      updatedAt: new Date().toISOString(),
    };

    // Optimistic UI update
    studentsRef.current = studentsRef.current.map((s) => (s.id === studentId ? updatedStudent : s));
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updatedStudent : s)));
    const monthsLabel = targetMonths.join(', ');
    showToast(
      'Payment Recorded',
      `${targetStudent.name} marked as PAID for ${monthsLabel} on ${dateStr} via ${paymentMode.replace('_', ' ')}`,
      'success'
    );

    // Firestore sync
    try {
      await setDoc(doc(db, 'students', studentId), sanitizeFirestoreData(updatedStudent));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
      return true;
    }
  }, [activeMonth, students, showToast]);

  const markStudentUnpaid = useCallback(async (studentId: string, months?: string | string[]) => {
    const targetMonths = Array.isArray(months)
      ? months
      : [months || activeMonth];

    if (targetMonths.length === 0) return false;

    const now = new Date();
    const targetStudent = studentsRef.current.find((s) => s.id === studentId) || students.find((s) => s.id === studentId);
    if (!targetStudent) return false;

    const currentRecords = targetStudent.monthlyRecords || {};
    const updatedRecords: Record<string, MonthPaymentRecord> = { ...currentRecords };

    targetMonths.forEach((m) => {
      const existing = currentRecords[m] || { feeStatus: 'UNPAID', paymentMode: null, paymentDate: null };
      updatedRecords[m] = {
        ...existing,
        feeStatus: 'UNPAID',
        paymentMode: null,
        paymentDate: null,
      };
    });

    const isCurrentActiveIncluded = targetMonths.includes(activeMonth);
    const updatedStudent: Student = {
      ...targetStudent,
      feeStatus: isCurrentActiveIncluded ? 'UNPAID' : targetStudent.feeStatus,
      paymentMode: isCurrentActiveIncluded ? null : targetStudent.paymentMode,
      paymentDate: isCurrentActiveIncluded ? null : targetStudent.paymentDate,
      paymentNote: isCurrentActiveIncluded ? undefined : targetStudent.paymentNote,
      monthlyRecords: updatedRecords,
      updatedAt: now.toISOString(),
    };

    // Optimistic UI update
    studentsRef.current = studentsRef.current.map((s) => (s.id === studentId ? updatedStudent : s));
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updatedStudent : s)));
    showToast('Status Updated', `${targetStudent.name} fee status reverted to UNPAID for ${targetMonths.join(', ')}`, 'info');

    // Firestore sync
    try {
      await setDoc(doc(db, 'students', studentId), sanitizeFirestoreData(updatedStudent));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
      return true;
    }
  }, [activeMonth, students, showToast]);

  const getStudentPackageRecord = useCallback((student: Student, intervalKey: PackageIntervalKey): PackageIntervalRecord => {
    const intMeta = PACKAGE_INTERVALS.find((i) => i.key === intervalKey) || { key: intervalKey, name: intervalKey, shortName: intervalKey };
    if (student.packageRecords && student.packageRecords[intervalKey]) {
      const rec = student.packageRecords[intervalKey]!;
      return {
        intervalKey,
        intervalName: rec.intervalName || intMeta.name,
        feeStatus: rec.feeStatus || 'UNPAID',
        paymentMode: rec.paymentMode || null,
        paymentDate: rec.paymentDate || null,
        paymentNote: rec.paymentNote,
      };
    }
    return {
      intervalKey,
      intervalName: intMeta.name,
      feeStatus: 'UNPAID',
      paymentMode: null,
      paymentDate: null,
    };
  }, []);

  const markPackageIntervalsPaid = useCallback(async (
    studentId: string,
    intervalKeys: PackageIntervalKey[],
    paymentMode: PaymentMode = 'CASH',
    paymentDate?: string,
    note?: string
  ) => {
    const targetStudent = studentsRef.current.find((s) => s.id === studentId) || students.find((s) => s.id === studentId);
    if (!targetStudent) return false;

    const currentPackageRecords = targetStudent.packageRecords || {};
    const dateStr = paymentDate || new Date().toLocaleDateString('en-CA');
    const updatedPackageRecords = { ...currentPackageRecords };

    intervalKeys.forEach((intervalKey) => {
      const intMeta = PACKAGE_INTERVALS.find((i) => i.key === intervalKey) || { key: intervalKey, name: intervalKey, shortName: intervalKey };
      updatedPackageRecords[intervalKey] = {
        intervalKey,
        intervalName: intMeta.name,
        feeStatus: 'PAID',
        paymentMode,
        paymentDate: dateStr,
        paymentNote: note?.trim() || undefined,
      };
    });

    const updatedStudent: Student = {
      ...targetStudent,
      admissionType: 'PACKAGED',
      packageRecords: updatedPackageRecords,
      updatedAt: new Date().toISOString(),
    };

    studentsRef.current = studentsRef.current.map((s) => (s.id === studentId ? updatedStudent : s));
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updatedStudent : s)));
    showToast(
      'Interval Payment Recorded',
      `${targetStudent.name}'s interval payment marked as PAID via ${paymentMode.replace('_', ' ')} on ${dateStr}`,
      'success'
    );

    try {
      await setDoc(doc(db, 'students', studentId), sanitizeFirestoreData(updatedStudent));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
      return true;
    }
  }, [students, showToast]);

  const markPackageIntervalPaid = useCallback(async (
    studentId: string,
    intervalKey: PackageIntervalKey,
    paymentMode: PaymentMode = 'CASH',
    paymentDate?: string,
    note?: string
  ) => {
    return markPackageIntervalsPaid(studentId, [intervalKey], paymentMode, paymentDate, note);
  }, [markPackageIntervalsPaid]);

  const markPackageIntervalUnpaid = useCallback(async (
    studentId: string,
    intervalKey: PackageIntervalKey
  ) => {
    const targetStudent = studentsRef.current.find((s) => s.id === studentId) || students.find((s) => s.id === studentId);
    if (!targetStudent) return false;

    const intMeta = PACKAGE_INTERVALS.find((i) => i.key === intervalKey) || { key: intervalKey, name: intervalKey, shortName: intervalKey };
    const currentPackageRecords = targetStudent.packageRecords || {};

    const updatedRecord: PackageIntervalRecord = {
      intervalKey,
      intervalName: intMeta.name,
      feeStatus: 'UNPAID',
      paymentMode: null,
      paymentDate: null,
      paymentNote: undefined,
    };

    const updatedPackageRecords = {
      ...currentPackageRecords,
      [intervalKey]: updatedRecord,
    };

    const updatedStudent: Student = {
      ...targetStudent,
      packageRecords: updatedPackageRecords,
      updatedAt: new Date().toISOString(),
    };

    studentsRef.current = studentsRef.current.map((s) => (s.id === studentId ? updatedStudent : s));
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updatedStudent : s)));
    showToast(
      'Status Reverted',
      `${targetStudent.name}'s ${intMeta.name} status reverted to UNPAID`,
      'info'
    );

    try {
      await setDoc(doc(db, 'students', studentId), sanitizeFirestoreData(updatedStudent));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
      return true;
    }
  }, [students, showToast]);

  const addStudent = useCallback(async (data: {
    name: string;
    classId: string;
    admissionType?: AdmissionType;
  }) => {
    const trimmedName = data.name.trim();

    if (!trimmedName) return { success: false, error: 'Student name is required' };

    const cls = classes.find((c) => c.id === data.classId);
    if (!cls) return { success: false, error: 'Selected class not found' };

    const existing = students.find(
      (s) => s.classId === data.classId && s.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (existing) {
      return { success: false, error: `Student "${trimmedName}" already exists in ${cls.name}` };
    }

    const now = new Date().toISOString();
    const admissionType: AdmissionType = data.admissionType || 'UNPACKAGED';

    const initialRecords: Record<string, MonthPaymentRecord> = {};
    ACADEMIC_MONTHS.forEach((m) => {
      initialRecords[m] = {
        feeStatus: 'UNPAID',
        paymentMode: null,
        paymentDate: null,
      };
    });

    const initialPackageRecords: Partial<Record<PackageIntervalKey, PackageIntervalRecord>> = {};
    PACKAGE_INTERVALS.forEach((i) => {
      initialPackageRecords[i.key] = {
        intervalKey: i.key,
        intervalName: i.name,
        feeStatus: 'UNPAID',
        paymentMode: null,
        paymentDate: null,
      };
    });

    const newStudentId = `stu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newStudent: Student = {
      id: newStudentId,
      name: trimmedName,
      classId: cls.id,
      className: cls.name,
      admissionType,
      feeStatus: 'UNPAID',
      paymentMode: null,
      paymentDate: null,
      monthlyRecords: initialRecords,
      packageRecords: initialPackageRecords,
      createdAt: now,
      updatedAt: now,
    };

    setStudents((prev) => [newStudent, ...prev]);
    showToast('Student Added', `${trimmedName} added to ${cls.name} (${admissionType === 'PACKAGED' ? 'Packaged' : 'Unpackaged'})`, 'success');

    try {
      await setDoc(doc(db, 'students', newStudentId), sanitizeFirestoreData(newStudent));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `students/${newStudentId}`);
    }

    return { success: true, student: newStudent };
  }, [classes, students, showToast]);

  const updateStudent = useCallback(async (studentId: string, data: {
    name: string;
    classId: string;
    admissionType?: AdmissionType;
  }) => {
    const trimmedName = data.name.trim();

    if (!trimmedName) return { success: false, error: 'Student name is required' };

    const cls = classes.find((c) => c.id === data.classId);
    if (!cls) return { success: false, error: 'Selected class not found' };

    const currentStudent = students.find((s) => s.id === studentId);
    if (!currentStudent) return { success: false, error: 'Student not found' };

    const now = new Date().toISOString();
    const admissionType: AdmissionType = data.admissionType || currentStudent.admissionType || 'UNPACKAGED';

    let packageRecords = currentStudent.packageRecords;
    if (admissionType === 'PACKAGED' && (!packageRecords || Object.keys(packageRecords).length === 0)) {
      packageRecords = {};
      PACKAGE_INTERVALS.forEach((i) => {
        packageRecords![i.key] = {
          intervalKey: i.key,
          intervalName: i.name,
          feeStatus: 'UNPAID',
          paymentMode: null,
          paymentDate: null,
        };
      });
    }

    const updatedStudent: Student = {
      ...currentStudent,
      name: trimmedName,
      classId: cls.id,
      className: cls.name,
      admissionType,
      packageRecords,
      updatedAt: now,
    };

    setStudents((prev) => prev.map((s) => (s.id === studentId ? updatedStudent : s)));
    showToast('Student Updated', `Record for ${trimmedName} updated successfully`, 'success');

    try {
      await setDoc(doc(db, 'students', studentId), sanitizeFirestoreData(updatedStudent));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
    }

    return { success: true };
  }, [classes, students, showToast]);

  const deleteStudent = useCallback(async (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return false;

    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    showToast('Student Deleted', `${student.name} was removed from the register`, 'info');

    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `students/${studentId}`);
    }

    return true;
  }, [students, showToast]);

  const updateSettings = useCallback(async (newSettings: Partial<SchoolSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    if (newSettings.defaultMonth && ACADEMIC_MONTHS.includes(newSettings.defaultMonth)) {
      setActiveMonthState(newSettings.defaultMonth);
    }
    showToast('Settings Saved', 'School details updated in cloud database', 'success');

    try {
      await setDoc(doc(db, 'settings', 'school'), {
        ...settings,
        ...newSettings,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'settings/school');
    }
  }, [settings, showToast]);

  const deleteAllStudents = useCallback(async () => {
    setIsSyncing(true);
    setStudents([]);
    try {
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify([]));
    } catch {
      // ignore
    }

    try {
      const snap = await getDocs(collection(db, 'students'));
      if (!snap.empty) {
        const batchSize = 300;
        const docs = snap.docs;
        for (let i = 0; i < docs.length; i += batchSize) {
          const batch = writeBatch(db);
          const chunk = docs.slice(i, i + batchSize);
          chunk.forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      }
      showToast('Register Cleared', 'All student records have been permanently deleted', 'info');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'students');
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  const getOverallStats = useCallback((month?: string): FeeStats => {
    const targetMonth = month || activeMonth;
    // Calculate monthly stats for Unpackaged students (who follow monthly schedule)
    const unpackagedStudents = students.filter((s) => (s.admissionType || 'UNPACKAGED') === 'UNPACKAGED');
    const total = unpackagedStudents.length;
    const paid = unpackagedStudents.filter((s) => {
      const rec = s.monthlyRecords?.[targetMonth];
      return rec ? rec.feeStatus === 'PAID' : (targetMonth === activeMonth && s.feeStatus === 'PAID');
    }).length;
    const unpaid = total - paid;
    const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { total, paid, unpaid, percentage };
  }, [students, activeMonth]);

  const getClassStats = useCallback((classId: string, month?: string): FeeStats => {
    const targetMonth = month || activeMonth;
    const classStudents = students.filter((s) => s.classId === classId && (s.admissionType || 'UNPACKAGED') === 'UNPACKAGED');
    const total = classStudents.length;
    const paid = classStudents.filter((s) => {
      const rec = s.monthlyRecords?.[targetMonth];
      return rec ? rec.feeStatus === 'PAID' : (targetMonth === activeMonth && s.feeStatus === 'PAID');
    }).length;
    const unpaid = total - paid;
    const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { total, paid, unpaid, percentage };
  }, [students, activeMonth]);

  const value = useMemo(
    () => ({
      classes,
      students,
      settings,
      activeMonth,
      monthsList: ACADEMIC_MONTHS,
      isCloudConnected,
      isSyncing,
      cloudError,
      retryConnection,
      setActiveMonth,
      toasts,
      showToast,
      removeToast,
      getStudentMonthRecord,
      getStudentPackageRecord,
      toggleExamFeeStatus,
      markExamFeePaid,
      markExamFeeUnpaid,
      markStudentPaid,
      markStudentUnpaid,
      markPackageIntervalPaid,
      markPackageIntervalsPaid,
      markPackageIntervalUnpaid,
      addStudent,
      updateStudent,
      deleteStudent,
      deleteAllStudents,
      updateSettings,
      getOverallStats,
      getClassStats,
    }),
    [
      classes,
      students,
      settings,
      activeMonth,
      isCloudConnected,
      isSyncing,
      cloudError,
      retryConnection,
      setActiveMonthState,
      toasts,
      showToast,
      removeToast,
      getStudentMonthRecord,
      getStudentPackageRecord,
      toggleExamFeeStatus,
      markExamFeePaid,
      markExamFeeUnpaid,
      markStudentPaid,
      markStudentUnpaid,
      markPackageIntervalPaid,
      markPackageIntervalsPaid,
      markPackageIntervalUnpaid,
      addStudent,
      updateStudent,
      deleteStudent,
      deleteAllStudents,
      updateSettings,
      getOverallStats,
      getClassStats,
    ]
  );

  return <FeeDataContext.Provider value={value}>{children}</FeeDataContext.Provider>;
};

export const useFeeData = () => {
  const context = useContext(FeeDataContext);
  if (!context) {
    throw new Error('useFeeData must be used within a FeeDataProvider');
  }
  return context;
};


