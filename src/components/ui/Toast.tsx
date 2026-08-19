import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useFeeData } from '../../context/FeeDataContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useFeeData();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />;
        let borderClass = 'border-emerald-200/80 bg-white/80 backdrop-blur-xl text-emerald-950';

        if (toast.type === 'error') {
          icon = <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />;
          borderClass = 'border-rose-200/80 bg-white/80 backdrop-blur-xl text-rose-950';
        } else if (toast.type === 'warning') {
          icon = <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />;
          borderClass = 'border-amber-200/80 bg-white/80 backdrop-blur-xl text-amber-950';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-slate-700 flex-shrink-0" />;
          borderClass = 'border-white/80 bg-white/80 backdrop-blur-xl text-slate-900';
        }

        return (
          <div
            key={toast.id}
            id={`toast-${toast.id}`}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-xl transition-all animate-in fade-in slide-in-from-bottom-3 duration-200 ${borderClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-[#0f172a] leading-tight">{toast.title}</p>
              <p className="text-xs text-[#64748b] mt-0.5 leading-normal">{toast.message}</p>
            </div>
            <button
              id={`close-toast-${toast.id}`}
              onClick={() => removeToast(toast.id)}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-white/60 transition-colors"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
