import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  Banknote,
  Smartphone,
  Building2,
  FileText,
  MoreHorizontal,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Student, PaymentMode } from '../../types';
import { useFeeData } from '../../context/FeeDataContext';

interface PaymentModalProps {
  student: Student | null;
  initialMonth?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const PAYMENT_OPTIONS: { mode: PaymentMode; label: string; sub: string; icon: React.ReactNode }[] = [
  {
    mode: 'UPI',
    label: 'UPI',
    sub: 'Google Pay, PhonePe, Paytm, QR',
    icon: <Smartphone className="w-5 h-5 text-indigo-600" />,
  },
  {
    mode: 'CASH',
    label: 'Cash',
    sub: 'Physical cash received at desk',
    icon: <Banknote className="w-5 h-5 text-emerald-600" />,
  },
  {
    mode: 'BANK_TRANSFER',
    label: 'Bank Transfer',
    sub: 'NEFT, IMPS, RTGS, Net Banking',
    icon: <Building2 className="w-5 h-5 text-blue-600" />,
  },
  {
    mode: 'CHEQUE',
    label: 'Cheque',
    sub: 'Bank Cheque or Demand Draft',
    icon: <FileText className="w-5 h-5 text-amber-600" />,
  },
  {
    mode: 'OTHER',
    label: 'Other',
    sub: 'POS card swipe or miscellaneous',
    icon: <MoreHorizontal className="w-5 h-5 text-slate-600" />,
  },
];

export const PaymentModal: React.FC<PaymentModalProps> = ({
  student,
  initialMonth,
  onClose,
  onSuccess,
}) => {
  const { markStudentPaid, activeMonth, monthsList, getStudentMonthRecord } = useFeeData();

  // Selected Months state (allows single, future, or multiple months)
  const [selectedMonths, setSelectedMonths] = useState<string[]>(() => {
    return [initialMonth || activeMonth];
  });

  // Exact date of fee submission (defaults to today's local date YYYY-MM-DD)
  const [paymentDate, setPaymentDate] = useState<string>(() => {
    const today = new Date();
    return today.toLocaleDateString('en-CA'); // YYYY-MM-DD format in local timezone
  });

  const [selectedMode, setSelectedMode] = useState<PaymentMode>('UPI');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'select' | 'confirm'>('select');

  // Prevent background scrolling on mobile when modal is active
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  if (!student) return null;

  // Active month index to identify future months
  const activeMonthIdx = monthsList.indexOf(activeMonth);

  const toggleMonth = (monthName: string) => {
    setSelectedMonths((prev) => {
      if (prev.includes(monthName)) {
        if (prev.length === 1) {
          // Keep at least one month selected
          return prev;
        }
        return prev.filter((m) => m !== monthName);
      } else {
        // Keep in chronological order according to monthsList
        const updated = [...prev, monthName];
        return monthsList.filter((m) => updated.includes(m));
      }
    });
  };

  const selectOnlyCurrentMonth = () => {
    setSelectedMonths([activeMonth]);
  };

  const selectCurrentAndNextMonth = () => {
    const nextMonth = monthsList[activeMonthIdx + 1];
    if (nextMonth) {
      setSelectedMonths([activeMonth, nextMonth]);
    } else {
      setSelectedMonths([activeMonth]);
    }
  };

  const selectAllUnpaidMonths = () => {
    const unpaid = monthsList.filter(
      (m) => getStudentMonthRecord(student, m).feeStatus !== 'PAID'
    );
    if (unpaid.length > 0) {
      setSelectedMonths(unpaid);
    } else {
      setSelectedMonths([activeMonth]);
    }
  };

  // Helper date buttons
  const setTodayDate = () => {
    const today = new Date();
    setPaymentDate(today.toLocaleDateString('en-CA'));
  };

  const setYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    setPaymentDate(yesterday.toLocaleDateString('en-CA'));
  };

  // Human readable date formatting
  const formattedReadableDate = useMemo(() => {
    try {
      if (!paymentDate) return '';
      const [y, m, d] = paymentDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return paymentDate;
    }
  }, [paymentDate]);

  const handleConfirm = () => {
    markStudentPaid(student.id, selectedMode, note, selectedMonths, paymentDate);
    onClose();
    if (onSuccess) onSuccess();
  };

