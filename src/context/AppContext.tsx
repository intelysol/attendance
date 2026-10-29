import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiConfig } from '../types/api';
import { apiClient } from '../services/apiClient';

export type NavTab =
  | 'home'
  | 'attendance'
  | 'leave'
  | 'payslips'
  | 'profile'
  | 'history';

export type ModalType =
  | 'notifications'
  | 'api-config'
  | 'test-runner'
  | 'flutter-export'
  | 'apply-leave'
  | 'leave-detail'
  | 'payslip-detail'
  | 'change-password'
  | null;

export type GpsScenario =
  | 'device'
  | 'at_desk'
  | 'cafeteria'
  | 'outside_geofence'
  | 'poor_accuracy'
  | 'permission_denied';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface AppContextType {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  activeModal: ModalType;
  openModal: (modal: ModalType) => void;
  closeModal: () => void;
  selectedPayslipId: string | null;
  setSelectedPayslipId: (id: string | null) => void;
  selectedLeaveId: string | null;
  setSelectedLeaveId: (id: string | null) => void;
  apiConfig: ApiConfig;
  updateApiConfig: (updates: Partial<ApiConfig>) => void;
  isPhoneFrame: boolean;
  togglePhoneFrame: () => void;
  gpsScenario: GpsScenario;
  setGpsScenario: (scenario: GpsScenario) => void;
  unreadCount: number;
  decrementUnreadCount: () => void;
  clearUnreadCount: () => void;
  toast: ToastMessage | null;
  showToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
  clearToast: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [selectedPayslipId, setSelectedPayslipId] = useState<string | null>(null);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [apiConfig, setApiConfigState] = useState<ApiConfig>(apiClient.getConfig());
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);
  const [gpsScenario, setGpsScenario] = useState<GpsScenario>('at_desk');
  const [unreadCount, setUnreadCount] = useState<number>(2);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  useEffect(() => {
    // Check initial notifications
    apiClient.getNotifications().then((list) => {
      setUnreadCount(list.filter((n) => !n.isRead).length);
    }).catch(() => {});
  }, []);

  const openModal = (modal: ModalType) => {
    setActiveModal(modal);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  const updateApiConfig = (updates: Partial<ApiConfig>) => {
    apiClient.updateConfig(updates);
    setApiConfigState(apiClient.getConfig());
  };

  const togglePhoneFrame = () => {
    setIsPhoneFrame((prev) => !prev);
  };

  const showToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = Date.now().toString();
    setToast({ id, type, title, description });
    setTimeout(() => {
      setToast((current) => (current?.id === id ? null : current));
    }, 4500);
  };

  const clearToast = () => {
    setToast(null);
  };

  const decrementUnreadCount = () => {
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const clearUnreadCount = () => {
    setUnreadCount(0);
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        activeModal,
        openModal,
        closeModal,
        selectedPayslipId,
        setSelectedPayslipId,
        selectedLeaveId,
        setSelectedLeaveId,
        apiConfig,
        updateApiConfig,
        isPhoneFrame,
        togglePhoneFrame,
        gpsScenario,
        setGpsScenario,
        unreadCount,
        decrementUnreadCount,
        clearUnreadCount,
        toast,
        showToast,
        clearToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
