import React from 'react';
import { LayoutDashboard, BookOpen, Users, Settings, School, Plus, CheckCircle2, Clock } from 'lucide-react';
import { ActiveTab, RouteState } from '../../types';
import { useFeeData } from '../../context/FeeDataContext';

interface SidebarProps {
  currentTab: ActiveTab;
  onNavigate: (route: RouteState) => void;
  onOpenAddStudent: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onNavigate, onOpenAddStudent }) => {
  const { settings, getOverallStats, activeMonth } = useFeeData();
  const stats = getOverallStats(activeMonth);

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'classes', label: 'Classes', icon: <BookOpen className="w-5 h-5" />, badge: '9' },
    { id: 'students', label: 'Students', icon: <Users className="w-5 h-5" />, badge: `${stats.total}` },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white/30 backdrop-blur-xl border-r border-white/40 min-h-screen sticky top-0 h-screen overflow-y-auto">
      {/* Brand Header */}
      <div className="p-6 border-b border-white/40 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#334155] flex items-center justify-center text-white shadow-lg flex-shrink-0">
          <School className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#0f172a] truncate tracking-tight leading-tight">
            Fee Manager
          </h2>
          <p className="text-xs text-[#64748b] truncate font-medium">{settings.schoolName}</p>
        </div>
      </div>

      {/* Quick Add Student Action */}
      <div className="p-4">
        <button
          id="sidebar-add-student-btn"
          onClick={onOpenAddStudent}
          className="w-full min-h-[44px] py-2.5 px-3 rounded-xl bg-[#334155] hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-slate-300/40 transition-all active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" /> Add New Student
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => onNavigate({ tab: item.id })}
              className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl flex items-center justify-between text-sm transition-all ${
                isActive
                  ? 'bg-white/60 text-[#0f172a] font-bold shadow-xs border border-white/70 backdrop-blur-sm'
                  : 'text-[#64748b] font-medium hover:bg-white/25 hover:text-[#1e293b]'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={isActive ? 'text-[#334155]' : 'text-slate-500'}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-mono font-semibold ${
                    isActive ? 'bg-slate-200/80 text-slate-800' : 'bg-white/40 text-slate-600'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Live Collection Summary Widget in Sidebar */}
      <div className="p-4 bg-[#334155]/5 backdrop-blur-md m-4 rounded-2xl border border-white/40">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
          <span>{activeMonth} Collection</span>
          <span className="text-[#334155]">{stats.percentage}%</span>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full h-2 bg-white/50 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${stats.percentage}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1 text-emerald-800 bg-white/60 p-1.5 rounded-lg border border-white/50">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-bold">{stats.paid}</span> Paid
          </div>
          <div className="flex items-center gap-1 text-rose-800 bg-white/60 p-1.5 rounded-lg border border-white/50">
            <Clock className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="font-bold">{stats.unpaid}</span> Due
          </div>
        </div>
      </div>
    </aside>
  );
};
