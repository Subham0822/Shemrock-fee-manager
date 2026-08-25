import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Student, SchoolClass, SchoolSettings, PaymentMode, MonthPaymentRecord, FeeStatus } from '../types';
import { DEFAULT_SETTINGS, INITIAL_CLASSES, ACADEMIC_MONTHS } from '../data/seedData';
import { db, handleFirestoreError, OperationType, testConnection } from '../firebase';
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
  markStudentPaid: (studentId: string, paymentMode: PaymentMode, note?: string, month?: string) => Promise<boolean>;
  markStudentUnpaid: (studentId: string, month?: string) => Promise<boolean>;
  addStudent: (data: { name: string; classId: string }) => Promise<{ success: boolean; error?: string; student?: Student }>;
  updateStudent: (studentId: string, data: { name: string; classId: string }) => Promise<{ success: boolean; error?: string }>;
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

// Clear any legacy seed caches from older versions
try {
  localStorage.removeItem('sfm_students_v2_monthly');
  localStorage.removeItem('sfm_students_v2');
  localStorage.removeItem('sfm_students');
} catch {
  // ignore
}

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
      const saved = localStorage.getItem(STORAGE_KEY_STUDENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(true);
  const [cloudError, setCloudError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [retryTrigger, setRetryTrigger] = useState(0);

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

  // Initialize Firestore listeners
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
          setStudents([]);
          try {
            localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify([]));
          } catch {
            // ignore
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
      localStorage.setItem(STORAGE_KEY_STUDENTS, JSON.stringify(students));
    } catch (e) {
      console.error('Failed to persist students:', e);
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
      return student.monthlyRecords[targetMonth];
    }
    if (targetMonth === activeMonth && student.feeStatus) {
      return {
        feeStatus: student.feeStatus,
        paymentMode: student.paymentMode,
        paymentDate: student.paymentDate,
        paymentNote: student.paymentNote,
      };
    }
    return {
      feeStatus: 'UNPAID',
      paymentMode: null,
      paymentDate: null,
    };
  }, [activeMonth]);

  const markStudentPaid = useCallback(async (studentId: string, paymentMode: PaymentMode, note?: string, month?: string) => {
    const targetMonth = month || activeMonth;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const targetStudent = students.find((s) => s.id === studentId);
    if (!targetStudent) return false;

    const currentRecords = targetStudent.monthlyRecords || {};
    const newRecord: MonthPaymentRecord = {
      feeStatus: 'PAID',
      paymentMode,
      paymentDate: dateStr,
      paymentNote: note?.trim() || undefined,
    };
    const updatedRecords = {
      ...currentRecords,
      [targetMonth]: newRecord,
    };

    const isCurrentActive = targetMonth === activeMonth;
    const updatedStudent: Student = {
      ...targetStudent,
      feeStatus: isCurrentActive ? 'PAID' : targetStudent.feeStatus,
      paymentMode: isCurrentActive ? paymentMode : targetStudent.paymentMode,
      paymentDate: isCurrentActive ? dateStr : targetStudent.paymentDate,
      paymentNote: isCurrentActive ? (note?.trim() || undefined) : targetStudent.paymentNote,
      monthlyRecords: updatedRecords,
      updatedAt: now.toISOString(),
    };

    // Optimistic UI update
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updatedStudent : s)));
    showToast('Payment Recorded', `${targetStudent.name} marked as PAID for ${targetMonth} via ${paymentMode.replace('_', ' ')}`, 'success');

    // Firestore sync
    try {
      await setDoc(doc(db, 'students', studentId), sanitizeFirestoreData(updatedStudent));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
      return true;
    }
  }, [activeMonth, students, showToast]);

  const markStudentUnpaid = useCallback(async (studentId: string, month?: string) => {
    const targetMonth = month || activeMonth;
    const now = new Date();
    const targetStudent = students.find((s) => s.id === studentId);
    if (!targetStudent) return false;

    const currentRecords = targetStudent.monthlyRecords || {};
    const newRecord: MonthPaymentRecord = {
      feeStatus: 'UNPAID',
      paymentMode: null,
      paymentDate: null,
    };
    const updatedRecords = {
      ...currentRecords,
      [targetMonth]: newRecord,
    };

    const isCurrentActive = targetMonth === activeMonth;
    const updatedStudent: Student = {
      ...targetStudent,
      feeStatus: isCurrentActive ? 'UNPAID' : targetStudent.feeStatus,
      paymentMode: isCurrentActive ? null : targetStudent.paymentMode,
      paymentDate: isCurrentActive ? null : targetStudent.paymentDate,
      paymentNote: isCurrentActive ? undefined : targetStudent.paymentNote,
      monthlyRecords: updatedRecords,
      updatedAt: now.toISOString(),
    };

    // Optimistic UI update
    setStudents((prev) => prev.map((s) => (s.id === studentId ? updatedStudent : s)));
    showToast('Status Updated', `${targetStudent.name} fee status reverted to UNPAID for ${targetMonth}`, 'info');

    // Firestore sync
    try {
      await setDoc(doc(db, 'students', studentId), sanitizeFirestoreData(updatedStudent));
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${studentId}`);
      return true;
    }
  }, [activeMonth, students, showToast]);

  const addStudent = useCallback(async (data: { name: string; classId: string }) => {
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
    const initialRecords: Record<string, MonthPaymentRecord> = {};
    ACADEMIC_MONTHS.forEach((m) => {
      initialRecords[m] = {
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
      feeStatus: 'UNPAID',
      paymentMode: null,
      paymentDate: null,
      monthlyRecords: initialRecords,
      createdAt: now,
      updatedAt: now,
    };

    setStudents((prev) => [newStudent, ...prev]);
    showToast('Student Added', `${trimmedName} added to ${cls.name}`, 'success');

    try {
      await setDoc(doc(db, 'students', newStudentId), sanitizeFirestoreData(newStudent));
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `students/${newStudentId}`);
    }

    return { success: true, student: newStudent };
  }, [classes, students, showToast]);

  const updateStudent = useCallback(async (studentId: string, data: { name: string; classId: string }) => {
    const trimmedName = data.name.trim();

    if (!trimmedName) return { success: false, error: 'Student name is required' };

    const cls = classes.find((c) => c.id === data.classId);
    if (!cls) return { success: false, error: 'Selected class not found' };

    const currentStudent = students.find((s) => s.id === studentId);
    if (!currentStudent) return { success: false, error: 'Student not found' };

    const now = new Date().toISOString();
    const updatedStudent: Student = {
      ...currentStudent,
      name: trimmedName,
      classId: cls.id,
      className: cls.name,
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
    const total = students.length;
    const paid = students.filter((s) => {
      const rec = s.monthlyRecords?.[targetMonth];
      return rec ? rec.feeStatus === 'PAID' : (targetMonth === activeMonth && s.feeStatus === 'PAID');
    }).length;
    const unpaid = total - paid;
    const percentage = total > 0 ? Math.round((paid / total) * 100) : 0;
    return { total, paid, unpaid, percentage };
  }, [students, activeMonth]);

  const getClassStats = useCallback((classId: string, month?: string): FeeStats => {
    const targetMonth = month || activeMonth;
    const classStudents = students.filter((s) => s.classId === classId);
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
      markStudentPaid,
      markStudentUnpaid,
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
      setActiveMonth,
      toasts,
      showToast,
      removeToast,
      getStudentMonthRecord,
      markStudentPaid,
      markStudentUnpaid,
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