  return (
    <div
      id="payment-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="payment-modal-card"
        className="w-full sm:max-w-xl bg-white/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/80 overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white/40">
          <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-white/60 flex items-center justify-between bg-white/40">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">
              Record Fee Payment
            </span>
            <h2 className="text-base sm:text-lg font-bold text-[#0f172a] leading-snug">
              {student.name}
            </h2>
          </div>
          <button
            id="close-payment-modal"
            onClick={onClose}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-2xl text-slate-500 hover:text-slate-900 hover:bg-white/80 transition-all border border-transparent hover:border-white active:scale-95"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student Context Card */}
        <div className="px-5 sm:px-6 py-2.5 bg-white/40 border-b border-white/50 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#64748b]">
            <span className="font-medium">Class:</span>
            <span className="font-bold text-[#0f172a] bg-white px-2 py-0.5 rounded-md border border-white">
              {student.className}
            </span>
          </div>
          <div className="text-xs font-semibold text-slate-700">
            Selected: <span className="font-bold text-emerald-700">{selectedMonths.length} {selectedMonths.length === 1 ? 'Month' : 'Months'}</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {step === 'select' ? (
            <>
              {/* 1. Target Months Selector (Multi-month & Future months supported) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-slate-600" />
                    Select Fee Period / Months
                  </label>
                  <span className="text-[11px] text-[#64748b]">Tap to toggle months</span>
                </div>

                {/* Quick Presets for Months */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  <button
                    type="button"
                    onClick={selectOnlyCurrentMonth}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex-shrink-0 active:scale-95 ${
                      selectedMonths.length === 1 && selectedMonths[0] === activeMonth
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                        : 'bg-white/80 text-slate-700 border-white/90 hover:bg-white'
                    }`}
                  >
                    Current: {activeMonth}
                  </button>

                  {activeMonthIdx < monthsList.length - 1 && (
                    <button
                      type="button"
                      onClick={selectCurrentAndNextMonth}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/80 text-slate-700 border border-white/90 hover:bg-white transition-all flex-shrink-0 active:scale-95 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600" />
                      + Next Month (Advance)
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={selectAllUnpaidMonths}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/80 text-slate-700 border border-white/90 hover:bg-white transition-all flex-shrink-0 active:scale-95"
                  >
                    All Unpaid
                  </button>
                </div>

                {/* Months Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                  {monthsList.map((m, idx) => {
                    const isSelected = selectedMonths.includes(m);
                    const rec = getStudentMonthRecord(student, m);
                    const alreadyPaid = rec.feeStatus === 'PAID';
                    const isFuture = idx > activeMonthIdx;
                    const isCurrent = m === activeMonth;

                    return (
                      <button
                        key={m}
                        type="button"
                        id={`payment-month-toggle-${m.replace('/', '-')}`}
                        onClick={() => toggleMonth(m)}
                        className={`min-h-[48px] p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-95 relative ${
                          isSelected
                            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-400/40'
                            : alreadyPaid
                            ? 'bg-emerald-50/70 border-emerald-200/80 text-emerald-900 hover:bg-emerald-50'
                            : 'bg-white/70 border-white/90 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-[#0f172a]'}`}>
                            {m}
                          </span>
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                              isSelected
                                ? 'bg-emerald-400 border-emerald-400 text-slate-900'
                                : 'border-slate-300 bg-white/80'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[10px]">
                          {alreadyPaid ? (
                            <span className={isSelected ? 'text-emerald-200 font-semibold' : 'text-emerald-700 font-semibold'}>
                              Paid
                            </span>
                          ) : (
                            <span className={isSelected ? 'text-slate-300' : 'text-[#64748b]'}>
                              Unpaid
                            </span>
                          )}

                          {isCurrent ? (
                            <span className={`px-1 py-0.2 rounded font-bold text-[9px] ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                              Current
                            </span>
                          ) : isFuture ? (
                            <span className={`px-1 py-0.2 rounded font-bold text-[9px] ${isSelected ? 'bg-indigo-400/30 text-indigo-200' : 'bg-indigo-50 text-indigo-700'}`}>
                              Future
                            </span>
                          ) : null}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Summary Pill */}
                <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-xl p-2.5 flex items-center justify-between text-xs text-emerald-900">
                  <span className="font-medium">
                    Marking <strong>{selectedMonths.length}</strong> {selectedMonths.length === 1 ? 'period' : 'periods'}:{' '}
                    <strong className="text-emerald-950">{selectedMonths.join(', ')}</strong>
                  </span>
                </div>
              </div>

              {/* 2. Exact Date of Fee Submission */}
              <div className="space-y-2 pt-2 border-t border-white/60">
                <div className="flex items-center justify-between">
                  <label htmlFor="payment-submission-date" className="block text-xs font-bold text-[#0f172a] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-600" />
                    Exact Date of Fee Submission
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={setTodayDate}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/80 border border-white hover:bg-white text-slate-700 active:scale-95"
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={setYesterdayDate}
                      className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white/80 border border-white hover:bg-white text-slate-700 active:scale-95"
                    >
                      Yesterday
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    id="payment-submission-date"
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    max="2099-12-31"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-white/90 bg-white/90 backdrop-blur-sm text-sm font-semibold text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white shadow-xs"
                    required
                  />
                </div>

                {formattedReadableDate && (
                  <p className="text-[11px] text-[#64748b] flex items-center gap-1 px-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    Fee submission recorded for: <strong className="text-[#0f172a] font-medium">{formattedReadableDate}</strong>
                  </p>
                )}
              </div>

              {/* 3. Payment Mode Selection */}
              <div className="space-y-2 pt-2 border-t border-white/60">
                <label className="block text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                  Payment Method
                </label>
                <div className="space-y-1.5">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const isSelected = selectedMode === opt.mode;
                    return (
                      <button
                        key={opt.mode}
                        id={`payment-mode-${opt.mode}`}
                        type="button"
                        onClick={() => setSelectedMode(opt.mode)}
                        className={`w-full min-h-[48px] p-2.5 sm:p-3 rounded-2xl border flex items-center justify-between transition-all text-left active:scale-[0.99] ${
                          isSelected
                            ? 'border-slate-800 bg-white ring-2 ring-slate-400/30 shadow-sm'
                            : 'border-white/80 bg-white/60 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center border border-white/60 ${
                              isSelected ? 'bg-white shadow-xs' : 'bg-white/60'
                            }`}
                          >
                            {opt.icon}
                          </div>
                          <div>
                            <div className="text-xs sm:text-sm font-bold text-[#0f172a]">{opt.label}</div>
                            <div className="text-[11px] text-[#64748b]">{opt.sub}</div>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-slate-800 bg-slate-800 text-white'
                              : 'border-slate-300 bg-white/60'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Optional Reference or Note */}
              <div className="pt-2 border-t border-white/60">
                <label htmlFor="payment-ref-note" className="block text-xs font-medium text-[#64748b] mb-1.5">
                  Reference / Receipt No. / Note <span className="text-slate-400 text-[11px]">(Optional)</span>
                </label>
                <input
                  id="payment-ref-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. UPI Ref 41209384, Receipt #104, Paid in Advance"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/80 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white text-[#0f172a] placeholder:text-[#64748b] shadow-xs"
                />
              </div>
            </>
          ) : (
            /* Confirmation Step */
            <div className="py-2 space-y-4">
              <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <p className="font-bold text-sm text-emerald-950">Confirm Fee Payment Entry</p>
                  <p className="mt-1">
                    You are recording fee payment for <strong>{student.name}</strong> for{' '}
                    <strong>{selectedMonths.length} {selectedMonths.length === 1 ? 'month' : 'months'}</strong> ({selectedMonths.join(', ')}).
                  </p>
                </div>
              </div>

              <div className="border border-white/80 rounded-2xl divide-y divide-white/60 overflow-hidden text-sm bg-white/70 shadow-xs">
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#64748b] text-xs">Student</span>
                  <span className="font-semibold text-[#0f172a]">{student.name}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#64748b] text-xs">Class</span>
                  <span className="font-medium text-[#0f172a]">{student.className}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-start">
                  <span className="text-[#64748b] text-xs mt-0.5">Months / Period</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-white inline-block">
                      {selectedMonths.join(', ')}
                    </span>
                    <span className="block text-[11px] text-emerald-700 font-semibold mt-0.5">
                      {selectedMonths.length} {selectedMonths.length === 1 ? 'month' : 'months'} marked as PAID
                    </span>
                  </div>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[#64748b] text-xs">Submission Date</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-white">
                    {formattedReadableDate || paymentDate}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[#64748b] text-xs">Payment Method</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 bg-white border border-white px-2 py-0.5 rounded-lg shadow-xs">
                    {selectedMode.replace('_', ' ')}
                  </span>
                </div>
                {note.trim() && (
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-[#64748b] text-xs">Note / Reference</span>
                    <span className="font-mono text-xs text-slate-800 font-medium">{note}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/60 bg-white/50 flex items-center justify-end gap-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {step === 'select' ? (
            <>
              <button
                id="cancel-payment-select"
                type="button"
                onClick={onClose}
                className="min-h-[46px] px-4 py-2.5 rounded-xl border border-white/80 bg-white/70 hover:bg-white active:scale-95 text-sm font-semibold text-slate-700 transition-all shadow-xs"
              >
                Cancel
              </button>
              <button
                id="proceed-to-confirm-payment"
                type="button"
                onClick={() => setStep('confirm')}
                disabled={selectedMonths.length === 0 || !paymentDate}
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#334155] hover:bg-slate-700 active:bg-slate-800 active:scale-95 text-white text-sm font-semibold flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                id="back-to-select-payment"
                type="button"
                onClick={() => setStep('select')}
                className="min-h-[46px] px-4 py-2.5 rounded-xl border border-white/80 bg-white/70 hover:bg-white active:scale-95 text-sm font-semibold text-slate-700 transition-all shadow-xs"
              >
                Back
              </button>
              <button
                id="confirm-payment-btn"
                type="button"
                onClick={handleConfirm}
                className="min-h-[46px] px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 active:scale-95 text-white text-sm font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" /> Confirm Payment
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

