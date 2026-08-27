import React, { useState, useEffect } from 'react';
import { X, UserPlus, Edit3, AlertCircle, Layers, Calendar, Clock } from 'lucide-react';
import { Student, AdmissionType, PackageIntervalKey, PACKAGE_INTERVALS } from '../../types';
import { useFeeData } from '../../context/FeeDataContext';

interface AddEditStudentModalProps {
  student?: Student | null; // if provided, edit mode; else add mode
  defaultClassId?: string;
  onClose: () => void;
  onSuccess?: (student?: Student) => void;
}

export const AddEditStudentModal: React.FC<AddEditStudentModalProps> = ({
  student,
  defaultClassId,
  onClose,
  onSuccess,
}) => {
  const { classes, addStudent, updateStudent } = useFeeData();

  const isEdit = !!student;
  const [name, setName] = useState(student?.name || '');
  const [classId, setClassId] = useState(student?.classId || defaultClassId || classes[0]?.id || '');
  const [admissionType, setAdmissionType] = useState<AdmissionType>(student?.admissionType || 'UNPACKAGED');
  const [intervalDueDates, setIntervalDueDates] = useState<Record<PackageIntervalKey, string>>(() => {
    const initial: Record<PackageIntervalKey, string> = {
      interval_1: '',
      interval_2: '',
      interval_3: '',
    };
    if (student?.packageRecords) {
      PACKAGE_INTERVALS.forEach((i) => {
        if (student.packageRecords?.[i.key]?.dueDate) {
          initial[i.key] = student.packageRecords[i.key]!.dueDate || '';
        }
      });
    }
    return initial;
  });
  const [error, setError] = useState<string | null>(null);

  // Prevent background scrolling on mobile when modal is active
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please enter student name');
      return;
    }

    if (isEdit && student) {
      const res = await updateStudent(student.id, {
        name,
        classId,
        admissionType,
        intervalDueDates: admissionType === 'PACKAGED' ? intervalDueDates : undefined,
      });
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess();
      } else {
        setError(res.error || 'Failed to update student');
      }
    } else {
      const res = await addStudent({
        name,
        classId,
        admissionType,
        intervalDueDates: admissionType === 'PACKAGED' ? intervalDueDates : undefined,
      });
      if (res.success) {
        onClose();
        if (onSuccess) onSuccess(res.student);
      } else {
        setError(res.error || 'Failed to add student');
      }
    }
  };

  return (
    <div
      id="student-form-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="student-form-card"
        className="w-full sm:max-w-md bg-white/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white/40">
          <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
        </div>

        <div className="px-5 sm:px-6 py-3.5 border-b border-white/60 flex items-center justify-between bg-white/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/80 border border-white flex items-center justify-center text-slate-800 shadow-xs">
              {isEdit ? <Edit3 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <h2 className="text-base font-bold text-[#0f172a]">
              {isEdit ? 'Edit Student Record' : 'Add New Student'}
            </h2>
          </div>
          <button
            id="close-student-form"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-all border border-transparent hover:border-white active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200/80 flex items-start gap-2.5 text-xs text-rose-800 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="student-name-input" className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
              Full Name *
            </label>
            <input
              id="student-name-input"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aarav Sharma"
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/80 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white text-[#0f172a] placeholder:text-[#64748b] shadow-xs"
            />
          </div>

          <div>
            <label htmlFor="student-class-select" className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-1.5">
              Class *
            </label>
            <select
              id="student-class-select"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/80 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 text-[#0f172a] shadow-xs"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {/* Admission / Payment Scheme Selector */}
          <div>
            <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">
              Admission Type *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                id="admission-type-unpackaged-btn"
                onClick={() => setAdmissionType('UNPACKAGED')}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                  admissionType === 'UNPACKAGED'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-800/30'
                    : 'bg-white/70 hover:bg-white border-white/90 text-slate-700 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Unpackaged</span>
                </div>
                <div className={`text-[11px] leading-tight ${admissionType === 'UNPACKAGED' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Monthly fee tracking system
                </div>
              </button>

              <button
                type="button"
                id="admission-type-packaged-btn"
                onClick={() => setAdmissionType('PACKAGED')}
                className={`p-3 rounded-2xl border text-left transition-all relative flex flex-col justify-between gap-1.5 ${
                  admissionType === 'PACKAGED'
                    ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-slate-800/30'
                    : 'bg-white/70 hover:bg-white border-white/90 text-slate-700 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold text-xs">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Packaged</span>
                </div>
                <div className={`text-[11px] leading-tight ${admissionType === 'PACKAGED' ? 'text-slate-300' : 'text-slate-500'}`}>
                  3-Interval fee payment system
                </div>
              </button>
            </div>
          </div>

          {/* Packaged Interval Due Dates Configuration */}
          {admissionType === 'PACKAGED' && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-950">Interval Due Dates</span>
                </div>
                <span className="text-[10px] text-indigo-600 font-medium">Optional reminder</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                Enter due dates for each interval. The student directory will automatically display dues in that specific month.
              </p>

              <div className="space-y-2.5 pt-1">
                {PACKAGE_INTERVALS.map((intMeta) => (
                  <div key={intMeta.key} className="flex items-center justify-between gap-2 bg-white/80 p-2 rounded-xl border border-indigo-100/80 shadow-2xs">
                    <label htmlFor={`due-date-${intMeta.key}`} className="text-xs font-bold text-slate-700 flex-shrink-0">
                      {intMeta.name}
                    </label>
                    <input
                      id={`due-date-${intMeta.key}`}
                      type="date"
                      value={intervalDueDates[intMeta.key] || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setIntervalDueDates((prev) => ({
                          ...prev,
                          [intMeta.key]: val,
                        }));
                      }}
                      className="px-2 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isEdit && (
            <div className="p-3 bg-white/50 border border-white/70 rounded-2xl text-xs text-[#64748b]">
              New students default to <strong className="text-rose-600 font-bold">UNPAID</strong> status. Fee payments can be recorded immediately after creating.
            </div>
          )}

          <div className="pt-3 border-t border-white/60 flex items-center justify-end gap-3">
            <button
              id="cancel-student-form"
              type="button"
              onClick={onClose}
              className="min-h-[46px] px-4 py-2.5 rounded-xl border border-white/80 bg-white/70 hover:bg-white active:scale-95 text-sm font-semibold text-slate-700 transition-all shadow-xs"
            >
              Cancel
            </button>
            <button
              id="save-student-btn"
              type="submit"
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#334155] hover:bg-slate-700 active:bg-slate-800 active:scale-95 text-white text-sm font-bold shadow-md transition-all"
            >
              {isEdit ? 'Save Changes' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
