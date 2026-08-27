import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  GraduationCap,
  Trash2,
  Edit3,
  Check,
  Undo2,
  Layers,
  Clock,
  CreditCard,
} from 'lucide-react';
import { Student, PackageIntervalKey, PACKAGE_INTERVALS } from '../../types';
import { useFeeData } from '../../context/FeeDataContext';

interface StudentDetailModalProps {
  student: Student | null;
  onClose: () => void;
  onOpenPayment: (student: Student, month?: string) => void;
  onOpenUnpaid: (student: Student, month?: string) => void;
  onOpenEdit: (student: Student) => void;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({
  student: initialStudent,
  onClose,
  onOpenPayment,
  onOpenUnpaid,
  onOpenEdit,
}) => {
  const {
    students,
    deleteStudent,
    activeMonth,
    monthsList,
    getStudentMonthRecord,
    getStudentPackageRecord,
    markPackageIntervalUnpaid,
    toggleExamFeeStatus,
  } = useFeeData();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [inspectedMonth, setInspectedMonth] = useState<string>(activeMonth);
  const [inspectedInterval, setInspectedInterval] = useState<PackageIntervalKey>('INTERVAL_1');

  // Live student record from context for instant reactive UI updates
  const student = initialStudent ? (students.find((s) => s.id === initialStudent.id) || initialStudent) : null;

  // Prevent background scrolling on mobile when modal is active
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (!student) return null;

  const isPackaged = student.admissionType === 'PACKAGED';

  // Packaged interval stats
  const packageRecordsList = PACKAGE_INTERVALS.map((intMeta) => {
    return getStudentPackageRecord(student, intMeta.key);
  });
  const paidIntervalsCount = packageRecordsList.filter((r) => r.feeStatus === 'PAID').length;
  const isAllIntervalsPaid = paidIntervalsCount === PACKAGE_INTERVALS.length;
  const inspectedIntervalRecord = getStudentPackageRecord(student, inspectedInterval);

  // Unpackaged monthly stats
  const currentMonthRecord = getStudentMonthRecord(student, activeMonth);
  const isPaidCurrentMonth = currentMonthRecord.feeStatus === 'PAID';
  const inspectedMonthRecord = getStudentMonthRecord(student, inspectedMonth);
  const isPaidInspectedMonth = inspectedMonthRecord.feeStatus === 'PAID';
  const totalMonthsPaid = monthsList.filter(
    (m) => getStudentMonthRecord(student, m).feeStatus === 'PAID'
  ).length;

  const handleDelete = () => {
    deleteStudent(student.id);
    onClose();
  };

  const handleRevertInterval = (intervalKey: PackageIntervalKey) => {
    markPackageIntervalUnpaid(student.id, intervalKey);
  };

  return (
    <div
      id="student-detail-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="student-detail-card"
        className="w-full sm:max-w-xl bg-white/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/80 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[90vh] animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white/40">
          <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-white/60 flex items-center justify-between bg-white/40">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
                Student Profile
              </span>
              <span
                className={`px-2 py-0.2 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                  isPackaged
                    ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}
              >
                {isPackaged ? 'Packaged Admission' : 'Unpackaged Admission'}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-[#0f172a] leading-snug">{student.name}</h2>
          </div>
          <button
            id="close-student-detail"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-all border border-transparent hover:border-white active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 overscroll-contain">
          {/* Status Hero Card */}
          {isPackaged ? (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isAllIntervalsPaid
                  ? 'bg-emerald-50/90 border-emerald-200/90 text-emerald-950 shadow-xs'
                  : 'bg-indigo-50/90 border-indigo-200/90 text-indigo-950 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    isAllIntervalsPaid ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isAllIntervalsPaid ? <CheckCircle2 className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                    Package Payment Status
                  </div>
                  <div className="text-base sm:text-lg font-black tracking-tight">
                    {isAllIntervalsPaid ? 'All Intervals Cleared' : `${3 - paidIntervalsCount} Interval(s) Due`}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-semibold opacity-80">Payment Plan</div>
                <div className="text-xs sm:text-sm font-bold bg-white px-2.5 py-1 rounded-lg border border-white shadow-xs">
                  {paidIntervalsCount} / 3 Intervals Paid
                </div>
              </div>
            </div>
          ) : (
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                isPaidCurrentMonth
                  ? 'bg-emerald-50/90 border-emerald-200/90 text-emerald-950 shadow-xs'
                  : 'bg-rose-50/90 border-rose-200/90 text-rose-950 shadow-xs'
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
                  <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
                    {activeMonth} Fee Status
                  </div>
                  <div className="text-base sm:text-lg font-black tracking-tight">{currentMonthRecord.feeStatus}</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[11px] font-semibold opacity-80">Academic Year</div>
                <div className="text-xs sm:text-sm font-bold bg-white px-2.5 py-1 rounded-lg border border-white shadow-xs">
                  {totalMonthsPaid} / {monthsList.length} Paid
                </div>
              </div>
            </div>
          )}

          {/* Details Table */}
          <div className="border border-white/80 rounded-2xl divide-y divide-white/60 overflow-hidden text-sm bg-white/70 shadow-xs">
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-[#64748b] flex items-center gap-2 text-xs font-semibold">
                <GraduationCap className="w-4 h-4 text-slate-500" /> Class
              </span>
              <span className="font-semibold text-[#0f172a]">
                {student.className}
              </span>
            </div>
            <div className="px-4 py-2.5 flex items-center justify-between">
              <span className="text-[#64748b] flex items-center gap-2 text-xs font-semibold">
                <Layers className="w-4 h-4 text-slate-500" /> Admission Plan
              </span>
              <span className="font-semibold text-[#0f172a]">
                {isPackaged ? 'Packaged (3-Interval Payment)' : 'Unpackaged (Monthly Fee)'}
              </span>
            </div>
          </div>

          {/* PACKAGED ADMISSION INTERVALS SECTION */}
          {isPackaged ? (
            <div className="bg-white/70 border border-white/80 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" /> 3-Interval Payment Plan
                </h3>
                <span className="text-[11px] text-[#64748b]">Select interval to inspect or pay</span>
              </div>

              {/* Intervals Grid */}
              <div className="grid grid-cols-3 gap-2">
                {PACKAGE_INTERVALS.map((intMeta) => {
                  const rec = getStudentPackageRecord(student, intMeta.key);
                  const isPaid = rec.feeStatus === 'PAID';
                  const isInspected = inspectedInterval === intMeta.key;

                  return (
                    <button
                      key={intMeta.key}
                      type="button"
                      onClick={() => setInspectedInterval(intMeta.key)}
                      className={`min-h-[58px] p-3 rounded-2xl text-xs font-bold border transition-all text-left flex flex-col justify-between active:scale-95 ${
                        isInspected
                          ? 'ring-2 ring-indigo-500/50 bg-white shadow-sm'
                          : 'bg-white/80 hover:bg-white'
                      } ${
                        isPaid
                          ? 'border-emerald-200 text-emerald-900 bg-emerald-50/40'
                          : 'border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-bold truncate text-[#0f172a]">
                          {intMeta.shortName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">1/3</span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[11px]">
                        {isPaid ? (
                          <span className="font-bold text-emerald-700">✓ Paid</span>
                        ) : (
                          <span className="font-semibold text-rose-700">✗ Unpaid</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Interval Details */}
              <div className="bg-white border border-white/90 rounded-xl p-3.5 text-xs space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 text-sm">
                      {inspectedIntervalRecord.intervalName}
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                      inspectedIntervalRecord.feeStatus === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {inspectedIntervalRecord.feeStatus}
                  </span>
                </div>

                {inspectedIntervalRecord.feeStatus === 'PAID' ? (
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span>Mode: <strong className="text-slate-800">{inspectedIntervalRecord.paymentMode?.replace('_', ' ')}</strong></span>
                      <span>Payment Date: <strong className="text-slate-800">{inspectedIntervalRecord.paymentDate || 'Recorded'}</strong></span>
                      {inspectedIntervalRecord.paymentNote && (
                        <span>Note: <strong className="font-mono text-slate-800">{inspectedIntervalRecord.paymentNote}</strong></span>
                      )}
                    </div>
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleRevertInterval(inspectedInterval)}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors active:scale-95 flex items-center gap-1"
                      >
                        <Undo2 className="w-3 h-3" /> Revert {inspectedIntervalRecord.intervalName} to Unpaid
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[#64748b] text-[11px] pt-0.5">
                    This interval has not been marked as paid yet.
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* UNPACKAGED MONTHLY PAYMENT REGISTER / HISTORY */
            <div className="bg-white/70 border border-white/80 rounded-2xl p-4 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#0f172a] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-slate-500" /> Payment Register
                </h3>
                <span className="text-[11px] text-[#64748b]">Tap any month to inspect or pay</span>
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
                      className={`min-h-[46px] p-2.5 rounded-xl text-xs font-bold border transition-all text-left flex flex-col justify-between active:scale-95 ${
                        isInspected
                          ? 'ring-2 ring-slate-400/50 bg-white shadow-sm'
                          : 'bg-white/80 hover:bg-white'
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
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
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
              <div className="bg-white border border-white/90 rounded-xl p-3.5 text-xs space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-sm">
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

                {/* July Special Exam Fee Row inside inspected month */}
                {inspectedMonth === 'July' && (
                  <div className="mt-1 pt-2 border-t border-slate-100 flex items-center justify-between gap-2 bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-800">Exam Fees:</span>
                      {inspectedMonthRecord.examFeeStatus === 'PAID' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-purple-100 text-purple-900 border border-purple-200 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-purple-700" /> Paid
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-bold text-[11px] bg-amber-100 text-amber-900 border border-amber-200 shadow-2xs">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700" /> Unpaid
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleExamFeeStatus(student.id, 'July')}
                      className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer ${
                        inspectedMonthRecord.examFeeStatus === 'PAID'
                          ? 'text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 shadow-2xs'
                          : 'text-white bg-purple-600 hover:bg-purple-700 shadow-xs'
                      }`}
                    >
                      {inspectedMonthRecord.examFeeStatus === 'PAID' ? (
                        <>
                          <Undo2 className="w-3.5 h-3.5 text-slate-600" /> Revert
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" /> Mark Paid
                        </>
                      )}
                    </button>
                  </div>
                )}

                {isPaidInspectedMonth ? (
                  <div className="space-y-2 pt-0.5">
                    <div className="text-slate-600 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                      <span>Mode: <strong className="text-slate-800">{inspectedMonthRecord.paymentMode?.replace('_', ' ')}</strong></span>
                      <span>Submission Date: <strong className="text-slate-800">{inspectedMonthRecord.paymentDate || 'Recorded'}</strong></span>
                      {inspectedMonthRecord.paymentNote && (
                        <span>Note: <strong className="font-mono text-slate-800">{inspectedMonthRecord.paymentNote}</strong></span>
                      )}
                    </div>
                    <div className="flex items-center justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenUnpaid(student, inspectedMonth);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors active:scale-95 flex items-center gap-1"
                      >
                        <Undo2 className="w-3 h-3" /> Revert {inspectedMonth} Monthly Fee
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-[#64748b] text-[11px] pt-0.5">
                    Fee has not been collected for <strong className="text-slate-700">{inspectedMonth}</strong>.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Delete Confirmation Step inside Modal */}
          {showDeleteConfirm ? (
            <div className="p-4 bg-rose-50/90 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in">
              <div className="text-xs font-bold text-rose-900">Confirm Deletion</div>
              <p className="text-xs text-rose-800 leading-relaxed">
                Are you sure you want to permanently delete <strong>{student.name}</strong> from the school register? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="min-h-[42px] px-3.5 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white active:scale-95"
                >
                  Cancel
                </button>
                <button
                  id="confirm-delete-student-btn"
                  type="button"
                  onClick={handleDelete}
                  className="min-h-[42px] px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold shadow-xs"
                >
                  Delete Student
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className="p-4 sm:p-5 border-t border-white/60 bg-white/50 flex flex-wrap items-center justify-between gap-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex items-center gap-2">
            <button
              id="edit-student-from-detail"
              type="button"
              onClick={() => {
                onClose();
                onOpenEdit(student);
              }}
              className="min-h-[46px] px-3.5 py-2 rounded-xl border border-white/80 bg-white/70 hover:bg-white active:scale-95 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              id="delete-student-trigger"
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="min-h-[46px] px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50/80 active:scale-95 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="student-detail-record-any-payment"
              type="button"
              onClick={() => {
                onClose();
                onOpenPayment(student, !isPackaged ? inspectedMonth : undefined);
              }}
              className="min-h-[46px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-95 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              {isPackaged
                ? isAllIntervalsPaid
                  ? 'Record Payment'
                  : 'Record Interval Payment'
                : !isPaidInspectedMonth
                ? `Record ${inspectedMonth} Payment`
                : 'Record Advance / New Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
