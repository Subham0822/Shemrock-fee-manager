import React, { useState } from 'react';
import { X, CheckCircle2, AlertCircle, Calendar, Hash, GraduationCap, CreditCard, Trash2, Edit3, Check, Undo2 } from 'lucide-react';
import { Student } from '../../types';
import { useFeeData } from '../../context/FeeDataContext';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  onOpenPayment: (student: Student) => void;
  onOpenUnpaid: (student: Student) => void;
  onOpenEdit: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student,
  onClose,
  onOpenPayment,
  onOpenUnpaid,
  onOpenEdit,
}) => {
  const { deleteStudent, activeMonth, monthsList, getStudentMonthRecord } = useFeeData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [inspectedMonth, setInspectedMonth] = useState<string>(activeMonth);

  if (!student) return null;

  const currentMonthRecord = getStudentMonthRecord(student, activeMonth);
  const isPaidCurrentMonth = currentMonthRecord.feeStatus === 'PAID';

  const inspectedMonthRecord = getStudentMonthRecord(student, inspectedMonth);
  const isPaidInspectedMonth = inspectedMonthRecord.feeStatus === 'PAID';

  // Count total periods paid
  const totalMonthsPaid = monthsList.filter(
    (m) => getStudentMonthRecord(student, m).feeStatus === 'PAID'
  ).length;

  const handleDelete = () => {
    deleteStudent(student.id);
    onClose();
  };

  return (
    <div
      id="student-detail-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="student-detail-card"
        className="w-full sm:max-w-xl bg-white/70 backdrop-blur-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[92vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/60 flex items-center justify-between bg-white/40">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">Student Profile</span>
            <h2 className="text-lg font-bold text-[#0f172a] leading-snug">{student.name}</h2>
          </div>
          <button
            id="close-student-detail"
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-all border border-transparent hover:border-white"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Status Hero Card for Active Month */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              isPaidCurrentMonth
                ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-950 shadow-xs'
                : 'bg-rose-50/80 border-rose-200/80 text-rose-950 shadow-xs'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isPaidCurrentMonth ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}
              >
                {isPaidCurrentMonth ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider opacity-80">
                  {activeMonth} Fee Status
                </div>
                <div className="text-lg font-black tracking-tight">{currentMonthRecord.feeStatus}</div>
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs font-semibold opacity-80">Academic Year Progress</div>
              <div className="text-sm font-bold bg-white/80 px-2.5 py-1 rounded-lg border border-white">
                {totalMonthsPaid} / {monthsList.length} Periods Paid
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-white/80 rounded-2xl divide-y divide-white/60 overflow-hidden text-sm bg-white/50 shadow-xs">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-[#64748b] flex items-center gap-2 text-xs font-semibold">
                <GraduationCap className="w-4 h-4 text-slate-500" /> Class
              </span>
              <span className="font-semibold text-[#0f172a]">
                {student.className}
              </span>
            </div>
          </div>

          {/* Month/Period Payment Register / History */}
          <div className="bg-white/50 border border-white/80 rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-500" /> Payment Periods Register
              </h3>
              <span className="text-[11px] text-[#64748b]">Select period to inspect</span>
            </div>

            {/* Months Pills Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {monthsList.map((m) => {
                const rec = getStudentMonthRecord(student, m);
                const isPaid = rec.feeStatus === 'PAID';
                const isInspected = inspectedMonth === m;
                const isCurrent = activeMonth === m;

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setInspectedMonth(m)}
                    className={`p-2 rounded-xl text-xs font-bold border transition-all text-left flex flex-col justify-between ${
                      isInspected
                        ? 'ring-2 ring-slate-400/40 bg-white shadow-sm'
                        : 'bg-white/60 hover:bg-white/90'
                    } ${
                      isPaid
                        ? 'border-emerald-200 text-emerald-800'
                        : 'border-rose-200 text-rose-800'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-[11px] font-bold truncate text-[#0f172a]">
                        {m}
                      </span>
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[10px]">
                      {isPaid ? (
                        <span className="font-semibold text-emerald-700">✓ Paid</span>
                      ) : (
                        <span className="font-semibold text-rose-700">✗ Unpaid</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selected Period Details Snippet */}
            <div className="bg-white/80 border border-white rounded-xl p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">
                  {inspectedMonth} Record
                </span>
                <span
                  className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                    isPaidInspectedMonth
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {inspectedMonthRecord.feeStatus}
                </span>
              </div>
              {isPaidInspectedMonth ? (
                <div className="text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
                  <span>Mode: <strong className="text-slate-800">{inspectedMonthRecord.paymentMode?.replace('_', ' ')}</strong></span>
                  <span>Date: <strong className="text-slate-800">{inspectedMonthRecord.paymentDate || 'Recorded'}</strong></span>
                  {inspectedMonthRecord.paymentNote && (
                    <span>Note: <strong className="font-mono text-slate-800">{inspectedMonthRecord.paymentNote}</strong></span>
                  )}
                </div>
              ) : (
                <div className="text-[#64748b] text-[11px]">
                  Fee has not been collected for {inspectedMonth}.
                </div>
              )}
            </div>
          </div>

          {/* Delete Confirmation Step inside Modal */}
          {showDeleteConfirm ? (
            <div className="p-4 bg-rose-50/80 border border-rose-200/80 rounded-2xl space-y-3 animate-in fade-in">
              <div className="text-xs font-bold text-rose-900">Confirm Deletion</div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Are you sure you want to permanently delete <strong>{student.name}</strong> from the school register? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="min-h-[40px] px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-student-btn"
                  type="button"
                  onClick={handleDelete}
                  className="min-h-[40px] px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
                >
                  Delete Student
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-white/60 bg-white/40 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              id="edit-student-from-detail"
              type="button"
              onClick={() => {
                onClose();
                onOpenEdit(student);
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-xl border border-white/80 bg-white/60 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              id="delete-student-trigger"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="min-h-[44px] px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50/60 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>

          <div>
            {!isPaidCurrentMonth ? (
              <button
                id="student-detail-mark-paid"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPayment(student);
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Mark {activeMonth} Paid
              </button>
            ) : (
              <button
                id="student-detail-mark-unpaid"
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUnpaid(student);
                }}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-amber-50/80 border border-amber-300 hover:bg-amber-100 text-amber-900 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <Undo2 className="w-4 h-4" /> Revert {activeMonth} to Unpaid
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
