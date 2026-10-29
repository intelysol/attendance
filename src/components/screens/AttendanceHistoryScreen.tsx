import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Coffee,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../services/apiClient';
import { AttendanceHistoryRecord, AttendanceStatus, MonthlyAttendanceSummary } from '../../types/attendance';

export const AttendanceHistoryScreen: React.FC = () => {
  const { setActiveTab } = useApp();

  const [currentMonth, setCurrentMonth] = useState('2026-10');
  const [history, setHistory] = useState<AttendanceHistoryRecord[]>([]);
  const [summary, setSummary] = useState<MonthlyAttendanceSummary | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'LIST' | 'CALENDAR'>('LIST');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const res = await apiClient.getAttendanceHistory(currentMonth);
        setHistory(res.history);
        setSummary(res.summary);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [currentMonth]);

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'Present':
        return { text: 'Present', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'Late':
        return { text: 'Late', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'On Leave':
        return { text: 'On Leave', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'Absent':
        return { text: 'Absent', bg: 'bg-red-50 text-red-700 border-red-200' };
      case 'Weekly Off':
        return { text: 'Weekly Off', bg: 'bg-slate-100 text-slate-600 border-slate-200' };
      case 'Holiday':
        return { text: 'Holiday', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'Incomplete Punch':
        return { text: 'Incomplete', bg: 'bg-amber-50 text-amber-800 border-amber-200' };
      default:
        return { text: status, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const filteredHistory = history.filter((item) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'PRESENT') return item.status === 'Present' || item.status === 'Late';
    if (selectedFilter === 'LATE') return item.status === 'Late';
    if (selectedFilter === 'LEAVE') return item.status === 'On Leave';
    if (selectedFilter === 'ABSENT') return item.status === 'Absent';
    if (selectedFilter === 'EXCEPTIONS') return item.status === 'Incomplete Punch' || item.status === 'Absent';
    return true;
  });

  return (
    <div className="flex-1 p-4 space-y-4 pb-8">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('home')}
            className="p-1.5 -ml-1.5 text-slate-500 hover:text-slate-900 rounded-lg"
            aria-label="Back to home"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-base font-bold text-slate-900">
            Attendance History
          </h2>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setViewMode('LIST')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'LIST' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            List
          </button>
          <button
            onClick={() => setViewMode('CALENDAR')}
            className={`px-3 py-1 rounded-lg transition-all ${
              viewMode === 'CALENDAR' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
            }`}
          >
            Calendar
          </button>
        </div>
      </div>

      {/* Month Navigation & Summary Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentMonth('2026-09')}
            className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="text-xs font-bold text-slate-900 tracking-tight">
            October 2026
          </span>
          <button
            onClick={() => setCurrentMonth('2026-11')}
            className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            aria-label="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Quick Month Metrics */}
        {summary && (
          <div className="grid grid-cols-4 gap-1.5 pt-1 text-center border-t border-slate-100">
            <div className="bg-emerald-50/70 p-1.5 rounded-xl border border-emerald-100">
              <span className="text-[10px] text-emerald-800 font-medium block">Present</span>
              <span className="text-xs font-bold text-emerald-900 tabular-nums">{summary.presentDays}</span>
            </div>
            <div className="bg-amber-50/70 p-1.5 rounded-xl border border-amber-100">
              <span className="text-[10px] text-amber-800 font-medium block">Late</span>
              <span className="text-xs font-bold text-amber-900 tabular-nums">{summary.lateDays}</span>
            </div>
            <div className="bg-blue-50/70 p-1.5 rounded-xl border border-blue-100">
              <span className="text-[10px] text-blue-800 font-medium block">Leave</span>
              <span className="text-xs font-bold text-blue-900 tabular-nums">{summary.leaveDays}</span>
            </div>
            <div className="bg-red-50/70 p-1.5 rounded-xl border border-red-100">
              <span className="text-[10px] text-red-800 font-medium block">Absent</span>
              <span className="text-xs font-bold text-red-900 tabular-nums">{summary.absentDays}</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Status Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        {[
          { id: 'ALL', label: 'All Records' },
          { id: 'PRESENT', label: 'Present' },
          { id: 'LATE', label: 'Late Punch' },
          { id: 'LEAVE', label: 'On Leave' },
          { id: 'EXCEPTIONS', label: 'Missing / Incomplete' },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setSelectedFilter(btn.id)}
            className={`px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all border ${
              selectedFilter === btn.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Content: List View or Calendar Grid */}
      {viewMode === 'LIST' ? (
        <div className="space-y-2">
          {filteredHistory.map((rec) => {
            const badge = getStatusBadge(rec.status);
            return (
              <div
                key={rec.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="text-center min-w-[42px] py-1 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase">
                      {rec.dayOfWeek.substring(0, 3)}
                    </p>
                    <p className="text-sm font-bold text-slate-900 tabular-nums">
                      {rec.date.split('-')[2]}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        {badge.text}
                      </span>
                      {rec.isLate && (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                          +{rec.lateMinutes}m Late
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-600">
                      {rec.firstIn ? (
                        <>
                          <span className="tabular-nums font-medium">
                            IN: {new Date(rec.firstIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="tabular-nums font-medium">
                            OUT: {rec.lastOut ? new Date(rec.lastOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Missing'}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-500 italic">
                          {rec.leaveType || rec.note || 'No punch record'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {rec.workedHours > 0 && (
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-slate-900 tabular-nums">
                      {rec.workedHours}h
                    </span>
                    <span className="text-[10px] text-slate-400 block">Worked</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Calendar Grid View */
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs space-y-2">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 py-1 border-b border-slate-100">
            <span>SUN</span>
            <span>MON</span>
            <span>TUE</span>
            <span>WED</span>
            <span>THU</span>
            <span>FRI</span>
            <span>SAT</span>
          </div>

          {/* Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1 pt-1">
            {/* Blank offset cells for Oct 1st (Thursday in 2026) */}
            <div className="h-10 rounded-lg bg-slate-50/50" />
            <div className="h-10 rounded-lg bg-slate-50/50" />
            <div className="h-10 rounded-lg bg-slate-50/50" />
            <div className="h-10 rounded-lg bg-slate-50/50" />

            {/* October days */}
            {Array.from({ length: 31 }, (_, i) => {
              const day = i + 1;
              const dateStr = `2026-10-${String(day).padStart(2, '0')}`;
              const match = history.find((h) => h.date === dateStr);
              const isWeekend = (day + 4) % 7 === 0 || (day + 4) % 7 === 1;

              let dotColor = 'bg-slate-200';
              if (match) {
                if (match.status === 'Present') dotColor = 'bg-emerald-500';
                else if (match.status === 'Late') dotColor = 'bg-amber-500';
                else if (match.status === 'On Leave') dotColor = 'bg-blue-500';
                else if (match.status === 'Absent') dotColor = 'bg-red-500';
                else if (match.status === 'Holiday') dotColor = 'bg-purple-500';
              } else if (isWeekend) {
                dotColor = 'bg-slate-300';
              }

              return (
                <div
                  key={day}
                  className="h-11 rounded-xl border border-slate-100 p-1 flex flex-col items-center justify-between text-center hover:bg-slate-50 cursor-pointer"
                >
                  <span className="text-[11px] font-semibold text-slate-800 tabular-nums">
                    {day}
                  </span>
                  <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[10px] text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Present
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Late
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> Leave
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" /> Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-purple-500" /> Holiday
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
