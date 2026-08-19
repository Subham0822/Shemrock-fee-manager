import React from 'react';
import { useFeeData } from '../../context/FeeDataContext';
import { RouteState } from '../../types';
import { ChevronRight, Users, CheckCircle2, Clock } from 'lucide-react';

interface ClassesViewProps {
  onNavigate: (route: RouteState) => void;
}

export const ClassesView: React.FC<ClassesViewProps> = ({ onNavigate }) => {
  const { classes, getClassStats } = useFeeData();

  return (
    <div className="space-y-5 pb-12 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0f172a]">Classes Register</h2>
          <p className="text-xs sm:text-sm text-[#64748b]">
            Select a class to manage section registers and student payments
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {classes.map((cls) => {
          const stats = getClassStats(cls.id);
          return (
            <div
              key={cls.id}
              id={`class-list-item-${cls.id}`}
              onClick={() => onNavigate({ tab: 'classes', classId: cls.id })}
              className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 p-5 shadow-xl hover:bg-white/60 hover:border-white/90 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-[#0f172a]">
                      {cls.name}
                    </h3>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-white/60 border border-white/70 flex items-center justify-center text-slate-600 shadow-xs">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/50 text-center">
                  <div className="p-2.5 rounded-xl bg-white/50 border border-white/60">
                    <div className="text-[11px] text-[#64748b] font-medium">Students</div>
                    <div className="text-sm font-bold text-[#0f172a]">{stats.total}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                    <div className="text-[11px] text-emerald-800 font-medium">Paid</div>
                    <div className="text-sm font-bold text-emerald-700">{stats.paid}</div>
                  </div>
                  <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                    <div className="text-[11px] text-rose-800 font-medium">Unpaid</div>
                    <div className="text-sm font-bold text-rose-700">{stats.unpaid}</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/50">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="text-[#64748b]">Collection</span>
                  <span className="font-bold text-[#0f172a]">{stats.percentage}%</span>
                </div>
                <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden border border-white/40">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
