import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import { MobileShell } from './components/layout/MobileShell';
import { LoginScreen } from './components/screens/LoginScreen';
import { HomeScreen } from './components/screens/HomeScreen';
import { AttendanceScreen } from './components/screens/AttendanceScreen';
import { AttendanceHistoryScreen } from './components/screens/AttendanceHistoryScreen';
import { LeaveScreen } from './components/screens/LeaveScreen';
import { PayslipScreen } from './components/screens/PayslipScreen';
import { ProfileScreen } from './components/screens/ProfileScreen';
import { NotificationsModal } from './components/modals/NotificationsModal';
import { ApiConfigModal } from './components/modals/ApiConfigModal';
import { TestRunnerModal } from './components/modals/TestRunnerModal';
import { FlutterExportModal } from './components/modals/FlutterExportModal';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { activeTab, activeModal } = useApp();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-50 text-center">
        <div className="w-12 h-12 border-3 border-amber-600/30 border-t-amber-600 rounded-full animate-spin mb-3" />
        <p className="text-xs font-bold text-slate-800">Intelysol HCM Mobile</p>
        <p className="text-[11px] text-slate-400 mt-0.5">Restoring secure session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return (
    <>
      {activeTab === 'home' && <HomeScreen />}
      {activeTab === 'attendance' && <AttendanceScreen />}
      {activeTab === 'history' && <AttendanceHistoryScreen />}
      {activeTab === 'leave' && <LeaveScreen />}
      {activeTab === 'payslips' && <PayslipScreen />}
      {activeTab === 'profile' && <ProfileScreen />}

      {/* Global Modals */}
      {activeModal === 'notifications' && <NotificationsModal />}
      {activeModal === 'api-config' && <ApiConfigModal />}
      {activeModal === 'test-runner' && <TestRunnerModal />}
      {activeModal === 'flutter-export' && <FlutterExportModal />}
    </>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <MobileShell>
          <AppContent />
        </MobileShell>
      </AppProvider>
    </AuthProvider>
  );
}
