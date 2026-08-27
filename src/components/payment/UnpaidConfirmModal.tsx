import React, { useEffect } from 'react';
import { AlertTriangle, X, Undo2 } from 'lucide-react';
import { Student } from '../../types';
import { useFeeData } from '../../context/FeeDataContext';

interface UnpaidConfirmModalProps {
  student: Student | null;
  month?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UnpaidConfirmModal: React.FC<UnpaidConfirmModalProps> = ({
  student: initialStudent,
  month,
  onClose,
  onSuccess,
}) => {
  const { students, markStudentUnpaid, activeMonth, getStudentMonthRecord } = useFeeData();
  const student = initialStudent ? (students.find((s) => s.id === initialStudent.id) || initialStudent) : null;
  const targetMonth = month || activeMonth;

  // Prevent background scrolling on mobile when modal is active
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (!student) return null;

  const monthRecord = getStudentMonthRecord(student, targetMonth);

  const handleConfirm = () => {
    markStudentUnpaid(student.id, targetMonth);
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div
      id="unpaid-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="unpaid-modal-card"
        className="w-full sm:max-w-md bg-white/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-amber-50/40">
          <div className="w-12 h-1 bg-amber-300/80 rounded-full"></div>
        </div>

        <div className="px-5 sm:px-6 py-3.5 border-b border-white/60 flex items-center justify-between bg-amber-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100/90 border border-amber-200/60 flex items-center justify-center text-amber-700 shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#0f172a]">Mark {targetMonth} as Unpaid?</h2>
          </div>
          <button
            id="close-unpaid-modal"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-all border border-transparent hover:border-white active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          <div className="bg-white/70 border border-white/90 rounded-2xl p-4 space-y-2 shadow-xs">
            <div className="text-sm font-bold text-[#0f172a]">{student.name}</div>
            <div className="flex items-center gap-2 text-xs text-[#64748b]">
              <span>Class: <strong className="font-semibold text-[#0f172a]">{student.className}</strong></span>
            </div>
            <div className="text-xs text-[#64748b] pt-2 border-t border-white/60 mt-2 flex justify-between">
              <span>Month: <strong className="text-slate-900 font-bold">{targetMonth}</strong></span>
              <span>{monthRecord.paymentMode ? monthRecord.paymentMode.replace('_', ' ') : ''} • {monthRecord.paymentDate || ''}</span>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-[#64748b] leading-relaxed">
            This will remove the payment record for <strong>{targetMonth}</strong> and mark <strong>{student.name}</strong> as <span className="font-bold text-rose-600">UNPAID</span> for {targetMonth}.
          </p>
        </div>

        <div className="p-4 sm:p-5 border-t border-white/60 bg-white/50 flex items-center justify-end gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <button
            id="cancel-unpaid-action"
            type="button"
            onClick={onClose}
            className="min-h-[46px] px-4 py-2.5 rounded-xl border border-white/80 bg-white/70 hover:bg-white active:scale-95 text-sm font-semibold text-slate-700 transition-all shadow-xs"
          >
            Cancel
          </button>
          <button
            id="confirm-mark-unpaid-btn"
            type="button"
            onClick={handleConfirm}
            className="min-h-[46px] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 active:scale-95 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all"
          >
            <Undo2 className="w-4 h-4" /> Revert to Unpaid
          </button>
        </div>
      </div>
    </div>
  );
};
