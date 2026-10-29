import React from 'react';
import { Bell, Settings2, ShieldCheck, Code2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const TopHeader: React.FC = () => {
  const { employee } = useAuth();
  const { openModal, unreadCount, apiConfig } = useApp();

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          {employee?.avatarUrl ? (
            <img
              src={employee.avatarUrl}
              alt={employee.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover border border-amber-200 shadow-sm"
              onError={(e) => {
                // styled fallback container
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-sm border border-amber-200">
              {employee?.name ? employee.name.charAt(0) : 'E'}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-sm font-bold text-slate-900 truncate tracking-tight">
              {employee?.name || 'Intelysol Employee'}
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/60 shrink-0">
              {employee?.branch.code || 'HQ'}
            </span>
          </div>
          <p className="text-xs text-slate-500 truncate">
            {employee?.designation || 'Enterprise Team'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* API / Environment status indicator button */}
        <button
          onClick={() => openModal('api-config')}
          title="API Configuration & Environment"
          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="API Settings"
        >
          <Settings2 size={18} />
        </button>

        {/* Flutter code export & architecture view */}
        <button
          onClick={() => openModal('flutter-export')}
          title="Flutter Native Code & Architecture"
          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 hover:text-amber-700 rounded-lg hover:bg-amber-50 transition-colors"
          aria-label="Flutter Architecture"
        >
          <Code2 size={18} />
        </button>

        {/* Automated test suite runner shortcut */}
        <button
          onClick={() => openModal('test-runner')}
          title="Run 16 Production Test Suites"
          className="min-h-[40px] min-w-[40px] flex items-center justify-center text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          aria-label="Test Suite"
        >
          <ShieldCheck size={18} />
        </button>

        {/* Notifications Bell */}
        <button
          onClick={() => openModal('notifications')}
          className="relative min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
