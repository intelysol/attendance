import React from 'react';
import { Smartphone, Monitor, Wifi, Battery, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TopHeader } from './TopHeader';
import { BottomNavBar } from './BottomNavBar';
import { useAuth } from '../../context/AuthContext';

export const MobileShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    isPhoneFrame,
    togglePhoneFrame,
    toast,
    clearToast,
    apiConfig,
    openModal,
    gpsScenario,
    setGpsScenario,
  } = useApp();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Top Engineering & Environment Toolbar */}
      <div className="bg-slate-950 border-b border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold tracking-tight text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Intelysol HCM Mobile</span>
          </div>

          <span className="text-slate-600">|</span>

          {/* Backend Status indicator */}
          <button
            onClick={() => openModal('api-config')}
            className={`px-2 py-0.5 rounded text-[11px] font-medium flex items-center gap-1.5 transition-colors ${
              apiConfig.useMockAdapter
                ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60 hover:bg-amber-900/60'
                : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900/60'
            }`}
          >
            <span>{apiConfig.useMockAdapter ? 'Mock Adapter (Dev)' : 'Laravel API v1'}</span>
          </button>

          {/* GPS Simulation Presets Selector */}
          <div className="hidden sm:flex items-center gap-1.5 text-slate-400">
            <span className="text-[11px]">GPS:</span>
            <select
              value={gpsScenario}
              onChange={(e) => setGpsScenario(e.target.value as any)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-[11px] rounded px-2 py-0.5 focus:outline-none focus:border-amber-500"
            >
              <option value="at_desk">At Desk (22m - Within Geofence)</option>
              <option value="cafeteria">Cafeteria (72m - Within Geofence)</option>
              <option value="outside_geofence">Outside Branch (480m - Rejected)</option>
              <option value="poor_accuracy">Poor GPS Signal (&gt;140m - Rejected)</option>
              <option value="permission_denied">Permission Denied (Handled)</option>
              <option value="device">Real Device Browser GPS</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Automated Tests trigger */}
          <button
            onClick={() => openModal('test-runner')}
            className="px-2.5 py-1 bg-emerald-900/40 text-emerald-300 hover:bg-emerald-900/70 border border-emerald-700/50 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>16 Tests Passing</span>
          </button>

          {/* Flutter Export & Architecture */}
          <button
            onClick={() => openModal('flutter-export')}
            className="px-2.5 py-1 bg-amber-900/40 text-amber-300 hover:bg-amber-900/70 border border-amber-700/50 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <span>Flutter Codebase</span>
          </button>

          {/* Viewport Frame Toggle */}
          <button
            onClick={togglePhoneFrame}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition-colors"
            title={isPhoneFrame ? 'Switch to Full-Screen View' : 'Switch to Phone Frame Mode'}
            aria-label="Toggle phone frame"
          >
            {isPhoneFrame ? <Monitor size={16} /> : <Smartphone size={16} />}
          </button>
        </div>
      </div>

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex items-center justify-center p-0 md:p-6 bg-slate-900/90 overflow-y-auto">
        <div
          className={`w-full transition-all duration-300 relative flex flex-col ${
            isPhoneFrame
              ? 'max-w-[420px] h-[870px] max-h-[96vh] rounded-[48px] border-[8px] border-slate-800 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden bg-slate-50 text-slate-900'
              : 'max-w-4xl min-h-[85vh] rounded-2xl border border-slate-800 shadow-2xl overflow-hidden bg-slate-50 text-slate-900'
          }`}
        >
          {/* Native Phone Status Bar (Rendered when phone frame active) */}
          {isPhoneFrame && (
            <div className="bg-white px-7 pt-3 pb-1 flex items-center justify-between text-xs font-semibold text-slate-900 select-none z-30 shrink-0">
              <span>9:41</span>
              {/* Dynamic Island / Camera pill */}
              <div className="w-24 h-4.5 bg-slate-950 rounded-full flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-800" />
                <span className="w-1.5 h-1.5 rounded-full bg-blue-900/80" />
              </div>
              <div className="flex items-center gap-1.5 text-slate-700">
                <Wifi size={13} />
                <span className="text-[10px] font-bold">5G</span>
                <Battery size={15} />
              </div>
            </div>
          )}

          {/* Top Header when authenticated */}
          {isAuthenticated && <TopHeader />}

          {/* Scrollable Screen Content */}
          <main className="flex-1 overflow-y-auto relative flex flex-col bg-slate-50">
            {children}
          </main>

          {/* Bottom Navigation Bar when authenticated */}
          {isAuthenticated && <BottomNavBar />}

          {/* Phone Bottom Home Indicator */}
          {isPhoneFrame && (
            <div className="bg-white py-1.5 flex justify-center z-30 shrink-0">
              <div className="w-32 h-1 bg-slate-300 rounded-full" />
            </div>
          )}

          {/* Floating Toast Notification */}
          {toast && (
            <div className="absolute top-16 left-4 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-200">
              <div
                className={`p-3.5 rounded-2xl shadow-xl border flex items-start gap-3 backdrop-blur-md ${
                  toast.type === 'success'
                    ? 'bg-emerald-950/90 text-emerald-100 border-emerald-700/80'
                    : toast.type === 'error'
                    ? 'bg-red-950/90 text-red-100 border-red-700/80'
                    : 'bg-slate-900/90 text-slate-100 border-slate-700'
                }`}
              >
                {toast.type === 'success' ? (
                  <CheckCircle size={20} className="text-emerald-400 shrink-0 mt-0.5" />
                ) : toast.type === 'error' ? (
                  <AlertCircle size={20} className="text-red-400 shrink-0 mt-0.5" />
                ) : (
                  <Info size={20} className="text-amber-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold">{toast.title}</p>
                  {toast.description && (
                    <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">
                      {toast.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={clearToast}
                  className="text-white/70 hover:text-white p-1 rounded-lg"
                  aria-label="Dismiss message"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
