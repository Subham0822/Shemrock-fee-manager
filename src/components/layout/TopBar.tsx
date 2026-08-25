import React from 'react';
import { RouteState } from '../../types';
import { useFeeData } from '../../context/FeeDataContext';
import { School, ArrowLeft, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

interface TopBarProps {
  route: RouteState;
  onNavigate: (route: RouteState) => void;
  onOpenAddStudent?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ route, onNavigate }) => {
  const { settings, classes, getOverallStats, activeMonth, monthsList, setActiveMonth } = useFeeData();
  const stats = getOverallStats();

  const currentClass = route.classId ? classes.find((c) => c.id === route.classId) : null;

  const currentMonthIdx = monthsList.indexOf(activeMonth);
  const handlePrevMonth = () => {
    if (currentMonthIdx > 0) {
      setActiveMonth(monthsList[currentMonthIdx - 1]);
    }
  };
  const handleNextMonth = () => {
    if (currentMonthIdx < monthsList.length - 1) {
      setActiveMonth(monthsList[currentMonthIdx + 1]);
    }
  };

  // Derive title based on route
  let title = settings.schoolName;
  let subtitle = 'School Fee Register';
  let showBack = false;
  let backTarget: RouteState = { tab: 'dashboard' };

  if (route.tab === 'dashboard') {
    title = settings.schoolName;
    subtitle = `Academic Year ${settings.academicYear} • ${activeMonth} Collection`;
  } else if (route.tab === 'classes') {
    if (currentClass) {
      title = `${currentClass.name}`;
      subtitle = `${activeMonth} Fee Status`;
      showBack = true;
      backTarget = { tab: 'classes' };
    } else {
      title = 'Classes';
      subtitle = `${activeMonth} All Classes`;
    }
  } else if (route.tab === 'students') {
    title = 'Student Register';
    subtitle = `All Students • ${activeMonth} Status`;
  } else if (route.tab === 'settings') {
    title = 'School Settings';
    subtitle = 'Configuration & database status';
  }

  return (
    <header className="sticky top-0 z-30 bg-white/40 backdrop-blur-xl border-b border-white/50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {showBack && (
            <button
              id="topbar-back-btn"
              onClick={() => onNavigate(backTarget)}
              className="w-10 h-10 -ml-1.5 rounded-xl border border-white/60 bg-white/50 backdrop-blur-md flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-white/80 transition-colors shadow-xs"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {!showBack && (
                <div className="w-8 h-8 rounded-xl bg-[#334155] flex items-center justify-center text-white shadow-md flex-shrink-0 md:hidden">
                  <School className="w-4 h-4" />
                </div>
              )}
              <h1 className="text-base sm:text-lg font-bold text-[#0f172a] truncate leading-tight">
                {title}
              </h1>
            </div>
            <p className="text-xs text-[#64748b] truncate font-medium">{subtitle}</p>
          </div>
        </div>

        {/* Global Month Switcher & summary pill */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Quick Month Switcher Widget */}
          <div className="flex items-center bg-white/60 backdrop-blur-md border border-white/70 rounded-full px-1.5 py-1 shadow-xs">
            <button
              id="topbar-prev-month"
              onClick={handlePrevMonth}
              disabled={currentMonthIdx <= 0}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white/80 disabled:opacity-30 disabled:pointer-events-none transition-all"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex items-center px-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500 mr-1.5 hidden sm:inline" />
              <select
                id="topbar-month-select"
                value={activeMonth}
                onChange={(e) => setActiveMonth(e.target.value)}
                className="bg-transparent font-bold text-xs text-[#0f172a] focus:outline-none cursor-pointer pr-1 appearance-none hover:text-indigo-600 transition-colors"
                aria-label="Select active month"
              >
                {monthsList.map((m) => (
                  <option key={m} value={m} className="bg-white text-slate-900">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <button
              id="topbar-next-month"
              onClick={handleNextMonth}
              disabled={currentMonthIdx >= monthsList.length - 1}
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-white/80 disabled:opacity-30 disabled:pointer-events-none transition-all"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Collection Stat Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white/70 shadow-xs text-xs font-semibold text-[#1e293b]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>
              {stats.paid}/{stats.total} Paid ({stats.percentage}%)
            </span>
          </div>

          <div className="sm:hidden px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-800 text-xs font-bold border border-emerald-500/30 backdrop-blur-xs">
            {stats.percentage}%
          </div>
        </div>
      </div>
    </header>
  );
};
