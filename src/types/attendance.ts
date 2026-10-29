import { BranchLocation, ShiftInfo } from './auth';

export type AttendanceStatus =
  | 'Present'
  | 'Late'
  | 'On Leave'
  | 'Absent'
  | 'Weekly Off'
  | 'Holiday'
  | 'Incomplete Punch';

export type PunchType = 'CHECK_IN' | 'CHECK_OUT';

export interface PunchEvent {
  id: string;
  type: PunchType;
  timestamp: string; // ISO 8601
  latitude: number;
  longitude: number;
  accuracy: number;
  distanceFromBranchMeters: number;
  branchId: string;
  branchName: string;
  deviceInfo: {
    platform: string;
    userAgent: string;
  };
  isVerified: boolean;
  remarks?: string;
}

export interface TodayAttendance {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  firstIn?: string; // ISO
  lastOut?: string;
  totalWorkedMinutes: number;
  isLate: boolean;
  lateMinutes: number;
  isIncomplete: boolean;
  punches: PunchEvent[];
  shift: ShiftInfo;
  branch: BranchLocation;
}

export interface AttendanceHistoryRecord {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  status: AttendanceStatus;
  firstIn?: string;
  lastOut?: string;
  workedHours: number;
  isLate: boolean;
  lateMinutes: number;
  leaveType?: string;
  punches: PunchEvent[];
  note?: string;
}

export interface PunchRequestPayload {
  punchType: PunchType;
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
  branchId: string;
  idempotencyKey: string;
  deviceInfo: {
    platform: string;
    model: string;
    appVersion: string;
  };
}

export interface PunchResponse {
  success: boolean;
  message: string;
  attendance: TodayAttendance;
  punch: PunchEvent;
  idempotencyKey: string;
  geofenceVerified: boolean;
}

export interface MonthlyAttendanceSummary {
  month: string; // YYYY-MM
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  weeklyOffs: number;
  holidays: number;
  totalWorkedHours: number;
}
