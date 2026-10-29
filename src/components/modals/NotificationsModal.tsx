import React, { useState, useEffect } from 'react';
import { X, Bell, Calendar, Megaphone, Check, CheckCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../services/apiClient';
import { Announcement, Holiday, HRNotification } from '../../types/announcement';

export const NotificationsModal: React.FC = () => {
  const { closeModal, clearUnreadCount } = useApp();

  const [activeTab, setActiveTab] = useState<'NOTIFS' | 'ANNOUNCEMENTS' | 'HOLIDAYS'>('NOTIFS');
  const [notifications, setNotifications] = useState<HRNotification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    async function loadData() {
      const [n, a, h] = await Promise.all([
        apiClient.getNotifications(),
        apiClient.getAnnouncements(),
        apiClient.getHolidays(),
      ]);
      setNotifications(n);
      setAnnouncements(a);
      setHolidays(h);
    }
    loadData();
  }, []);

  const handleMarkAllRead = async () => {
    await apiClient.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    clearUnreadCount();
  };

  const handleMarkOne = async (id: string) => {
    await apiClient.markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-amber-600" />
            <h3 className="text-sm font-bold text-slate-900">Company Bulletin</h3>
          </div>
          <button
            onClick={closeModal}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('NOTIFS')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'NOTIFS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('ANNOUNCEMENTS')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'ANNOUNCEMENTS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Announcements
          </button>
          <button
            onClick={() => setActiveTab('HOLIDAYS')}
            className={`flex-1 py-1.5 rounded-lg transition-all ${
              activeTab === 'HOLIDAYS' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Holidays
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-2">
          {activeTab === 'NOTIFS' && (
            <>
              <div className="flex justify-between items-center text-xs pb-1">
                <span className="text-slate-500 font-medium">Recent Activity</span>
                <button
                  onClick={handleMarkAllRead}
                  className="text-amber-700 font-semibold hover:underline flex items-center gap-1 text-[11px]"
                >
                  <CheckCheck size={13} />
                  Mark all as read
                </button>
              </div>

              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkOne(n.id)}
                  className={`p-3 rounded-2xl border text-xs space-y-1 transition-all cursor-pointer ${
                    n.isRead
                      ? 'bg-white border-slate-200/80'
                      : 'bg-amber-50/50 border-amber-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{n.title}</span>
                    <span className="text-[10px] text-slate-400">{n.timestamp}</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{n.message}</p>
                </div>
              ))}
            </>
          )}

          {activeTab === 'ANNOUNCEMENTS' && (
            <div className="space-y-2.5">
              {announcements.map((a) => (
                <div
                  key={a.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      {a.priority} Priority
                    </span>
                    <span className="text-[10px] text-slate-400">{a.date}</span>
                  </div>
                  <h4 className="font-bold text-slate-900">{a.title}</h4>
                  <p className="text-slate-600 text-[11px] leading-relaxed">{a.content}</p>
                  <div className="pt-1.5 border-t border-slate-100 text-[10px] text-slate-400">
                    Posted by: <strong className="text-slate-700">{a.author}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'HOLIDAYS' && (
            <div className="space-y-2">
              {holidays.map((h) => (
                <div
                  key={h.id}
                  className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 font-bold flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] uppercase">{h.dayOfWeek.substring(0, 3)}</span>
                      <span className="text-xs">{h.date.split('-')[2]}</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{h.name}</h4>
                      <p className="text-[10px] text-slate-400">{h.date}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-purple-800 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                    Official Holiday
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
