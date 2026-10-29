import React, { useEffect, useState } from 'react';
import {
  Clock,
  MapPin,
  Calendar,
  Receipt,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../services/apiClient';
import { TodayAttendance, MonthlyAttendanceSummary } from '../../types/attendance';
import { LeaveBalance } from '../../types/leave';
import { PayslipSummary } from '../../types/payslip';
import { Announcement, Holiday } from '../../types/announcement';

export const HomeScreen: React.FC = () => {
  const { employee } = useAuth();
  const { setActiveTab, openModal, showToast } = useApp();

  const [attendance, setAttendance] = useState<TodayAttendance | null>(null);
  const [summary, setSummary] = useState<MonthlyAttendanceSummary | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [latestPayslip, setLatestPayslip] = useState<PayslipSummary | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveDuration, setLiveDuration] = useState<string>('00:00:00');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [att, histRes, lvBal, pays, ancs, hols] = await Promise.all([
          apiClient.getTodayAttendance(),
          apiClient.getAttendanceHistory('2026-10'),
          apiClient.getLeaveBalances(),
          apiClient.getPayslips(),
          apiClient.getAnnouncements(),
          apiClient.getHolidays(),
        ]);
        setAttendance(att);
        setSummary(histRes.summary);
        setBalances(lvBal);
        if (pays.length > 0) setLatestPayslip(pays[0]);
        setAnnouncements(ancs);
        setUpcomingHolidays(hols);
      } catch (err: unknown) {
        showToast('error', 'Dashboard Sync Failed', err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Live timer for currently active shift
  useEffect(() => {
    if (!attendance?.firstIn) {
      setLiveDuration('00:00:00');
      return;
    }

    const interval = setInterval(() => {
      const startMs = new Date(attendance.firstIn!).getTime();
      const endMs = attendance.lastOut ? new Date(attendance.lastOut).getTime() : Date.now();
      const diffSecs = Math.max(0, Math.floor((endMs - startMs) / 1000));
      const hours = Math.floor(diffSecs / 3600);
      const mins = Math.floor((diffSecs % 3600) / 60);
      const secs = diffSecs % 60;
      setLiveDuration(
        `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [attendance]);

  const totalLeaveRemaining = balances.reduce((sum, b) => sum + b.remaining, 0);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Present':
        return { text: 'Present', bg: 'bg-emerald-50', border: 'border-emerald-200', color: 'text-emerald-700' };
      case 'Late':
        return { text: 'Late Arrival', bg: 'bg-amber-50', border: 'border-amber-200', color: 'text-amber-700' };
      case 'Incomplete Punch':
        return { text: 'Incomplete Punch', bg: 'bg-amber-50', border: 'border-amber-200', color: 'text-amber-800' };
      case 'On Leave':
        return { text: 'On Leave', bg: 'bg-blue-50', border: 'border-blue-200', color: 'text-blue-700' };
      case 'Absent':
        return { text: 'Absent', bg: 'bg-red-50', border: 'border-red-200', color: 'text-red-700' };
      default:
        return { text: 'Not Checked In', bg: 'bg-slate-100', border: 'border-slate-200', color: 'text-slate-600' };
    }
  };

  const statusBadge = getStatusBadge(attendance?.status);

  return (
    <div className="flex-1 p-4 space-y-4 pb-8">
      {/* Personalized Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl p-4 shadow-sm relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-xs font-medium">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
              <h2 className="text-lg font-bold tracking-tight text-white mt-0.5">
                Good morning, {employee?.name.split(' ')[0]}
              </h2>
            </div>
            <span className="text-[11px] font-semibold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
              {employee?.shift.name.split(' ')[0] || 'Day Shift'}
            </span>
          </div>

          <div className="flex items-center gap-2 mt-2 text-xs text-amber-100">
            <Building size={13} className="text-amber-200" />
            <span className="truncate">{employee?.branch.name}</span>
          </div>
        </div>
      </div>

      {/* Primary Mobile Attendance Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={16} className="text-amber-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Today's Attendance
            </h3>
          </div>
          <span
            className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${statusBadge.bg} ${statusBadge.border} ${statusBadge.color}`}
          >
            {statusBadge.text}
          </span>
        </div>

        {/* Punch Timer & In/Out Details */}
        <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50/80 rounded-xl p-2.5 border border-slate-100">
          <div className="text-center">
            <p className="text-[11px] text-slate-500 font-medium">First IN</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 tabular-nums">
              {attendance?.firstIn
                ? new Date(attendance.firstIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </p>
          </div>

          <div className="text-center border-x border-slate-200">
            <p className="text-[11px] text-slate-500 font-medium">Last OUT</p>
            <p className="text-xs font-bold text-slate-900 mt-0.5 tabular-nums">
              {attendance?.lastOut
                ? new Date(attendance.lastOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '—'}
            </p>
          </div>

          <div className="text-center">
            <p className="text-[11px] text-slate-500 font-medium">Duration</p>
            <p className="text-xs font-bold text-amber-700 mt-0.5 tabular-nums">
              {liveDuration}
            </p>
          </div>
        </div>

        {/* Incomplete Punch / Late Warning */}
        {attendance?.isIncomplete && (
          <div className="p-2.5 bg-amber-50 border border-amber-200/70 rounded-xl flex items-start gap-2 text-xs text-amber-900">
            <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-tight">
              Active shift punch in recorded. Complete your shift by recording Check-Out before leaving campus.
            </p>
          </div>
        )}

        {/* Primary Attendance Action Button */}
        <button
          onClick={() => setActiveTab('attendance')}
          className="w-full min-h-[46px] bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
        >
          <MapPin size={15} className="text-amber-400" />
          <span>{attendance?.firstIn && !attendance?.lastOut ? 'Punch Out / View Geofence' : 'Mark Attendance (GPS)'}</span>
          <ChevronRight size={14} className="text-slate-400 ml-auto" />
        </button>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 px-1">
          Quick Actions
        </h4>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('attendance')}
            className="bg-white p-3 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition-all text-left flex flex-col justify-between h-20 shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <MapPin size={17} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800">GPS Punch</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className="bg-white p-3 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition-all text-left flex flex-col justify-between h-20 shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Clock size={17} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800">History</span>
          </button>

          <button
            onClick={() => openModal('apply-leave')}
            className="bg-white p-3 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition-all text-left flex flex-col justify-between h-20 shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar size={17} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800">Apply Leave</span>
          </button>

          <button
            onClick={() => setActiveTab('leave')}
            className="bg-white p-3 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition-all text-left flex flex-col justify-between h-20 shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <FileText size={17} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800">Leave Quota</span>
          </button>

          <button
            onClick={() => setActiveTab('payslips')}
            className="bg-white p-3 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition-all text-left flex flex-col justify-between h-20 shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Receipt size={17} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800">Payslips</span>
          </button>

          <button
            onClick={() => openModal('notifications')}
            className="bg-white p-3 rounded-2xl border border-slate-200/80 hover:border-amber-300 transition-all text-left flex flex-col justify-between h-20 shadow-xs"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Sparkles size={17} />
            </div>
            <span className="text-[11px] font-semibold text-slate-800">Holidays</span>
          </button>
        </div>
      </div>

      {/* Monthly Summary Statistics Strip */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            October 2026 Summary
          </h4>
          <button
            onClick={() => setActiveTab('history')}
            className="text-[11px] text-amber-700 font-semibold hover:underline flex items-center gap-0.5"
          >
            View Calendar
            <ChevronRight size={12} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Present vs Late Days */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Present Days</span>
              <TrendingUp size={14} className="text-emerald-600" />
            </div>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {summary ? summary.presentDays : '—'}
              <span className="text-xs text-slate-500 font-normal ml-1">/ 22 days</span>
            </p>
            <p className="text-[11px] text-amber-700 font-medium mt-1">
              {summary?.lateDays || 0} late punch arrivals
            </p>
          </div>

          {/* Leave Balance Available */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
              <span>Leave Available</span>
              <Calendar size={14} className="text-blue-600" />
            </div>
            <p className="text-xl font-bold text-slate-900 tabular-nums">
              {totalLeaveRemaining}
              <span className="text-xs text-slate-500 font-normal ml-1">days total</span>
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              12 Annual · 10 Sick
            </p>
          </div>
        </div>
      </div>

      {/* Latest Published Payslip Card */}
      {latestPayslip && (
        <div
          onClick={() => setActiveTab('payslips')}
          className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between cursor-pointer hover:border-amber-400 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <Receipt size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Latest Payslip: {latestPayslip.payrollPeriod}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Net Pay: <span className="font-semibold text-emerald-700 tabular-nums">${latestPayslip.netSalary.toLocaleString()}</span> (Published)
              </p>
            </div>
          </div>
          <ArrowUpRight size={16} className="text-slate-400" />
        </div>
      )}

      {/* Company Announcements Card */}
      {announcements.length > 0 && (
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900">
              Company Announcement
            </span>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              {announcements[0].priority}
            </span>
          </div>
          <h5 className="text-xs font-semibold text-slate-800">
            {announcements[0].title}
          </h5>
          <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
            {announcements[0].content}
          </p>
        </div>
      )}
    </div>
  );
};
