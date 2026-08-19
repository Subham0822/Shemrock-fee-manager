import React from 'react';
import { LayoutDashboard, BookOpen, Users, Settings } from 'lucide-react';
import { ActiveTab, RouteState } from '../../types';

interface BottomNavProps {
  currentTab: ActiveTab;
  onNavigate: (route: RouteState) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onNavigate }) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'classes', label: 'Classes', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'students', label: 'Students', icon: <Users className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-2xl border-t border-white/70 px-3 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-2xl transition-all"
    >
      <div className="grid grid-cols-4 items-center max-w-md mx-auto gap-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onNavigate({ tab: item.id })}
              className={`min-h-[50px] py-1.5 px-1 flex flex-col items-center justify-center gap-1 rounded-2xl transition-all active:scale-95 ${
                isActive
                  ? 'text-[#0f172a] font-bold bg-white/95 border border-white shadow-xs'
                  : 'text-[#64748b] font-medium hover:bg-white/40 active:bg-white/60 hover:text-[#1e293b]'
              }`}
            >
              <div className={`transition-transform duration-150 ${isActive ? 'scale-110 text-[#334155]' : ''}`}>
                {item.icon}
              </div>
              <span className="text-[11px] font-semibold leading-none tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
