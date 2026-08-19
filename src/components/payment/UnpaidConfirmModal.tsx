import React from 'react';
import { AlertTriangle, X, Undo2 } from 'lucide-react';
import { Student } from '../../types';
import { useFeeData } from '../../context/FeeDataContext';

interface UnpaidConfirmModalProps {
  student: Student | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const UnpaidConfirmModal: React.FC<UnpaidConfirmModalProps> = ({ student, onClose, onSuccess }) => {
  const { markStudentUnpaid, activeMonth, getStudentMonthRecord } = useFeeData();

  if (!student) return null;

  const monthRecord = getStudentMonthRecord(student.id, activeMonth);

  const handleConfirm = () => {
    markStudentUnpaid(student.id, activeMonth);
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div
      id="unpaid-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="unpaid-modal-card"
        className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/80 overflow-hidden animate-in zoom-in-95 duration-200"
      >
        <div className="px-6 py-4 border-b border-white/60 flex items-center justify-between bg-amber-50/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100/80 border border-amber-200/60 flex items-center justify-center text-amber-700 shadow-xs">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-[#0f172a]">Mark {activeMonth} as Unpaid?</h2>
          </div>
          <button
            id="close-unpaid-modal"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-all border border-transparent hover:border-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-white/50 border border-white/80 rounded-2xl p-4 space-y-2 shadow-xs">
            <div className="text-sm font-bold text-[#0f172a]">{student.name}</div>
            <div className="flex items-center gap-3 text-xs text-[#64748b]">
              <span>Roll: <strong className="font-mono text-[#0f172a]">{student.rollNumber}</strong></span>
              <span>•</span>
              <span>Class {student.className} - {student.sectionName}</span>
            </div>
            <div className="text-xs text-[#64748b] pt-2 border-t border-white/60 mt-2 flex justify-between">
              <span>Month: <strong className="text-slate-900 font-bold">{activeMonth}</strong></span>
              <span>{monthRecord.paymentMode ? monthRecord.paymentMode.replace('_', ' ') : ''} • {monthRecord.paymentDate || ''}</span>
            </div>
          </div>

          <p className="text-sm text-[#64748b] leading-relaxed">
            This will remove the payment record for <strong>{activeMonth}</strong> and mark <strong>{student.name}</strong> as <span className="font-bold text-rose-600">UNPAID</span> for {activeMonth}.
          </p>
        </div>

        <div className="p-4 sm:p-5 border-t border-white/60 bg-white/40 flex items-center justify-end gap-3">
          <button
            id="cancel-unpaid-action"
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2.5 rounded-xl border border-white/80 bg-white/60 hover:bg-white text-sm font-semibold text-slate-700 transition-all shadow-xs"
          >
            Cancel
          </button>
          <button
            id="confirm-mark-unpaid-btn"
            type="button"
            onClick={handleConfirm}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-amber-600/20 transition-all"
          >
            <Undo2 className="w-4 h-4" /> Revert to Unpaid
          </button>
        </div>
      </div>
    </div>
  );
};
