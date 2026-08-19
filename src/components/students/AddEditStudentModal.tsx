import React, { useState, useEffect } from 'react';
import { X, UserPlus, Edit3, AlertCircle } from 'lucide-react';
import { Student } from '../../types';
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

  const [error, setError] = useState<string | null>(null);

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
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="student-form-card"
        className="w-full sm:max-w-md bg-white/70 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/80 overflow-hidden flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        <div className="px-6 py-4 border-b border-white/60 flex items-center justify-between bg-white/40">
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
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-all border border-transparent hover:border-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-white/80 bg-white/70 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white text-[#0f172a] placeholder:text-[#64748b] shadow-xs"
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
              className="w-full px-3 py-2.5 rounded-xl border border-white/80 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 text-[#0f172a] shadow-xs"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </div>

          {!isEdit && (
            <div className="p-3 bg-white/40 border border-white/60 rounded-2xl text-xs text-[#64748b]">
              New students default to <strong className="text-rose-600 font-bold">UNPAID</strong> status. Fee payment can be recorded immediately after creating.
            </div>
          )}

          <div className="pt-3 border-t border-white/60 flex items-center justify-end gap-3">
            <button
              id="cancel-student-form"
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-white/80 bg-white/60 hover:bg-white text-sm font-semibold text-slate-700 transition-all shadow-xs"
            >
              Cancel
            </button>
            <button
              id="save-student-btn"
              type="submit"
              className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#334155] hover:bg-slate-700 text-white text-sm font-bold shadow-md transition-all"
            >
              {isEdit ? 'Save Changes' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
