import React from 'react';
import { useFeeData } from '../../context/FeeDataContext';
import { RouteState } from '../../types';
import { Users, CheckCircle2, AlertCircle, ChevronRight, TrendingUp, Sparkles, BookOpen, Calendar } from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (route: RouteState) => void;
  onOpenAddStudent: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenAddStudent }) => {
  const { classes, getOverallStats, getClassStats, settings, activeMonth, monthsList, setActiveMonth } = useFeeData();
  const overall = getOverallStats();

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#64748b] mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Academic Session {settings.academicYear} • Monthly Register</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a]">{settings.schoolName}</h1>
          <p className="text-[#64748b] text-xs sm:text-sm mt-0.5">
            Fee payment register for <strong className="text-slate-900 font-bold">{activeMonth}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate({ tab: 'settings' })}
            className="bg-white/60 backdrop-blur-md px-4 py-2 rounded-xl border border-white/60 shadow-xs font-medium text-xs sm:text-sm hover:bg-white transition-all text-slate-800"
          >
            School Settings
          </button>
          <button
            onClick={onOpenAddStudent}
            className="bg-[#334155] text-white px-4 py-2 rounded-xl shadow-lg shadow-slate-300/40 font-medium text-xs sm:text-sm hover:bg-slate-700 transition-all flex items-center gap-1.5"
          >
            Add Student
          </button>
        </div>
      </div>

      {/* Month Selection Carousel / Tabs */}
      <div className="bg-white/40 backdrop-blur-md rounded-2xl border border-white/60 p-2.5 shadow-sm">
        <div className="flex items-center justify-between px-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0f172a]">
            <Calendar className="w-4 h-4 text-slate-700" />
            <span>Select Fee Collection Month:</span>
          </div>
          <span className="text-[11px] text-[#64748b]">
            Showing <span className="font-bold text-slate-900">{activeMonth}</span> status
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {monthsList.map((m) => {
            const isCurrent = m === activeMonth;
            return (
              <button
                key={m}
                id={`month-pill-${m}`}
                onClick={() => setActiveMonth(m)}
                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                  isCurrent
                    ? 'bg-[#334155] text-white shadow-md'
                    : 'bg-white/60 text-slate-700 hover:bg-white border border-white/70'
                }`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4 Frosted Glass Stat Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white/40 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/60 shadow-xl flex flex-col justify-between">
          <div>
            <p className="text-xs sm:text-sm text-[#64748b] font-medium">Total Students</p>
            <p className="text-2xl sm:text-3xl font-bold text-[#0f172a] mt-1">{overall.total}</p>
          </div>
          <p className="text-[11px] text-[#64748b] mt-3">Across {classes.length} classes</p>
        </div>

        <div className="bg-white/40 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/60 shadow-xl flex flex-col justify-between">
          <div>
            <p className="text-xs sm:text-sm text-[#64748b] font-medium">{activeMonth} Paid</p>
            <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-1">{overall.paid}</p>
          </div>
          <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md self-start border border-emerald-200/50">
            <CheckCircle2 className="w-3 h-3" /> {overall.percentage}% paid
          </div>
        </div>

        <div className="bg-white/40 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/60 shadow-xl flex flex-col justify-between">
          <div>
            <p className="text-xs sm:text-sm text-[#64748b] font-medium">{activeMonth} Unpaid</p>
            <p className="text-2xl sm:text-3xl font-bold text-rose-600 mt-1">{overall.unpaid}</p>
          </div>
          <p className="text-[11px] text-rose-700 font-medium mt-3">Pending for {activeMonth}</p>
        </div>

        <div className="bg-white/40 backdrop-blur-md p-5 sm:p-6 rounded-3xl border border-white/60 shadow-xl flex flex-col justify-between">
          <div>
            <p className="text-xs sm:text-sm text-[#64748b] font-medium">Collection Rate</p>
            <div className="flex items-end space-x-1.5 mt-1">
              <p className="text-2xl sm:text-3xl font-bold text-[#334155]">{overall.percentage}%</p>
              <p className="text-xs text-[#64748b] mb-1">for {activeMonth}</p>
            </div>
          </div>
          <div className="w-full bg-white/60 h-2 rounded-full mt-3 overflow-hidden border border-white/40">
            <div className="bg-[#334155] h-full rounded-full transition-all duration-500" style={{ width: `${overall.percentage}%` }}></div>
          </div>
        </div>
      </div>

      {/* Class Overview List Section */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl border border-white/60 shadow-xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/50">
          <div>
            <h2 className="font-bold text-lg sm:text-xl text-[#0f172a]">Class Summaries ({activeMonth})</h2>
            <p className="text-xs text-[#64748b]">Select any class to record fee payments for {activeMonth}</p>
          </div>
          <button
            id="view-all-classes-btn"
            onClick={() => onNavigate({ tab: 'classes' })}
            className="text-xs font-bold text-[#334155] hover:text-[#0f172a] bg-white/60 hover:bg-white/90 border border-white/80 px-3 py-1.5 rounded-xl transition-all shadow-xs flex items-center gap-1"
          >
            All Classes <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {classes.map((cls) => {
            const stats = getClassStats(cls.id);
            return (
              <button
                key={cls.id}
                id={`dashboard-class-card-${cls.id}`}
                onClick={() => onNavigate({ tab: 'classes', classId: cls.id })}
                className="w-full text-left p-4 bg-white/50 backdrop-blur-md rounded-2xl border border-white/80 hover:bg-white/80 transition-all cursor-pointer shadow-xs group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 group-hover:text-[#334155] transition-colors">
                        {cls.name}
                      </h3>
                    </div>

                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200/60">
                      {stats.percentage}%
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2.5 mb-2 font-medium">
                    {stats.total} Students • <span className="text-emerald-700 font-bold">{stats.paid} Paid</span> • <span className="text-rose-700 font-bold">{stats.unpaid} Unpaid</span>
                  </p>
                </div>

                <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden mt-1">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-3 border-t border-white/50 flex justify-between items-center text-xs text-[#64748b]">
          <span>{classes.length} Classes • {overall.total} Students</span>
          <button
            onClick={() => onNavigate({ tab: 'students' })}
            className="font-bold text-[#334155] hover:text-[#0f172a] flex items-center gap-1"
          >
            Open Full Student Directory <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
