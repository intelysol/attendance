import React from 'react';
import { Home, Fingerprint, CalendarDays, ReceiptText, User } from 'lucide-react';
import { NavTab, useApp } from '../../context/AppContext';

export const BottomNavBar: React.FC = () => {
  const { activeTab, setActiveTab } = useApp();

  const tabs: { id: NavTab; label: string; icon: React.FC<{ className?: string; size?: number }> }[] = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'attendance', label: 'Attendance', icon: Fingerprint },
    { id: 'leave', label: 'Leave', icon: CalendarDays },
    { id: 'payslips', label: 'Payslips', icon: ReceiptText },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      aria-label="Bottom Navigation"
      className="bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-1.5 flex items-center justify-around z-30 shrink-0 select-none shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const IconComponent = tab.icon;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-[48px] min-w-[56px] flex flex-col items-center justify-center px-2 py-1 transition-all rounded-xl ${
              isActive
                ? 'text-amber-700 font-semibold'
                : 'text-slate-500 hover:text-slate-900 active:scale-95'
            }`}
          >
            <div
              className={`relative p-1 rounded-xl transition-colors ${
                isActive ? 'bg-amber-50 text-amber-600' : 'text-slate-500'
              }`}
            >
              <IconComponent size={21} />
              {tab.id === 'attendance' && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </div>
            <span
              className={`text-[11px] tracking-tight mt-0.5 whitespace-nowrap ${
                isActive ? 'font-semibold text-amber-700' : 'font-medium text-slate-500'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
