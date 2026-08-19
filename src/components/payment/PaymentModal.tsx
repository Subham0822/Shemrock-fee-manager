import React, { useState, useEffect } from 'react';
import { X, Check, Banknote, Smartphone, Building2, FileText, MoreHorizontal, ArrowRight, ShieldCheck } from 'lucide-react';
import { Student, PaymentMode } from '../../types';
import { useFeeData } from '../../context/FeeDataContext';

interface PaymentModalProps {
  student: Student | null;
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

export const PaymentModal: React.FC<PaymentModalProps> = ({ student, onClose, onSuccess }) => {
  const { markStudentPaid, activeMonth, monthsList } = useFeeData();
  const [selectedMonth, setSelectedMonth] = useState<string>(activeMonth);
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

  const handleConfirm = () => {
    markStudentPaid(student.id, selectedMode, note, selectedMonth);
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
        className="w-full sm:max-w-lg bg-white/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-white/80 overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col animate-in slide-in-from-bottom sm:zoom-in-95 duration-200"
      >
        {/* Mobile Pull Handle */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center bg-white/40">
          <div className="w-12 h-1 bg-slate-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-white/60 flex items-center justify-between bg-white/40">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#64748b]">Record Fee Payment</span>
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
        <div className="px-5 sm:px-6 pt-3 pb-3 bg-white/40 border-b border-white/50">
          <div className="flex items-center justify-between text-xs text-[#64748b]">
            <div>
              <span className="font-medium text-slate-500">Class:</span>{' '}
              <span className="font-bold text-[#0f172a]">{student.className}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-[#64748b] font-medium">Month:</span>
              <select
                id="payment-month-select"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-white border border-white/90 rounded-xl px-2.5 py-1 font-bold text-xs text-[#0f172a] focus:ring-2 focus:ring-slate-500 shadow-xs"
              >
                {monthsList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Modal Body with smooth scrolling */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {step === 'select' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-[#64748b] uppercase tracking-wider mb-2">
                  How was the fee paid for {selectedMonth}?
                </label>
                <div className="space-y-2">
                  {PAYMENT_OPTIONS.map((opt) => {
                    const isSelected = selectedMode === opt.mode;
                    return (
                      <button
                        key={opt.mode}
                        id={`payment-mode-${opt.mode}`}
                        type="button"
                        onClick={() => setSelectedMode(opt.mode)}
                        className={`w-full min-h-[52px] p-3 rounded-2xl border flex items-center justify-between transition-all text-left active:scale-[0.99] ${
                          isSelected
                            ? 'border-[#334155] bg-white ring-2 ring-slate-400/30 shadow-sm'
                            : 'border-white/80 bg-white/60 hover:bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border border-white/60 ${
                              isSelected ? 'bg-white shadow-xs' : 'bg-white/60'
                            }`}
                          >
                            {opt.icon}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-[#0f172a]">{opt.label}</div>
                            <div className="text-xs text-[#64748b]">{opt.sub}</div>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                            isSelected
                              ? 'border-[#334155] bg-[#334155] text-white'
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

              {/* Optional Reference or Note */}
              <div>
                <label htmlFor="payment-ref-note" className="block text-xs font-medium text-[#64748b] mb-1.5">
                  Reference / Receipt No. / Note <span className="text-slate-400 text-[11px]">(Optional)</span>
                </label>
                <input
                  id="payment-ref-note"
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. UPI Ref 41209384, Receipt #104"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-white/80 bg-white/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 focus:bg-white text-[#0f172a] placeholder:text-[#64748b] shadow-xs"
                />
              </div>
            </>
          ) : (
            /* Confirmation Step */
            <div className="py-2 space-y-4">
              <div className="bg-emerald-50/90 border border-emerald-200/90 rounded-2xl p-4 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 leading-relaxed">
                  <p className="font-semibold text-sm text-emerald-950">Confirm {selectedMonth} Fee Payment</p>
                  <p className="mt-1">
                    You are about to mark <strong>{student.name}</strong> as <strong>PAID</strong> for the month of <strong>{selectedMonth}</strong>.
                  </p>
                </div>
              </div>

              <div className="border border-white/80 rounded-2xl divide-y divide-white/60 overflow-hidden text-sm bg-white/70">
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#64748b] text-xs">Student</span>
                  <span className="font-semibold text-[#0f172a]">{student.name}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#64748b] text-xs">Class</span>
                  <span className="font-medium text-[#0f172a]">{student.className}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#64748b] text-xs">Collection Month</span>
                  <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded-md border border-white">{selectedMonth}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between items-center">
                  <span className="text-[#64748b] text-xs">Payment Method</span>
                  <span className="inline-flex items-center gap-1.5 font-bold text-slate-800 bg-white border border-white px-2 py-0.5 rounded-lg shadow-xs">
                    {selectedMode.replace('_', ' ')}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between">
                  <span className="text-[#64748b] text-xs">Date</span>
                  <span className="font-medium text-[#0f172a]">{new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                {note.trim() && (
                  <div className="px-4 py-2.5 flex justify-between">
                    <span className="text-[#64748b] text-xs">Note / Ref</span>
                    <span className="font-mono text-xs text-slate-800">{note}</span>
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
                className="min-h-[46px] px-5 py-2.5 rounded-xl bg-[#334155] hover:bg-slate-700 active:bg-slate-800 active:scale-95 text-white text-sm font-semibold flex items-center gap-2 shadow-md transition-all"
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
