import {
  AuthResponse,
  EmployeeProfile,
  LoginCredentials,
  Tenant,
  BranchLocation,
  ShiftInfo,
} from '../types/auth';
import {
  AttendanceHistoryRecord,
  MonthlyAttendanceSummary,
  PunchEvent,
  PunchRequestPayload,
  PunchResponse,
  TodayAttendance,
} from '../types/attendance';
import { ApplyLeavePayload, LeaveBalance, LeaveRequest, LeaveType } from '../types/leave';
import { PayslipDetail, PayslipSummary } from '../types/payslip';
import { Announcement, Holiday, HRNotification } from '../types/announcement';
import { calculateHaversineDistance } from './geolocationService';

// Default Tenant
export const DEFAULT_TENANT: Tenant = {
  id: 'ten_intl_9821',
  name: 'Intelysol Technologies Ltd.',
  domain: 'intelysol.com',
  timezone: 'America/Los_Angeles',
  currency: 'USD',
};

// Default Branch
export const DEFAULT_BRANCH: BranchLocation = {
  id: 'br_hq_01',
  name: 'Silicon Valley Campus (HQ)',
  code: 'SV-HQ',
  address: '1600 Innovation Way, Building 4, Mountain View, CA 94043',
  latitude: 37.4219999,
  longitude: -122.0840575,
  geofenceRadiusMeters: 150,
  requiredAccuracyMeters: 50,
};

// Default Shift
export const DEFAULT_SHIFT: ShiftInfo = {
  id: 'sh_gen_01',
  name: 'General Tech Shift (9:00 AM – 6:00 PM)',
  startTime: '09:00',
  endTime: '18:00',
  graceMinutes: 15,
  halfDayHours: 4.5,
  fullDayHours: 8.0,
};

// Default Employee
export const DEFAULT_EMPLOYEE: EmployeeProfile = {
  id: 'emp_2049',
  employeeCode: 'EMP-2049',
  name: 'Sarah Jenkins',
  avatarUrl: '/src/assets/images/employee_avatar_1793278090711.jpg',
  designation: 'Lead Frontend & Mobile Architect',
  department: 'Enterprise Product Engineering',
  branch: DEFAULT_BRANCH,
  workEmail: 'intelysol@gmail.com',
  contactNumber: '+1 (555) 382-9104',
  emergencyContact: '+1 (555) 749-2188 (Spouse: Michael)',
  joiningDate: '2022-03-15',
  employmentStatus: 'Active',
  managerName: 'David Vance (Director of Engineering)',
  shift: DEFAULT_SHIFT,
};

// Default Leave Types
export const DEFAULT_LEAVE_TYPES: LeaveType[] = [
  {
    id: 'lt_annual',
    code: 'AL',
    name: 'Annual Paid Leave',
    color: '#0284C7',
    description: 'Planned vacation and personal days off with prior approval',
    requiresDocument: false,
    maxConsecutiveDays: 14,
  },
  {
    id: 'lt_sick',
    code: 'SL',
    name: 'Medical / Sick Leave',
    color: '#E11D48',
    description: 'Leave for illness or medical recovery (document required > 2 days)',
    requiresDocument: true,
    maxConsecutiveDays: 7,
  },
  {
    id: 'lt_casual',
    code: 'CL',
    name: 'Casual / Urgent Leave',
    color: '#D97706',
    description: 'Short notice personal errands and sudden personal emergencies',
    requiresDocument: false,
    maxConsecutiveDays: 3,
  },
  {
    id: 'lt_comp',
    code: 'CO',
    name: 'Compensatory Off',
    color: '#059669',
    description: 'Earned time off for approved weekend or holiday overtime duty',
    requiresDocument: false,
    maxConsecutiveDays: 2,
  },
];

// Initial In-Memory State for realistic demo
class MockBackendDatabase {
  tenant: Tenant = { ...DEFAULT_TENANT };
  employee: EmployeeProfile = { ...DEFAULT_EMPLOYEE };
  validTokens = new Set<string>();
  idempotentPunches = new Map<string, PunchResponse>();
  idempotentLeaves = new Map<string, LeaveRequest>();

  // Attendance state for today
  todayAttendance: TodayAttendance = {
    date: new Date().toISOString().split('T')[0],
    status: 'Incomplete Punch',
    firstIn: new Date(new Date().setHours(9, 14, 0, 0)).toISOString(),
    totalWorkedMinutes: 215,
    isLate: false,
    lateMinutes: 0,
    isIncomplete: true,
    punches: [
      {
        id: 'pnch_001',
        type: 'CHECK_IN',
        timestamp: new Date(new Date().setHours(9, 14, 0, 0)).toISOString(),
        latitude: DEFAULT_BRANCH.latitude + 0.0001,
        longitude: DEFAULT_BRANCH.longitude + 0.0001,
        accuracy: 14,
        distanceFromBranchMeters: 22,
        branchId: DEFAULT_BRANCH.id,
        branchName: DEFAULT_BRANCH.name,
        deviceInfo: {
          platform: 'Mobile / Android 14',
          userAgent: 'IntelysolHCM/1.4.0',
        },
        isVerified: true,
        remarks: 'Within branch perimeter (22m)',
      },
    ],
    shift: DEFAULT_SHIFT,
    branch: DEFAULT_BRANCH,
  };

  // Leave Balances
  leaveBalances: LeaveBalance[] = [
    {
      leaveTypeId: 'lt_annual',
      leaveTypeName: 'Annual Paid Leave',
      leaveTypeCode: 'AL',
      totalAllocated: 18,
      consumed: 6,
      pending: 0,
      remaining: 12,
    },
    {
      leaveTypeId: 'lt_sick',
      leaveTypeName: 'Medical / Sick Leave',
      leaveTypeCode: 'SL',
      totalAllocated: 12,
      consumed: 2,
      pending: 0,
      remaining: 10,
    },
    {
      leaveTypeId: 'lt_casual',
      leaveTypeName: 'Casual / Urgent Leave',
      leaveTypeCode: 'CL',
      totalAllocated: 6,
      consumed: 3,
      pending: 1,
      remaining: 2,
    },
    {
      leaveTypeId: 'lt_comp',
      leaveTypeName: 'Compensatory Off',
      leaveTypeCode: 'CO',
      totalAllocated: 4,
      consumed: 1,
      pending: 0,
      remaining: 3,
    },
  ];

  // Leave Requests
  leaveRequests: LeaveRequest[] = [
    {
      id: 'lv_req_108',
      employeeId: 'emp_2049',
      leaveTypeId: 'lt_casual',
      leaveTypeName: 'Casual / Urgent Leave',
      startDate: '2026-11-12',
      endDate: '2026-11-12',
      durationDays: 1,
      durationType: 'Full Day',
      reason: 'Home maintenance and utility appointment',
      status: 'Pending',
      appliedAt: '2026-10-27T10:15:00Z',
      isEligibleForCancellation: true,
    },
    {
      id: 'lv_req_102',
      employeeId: 'emp_2049',
      leaveTypeId: 'lt_annual',
      leaveTypeName: 'Annual Paid Leave',
      startDate: '2026-09-18',
      endDate: '2026-09-22',
      durationDays: 3,
      durationType: 'Full Day',
      reason: 'Family wedding ceremony',
      status: 'Approved',
      appliedAt: '2026-09-02T08:30:00Z',
      reviewedBy: 'David Vance',
      reviewedAt: '2026-09-03T11:00:00Z',
      reviewerRemarks: 'Approved. Please ensure sprint handover is complete.',
      isEligibleForCancellation: false,
    },
    {
      id: 'lv_req_095',
      employeeId: 'emp_2049',
      leaveTypeId: 'lt_sick',
      leaveTypeName: 'Medical / Sick Leave',
      startDate: '2026-08-04',
      endDate: '2026-08-05',
      durationDays: 2,
      durationType: 'Full Day',
      reason: 'Seasonal viral flu and rest',
      status: 'Approved',
      appliedAt: '2026-08-04T07:12:00Z',
      reviewedBy: 'David Vance',
      reviewedAt: '2026-08-04T09:40:00Z',
      reviewerRemarks: 'Get well soon. Medical certificate acknowledged.',
      attachmentName: 'clinic_prescription_aug04.pdf',
      isEligibleForCancellation: false,
    },
  ];

  // Historical Attendance
  history: AttendanceHistoryRecord[] = [
    {
      id: 'hist_01',
      date: '2026-10-28',
      dayOfWeek: 'Wednesday',
      status: 'Present',
      firstIn: '2026-10-28T08:55:00Z',
      lastOut: '2026-10-28T18:05:00Z',
      workedHours: 9.1,
      isLate: false,
      lateMinutes: 0,
      punches: [],
    },
    {
      id: 'hist_02',
      date: '2026-10-27',
      dayOfWeek: 'Tuesday',
      status: 'Late',
      firstIn: '2026-10-27T09:32:00Z',
      lastOut: '2026-10-27T18:35:00Z',
      workedHours: 9.0,
      isLate: true,
      lateMinutes: 17, // Shift is 09:00 + 15m grace = 09:15. 09:32 is 17 mins late.
      punches: [],
    },
    {
      id: 'hist_03',
      date: '2026-10-26',
      dayOfWeek: 'Monday',
      status: 'Present',
      firstIn: '2026-10-26T09:02:00Z',
      lastOut: '2026-10-26T18:10:00Z',
      workedHours: 9.1,
      isLate: false,
      lateMinutes: 0,
      punches: [],
    },
    {
      id: 'hist_04',
      date: '2026-10-25',
      dayOfWeek: 'Sunday',
      status: 'Weekly Off',
      workedHours: 0,
      isLate: false,
      lateMinutes: 0,
      punches: [],
    },
    {
      id: 'hist_05',
      date: '2026-10-24',
      dayOfWeek: 'Saturday',
      status: 'Weekly Off',
      workedHours: 0,
      isLate: false,
      lateMinutes: 0,
      punches: [],
    },
    {
      id: 'hist_06',
      date: '2026-10-23',
      dayOfWeek: 'Friday',
      status: 'Present',
      firstIn: '2026-10-23T08:50:00Z',
      lastOut: '2026-10-23T17:55:00Z',
      workedHours: 9.0,
      isLate: false,
      lateMinutes: 0,
      punches: [],
    },
    {
      id: 'hist_07',
      date: '2026-10-22',
      dayOfWeek: 'Thursday',
      status: 'On Leave',
      workedHours: 0,
      isLate: false,
      lateMinutes: 0,
      leaveType: 'Annual Paid Leave',
      punches: [],
    },
    {
      id: 'hist_08',
      date: '2026-10-21',
      dayOfWeek: 'Wednesday',
      status: 'Incomplete Punch',
      firstIn: '2026-10-21T09:10:00Z',
      lastOut: undefined,
      workedHours: 4.2,
      isLate: false,
      lateMinutes: 0,
      punches: [],
      note: 'Missed evening punch out',
    },
    {
      id: 'hist_09',
      date: '2026-10-20',
      dayOfWeek: 'Tuesday',
      status: 'Holiday',
      workedHours: 0,
      isLate: false,
      lateMinutes: 0,
      note: 'Regional Festival Holiday',
      punches: [],
    },
    {
      id: 'hist_10',
      date: '2026-10-19',
      dayOfWeek: 'Monday',
      status: 'Absent',
      workedHours: 0,
      isLate: false,
      lateMinutes: 0,
      note: 'Unscheduled absence without prior leave notice',
      punches: [],
    },
  ];

  // Payslips
  payslips: PayslipDetail[] = [
    {
      id: 'ps_2026_09',
      payrollPeriod: 'September 2026',
      month: 9,
      year: 2026,
      grossEarnings: 10450.0,
      totalDeductions: 2280.0,
      netSalary: 8170.0,
      currency: 'USD',
      publicationDate: '2026-09-30',
      isPublished: true,
      status: 'Published',
      employeeCode: 'EMP-2049',
      employeeName: 'Sarah Jenkins',
      designation: 'Lead Frontend & Mobile Architect',
      department: 'Enterprise Product Engineering',
      branchName: 'Silicon Valley Campus (HQ)',
      panNumberMasked: '••• ••• 4921',
      bankAccountNumberMasked: '•••• •••• •••• 8842',
      bankName: 'Silicon Valley Chase Commercial',
      totalWorkingDays: 22,
      paidDays: 22,
      lopDays: 0,
      earnings: [
        { name: 'Basic Salary', amount: 6500.0 },
        { name: 'House Rent Allowance (HRA)', amount: 2200.0 },
        { name: 'Special Tech Allowance', amount: 1100.0 },
        { name: 'Internet & Remote Connectivity', amount: 150.0 },
        { name: 'Health & Wellness Stipend', amount: 500.0 },
      ],
      deductions: [
        { name: 'Federal & State Withholding Tax', amount: 1420.0 },
        { name: '401(k) / Employee Pension Fund', amount: 520.0 },
        { name: 'Comprehensive Medical & Dental Insurance', amount: 280.0 },
        { name: 'Professional Dues', amount: 60.0 },
      ],
    },
    {
      id: 'ps_2026_08',
      payrollPeriod: 'August 2026',
      month: 8,
      year: 2026,
      grossEarnings: 10450.0,
      totalDeductions: 2280.0,
      netSalary: 8170.0,
      currency: 'USD',
      publicationDate: '2026-08-31',
      isPublished: true,
      status: 'Published',
      employeeCode: 'EMP-2049',
      employeeName: 'Sarah Jenkins',
      designation: 'Lead Frontend & Mobile Architect',
      department: 'Enterprise Product Engineering',
      branchName: 'Silicon Valley Campus (HQ)',
      panNumberMasked: '••• ••• 4921',
      bankAccountNumberMasked: '•••• •••• •••• 8842',
      bankName: 'Silicon Valley Chase Commercial',
      totalWorkingDays: 21,
      paidDays: 21,
      lopDays: 0,
      earnings: [
        { name: 'Basic Salary', amount: 6500.0 },
        { name: 'House Rent Allowance (HRA)', amount: 2200.0 },
        { name: 'Special Tech Allowance', amount: 1100.0 },
        { name: 'Internet & Remote Connectivity', amount: 150.0 },
        { name: 'Health & Wellness Stipend', amount: 500.0 },
      ],
      deductions: [
        { name: 'Federal & State Withholding Tax', amount: 1420.0 },
        { name: '401(k) / Employee Pension Fund', amount: 520.0 },
        { name: 'Comprehensive Medical & Dental Insurance', amount: 280.0 },
        { name: 'Professional Dues', amount: 60.0 },
      ],
    },
    {
      id: 'ps_2026_07',
      payrollPeriod: 'July 2026',
      month: 7,
      year: 2026,
      grossEarnings: 10450.0,
      totalDeductions: 2280.0,
      netSalary: 8170.0,
      currency: 'USD',
      publicationDate: '2026-07-31',
      isPublished: true,
      status: 'Published',
      employeeCode: 'EMP-2049',
      employeeName: 'Sarah Jenkins',
      designation: 'Lead Frontend & Mobile Architect',
      department: 'Enterprise Product Engineering',
      branchName: 'Silicon Valley Campus (HQ)',
      panNumberMasked: '••• ••• 4921',
      bankAccountNumberMasked: '•••• •••• •••• 8842',
      bankName: 'Silicon Valley Chase Commercial',
      totalWorkingDays: 23,
      paidDays: 23,
      lopDays: 0,
      earnings: [
        { name: 'Basic Salary', amount: 6500.0 },
        { name: 'House Rent Allowance (HRA)', amount: 2200.0 },
        { name: 'Special Tech Allowance', amount: 1100.0 },
        { name: 'Internet & Remote Connectivity', amount: 150.0 },
        { name: 'Health & Wellness Stipend', amount: 500.0 },
      ],
      deductions: [
        { name: 'Federal & State Withholding Tax', amount: 1420.0 },
        { name: '401(k) / Employee Pension Fund', amount: 520.0 },
        { name: 'Comprehensive Medical & Dental Insurance', amount: 280.0 },
        { name: 'Professional Dues', amount: 60.0 },
      ],
    },
  ];

  // Announcements
  announcements: Announcement[] = [
    {
      id: 'anc_01',
      title: 'Q4 All-Hands Townhall & Innovation Awards',
      content:
        'Join executive leadership this Thursday at 3:00 PM PST for our quarterly updates, product milestones, and annual employee recognition.',
      date: '2026-10-28',
      author: 'HR Operations',
      priority: 'High',
    },
    {
      id: 'anc_02',
      title: 'Open Enrollment for 2027 Group Health & Wellness Benefits',
      content:
        'Benefits open enrollment window begins November 5. Please review the updated dental, vision, and HSA contribution tiers in your portal.',
      date: '2026-10-25',
      author: 'Benefits Committee',
      priority: 'Normal',
    },
  ];

  // Company Holidays
  holidays: Holiday[] = [
    {
      id: 'hol_01',
      name: 'Veterans Day Observance',
      date: '2026-11-11',
      dayOfWeek: 'Wednesday',
      isOptional: false,
      applicableBranches: ['SV-HQ', 'AUS-01'],
    },
    {
      id: 'hol_02',
      name: 'Thanksgiving Holiday',
      date: '2026-11-26',
      dayOfWeek: 'Thursday',
      isOptional: false,
      applicableBranches: ['SV-HQ', 'AUS-01'],
    },
    {
      id: 'hol_03',
      name: 'Day After Thanksgiving',
      date: '2026-11-27',
      dayOfWeek: 'Friday',
      isOptional: false,
      applicableBranches: ['SV-HQ', 'AUS-01'],
    },
    {
      id: 'hol_04',
      name: 'Winter Break & Christmas',
      date: '2026-12-25',
      dayOfWeek: 'Friday',
      isOptional: false,
      applicableBranches: ['SV-HQ', 'AUS-01', 'LON-02'],
    },
  ];

  // Notifications
  notifications: HRNotification[] = [
    {
      id: 'notif_01',
      title: 'Attendance Punch Verified',
      message: 'Morning Check-In at Silicon Valley HQ was verified via GPS geofence.',
      type: 'attendance',
      timestamp: 'Today, 9:14 AM',
      isRead: false,
    },
    {
      id: 'notif_02',
      title: 'September 2026 Payslip Published',
      message: 'Your official net salary slip for September 2026 is now available.',
      type: 'payroll',
      timestamp: 'Sep 30, 2026',
      isRead: true,
    },
    {
      id: 'notif_03',
      title: 'Casual Leave Request Under Review',
      message: 'Your leave application for Nov 12, 2026 has been forwarded to David Vance.',
      type: 'leave',
      timestamp: 'Oct 27, 2026',
      isRead: false,
    },
  ];
}

export const mockDb = new MockBackendDatabase();

/**
 * Controller-level simulator for Laravel REST API /api/v1/
 */
export const mockBackendAdapter = {
  // Authentication
  async login(creds: LoginCredentials): Promise<AuthResponse> {
    await simulateNetworkDelay(250);

    // Validation
    if (!creds.identifier || !creds.identifier.trim()) {
      throw new Error('Work email or Employee Code is required.');
    }
    if (!creds.password || creds.password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    // Demo allows: intelysol@gmail.com, sarah.jenkins@intelysol.com, or EMP-2049 with password 'password123' or 'intelysol2026'
    const cleanId = creds.identifier.trim().toLowerCase();
    const isAllowedId =
      cleanId === 'intelysol@gmail.com' ||
      cleanId === 'sarah.jenkins@intelysol.com' ||
      cleanId === 'emp-2049' ||
      cleanId === 'admin';

    if (!isAllowedId || (creds.password !== 'password123' && creds.password !== 'intelysol2026')) {
      throw new Error('Invalid credentials. Check your email or employee code and password.');
    }

    const token = 'ihcm_tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    mockDb.validTokens.add(token);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return {
      success: true,
      message: 'Authenticated successfully with Intelysol HCM SaaS.',
      session: {
        accessToken: token,
        tokenType: 'Bearer',
        expiresAt,
      },
      employee: { ...mockDb.employee },
      tenant: { ...mockDb.tenant },
    };
  },

  async logout(token: string): Promise<{ success: boolean; message: string }> {
    await simulateNetworkDelay(120);
    mockDb.validTokens.delete(token);
    return { success: true, message: 'Logged out successfully.' };
  },

  async getProfile(): Promise<EmployeeProfile> {
    await simulateNetworkDelay(150);
    return { ...mockDb.employee };
  },

  async updateProfile(updates: Partial<EmployeeProfile>): Promise<EmployeeProfile> {
    await simulateNetworkDelay(200);

    // Security check: Never allow employee to change protected fields!
    if ('salary' in updates || 'employeeCode' in updates || 'branch' in updates || 'employmentStatus' in updates) {
      throw new Error('Forbidden: Protected HR fields cannot be modified by employee self-service.');
    }

    if (updates.contactNumber !== undefined) {
      mockDb.employee.contactNumber = updates.contactNumber;
    }
    if (updates.emergencyContact !== undefined) {
      mockDb.employee.emergencyContact = updates.emergencyContact;
    }

    return { ...mockDb.employee };
  },

  async changePassword(currentPass: string, newPass: string): Promise<boolean> {
    await simulateNetworkDelay(250);
    if (currentPass !== 'password123' && currentPass !== 'intelysol2026') {
      throw new Error('Current password does not match server records.');
    }
    if (!newPass || newPass.length < 8) {
      throw new Error('New password must be at least 8 characters long.');
    }
    return true;
  },

  // Attendance
  async getTodayAttendance(): Promise<TodayAttendance> {
    await simulateNetworkDelay(160);
    return { ...mockDb.todayAttendance };
  },

  async submitPunch(payload: PunchRequestPayload): Promise<PunchResponse> {
    await simulateNetworkDelay(300);

    // 1. Idempotency Check: if this idempotency key was already processed, return identical response
    if (mockDb.idempotentPunches.has(payload.idempotencyKey)) {
      return mockDb.idempotentPunches.get(payload.idempotencyKey)!;
    }

    // 2. Location Accuracy Check (Server-enforced)
    if (payload.accuracy > mockDb.employee.branch.requiredAccuracyMeters) {
      throw new Error(
        `Attendance rejected: GPS accuracy is ${Math.round(
          payload.accuracy
        )}m, which exceeds the maximum allowed ${
          mockDb.employee.branch.requiredAccuracyMeters
        }m threshold. Please move to an area with clear sky view.`
      );
    }

    // 3. Geofence Distance Verification (Server-enforced)
    const distanceMeters = calculateHaversineDistance(
      payload.latitude,
      payload.longitude,
      mockDb.employee.branch.latitude,
      mockDb.employee.branch.longitude
    );

    if (distanceMeters > mockDb.employee.branch.geofenceRadiusMeters) {
      throw new Error(
        `Attendance rejected: You are ${distanceMeters}m away from ${mockDb.employee.branch.name}. Mobile punch requires being within ${mockDb.employee.branch.geofenceRadiusMeters}m.`
      );
    }

    // 4. Punch State Processing
    const nowIso = payload.timestamp || new Date().toISOString();
    const punchId = 'pnch_' + Date.now().toString(36);

    const newPunch: PunchEvent = {
      id: punchId,
      type: payload.punchType,
      timestamp: nowIso,
      latitude: payload.latitude,
      longitude: payload.longitude,
      accuracy: Math.round(payload.accuracy),
      distanceFromBranchMeters: distanceMeters,
      branchId: payload.branchId || mockDb.employee.branch.id,
      branchName: mockDb.employee.branch.name,
      deviceInfo: {
        platform: payload.deviceInfo.platform,
        userAgent: payload.deviceInfo.model || 'Intelysol Mobile App',
      },
      isVerified: true,
      remarks: `Verified at ${distanceMeters}m from branch geofence`,
    };

    const punches = [...mockDb.todayAttendance.punches, newPunch];
    let firstIn = mockDb.todayAttendance.firstIn;
    let lastOut = mockDb.todayAttendance.lastOut;
    let status = mockDb.todayAttendance.status;
    let isLate = mockDb.todayAttendance.isLate;
    let lateMinutes = mockDb.todayAttendance.lateMinutes;

    if (payload.punchType === 'CHECK_IN') {
      if (!firstIn) {
        firstIn = nowIso;
        // Check late: shift start 09:00 + 15 min grace = 09:15
        const punchHour = new Date(nowIso).getHours();
        const punchMin = new Date(nowIso).getMinutes();
        const totalMins = punchHour * 60 + punchMin;
        const shiftStartMins = 9 * 60; // 09:00
        const graceMins = 15;
        if (totalMins > shiftStartMins + graceMins) {
          isLate = true;
          lateMinutes = totalMins - shiftStartMins;
          status = 'Late';
        } else {
          status = 'Present';
        }
      }
    } else {
      lastOut = nowIso;
      status = 'Present';
    }

    // Calculate worked minutes
    let workedMinutes = mockDb.todayAttendance.totalWorkedMinutes;
    if (firstIn && lastOut) {
      const diffMs = new Date(lastOut).getTime() - new Date(firstIn).getTime();
      workedMinutes = Math.max(0, Math.round(diffMs / 60000));
    }

    mockDb.todayAttendance = {
      ...mockDb.todayAttendance,
      status,
      firstIn,
      lastOut,
      totalWorkedMinutes: workedMinutes,
      isLate,
      lateMinutes,
      isIncomplete: !lastOut,
      punches,
    };

    const response: PunchResponse = {
      success: true,
      message: `${
        payload.punchType === 'CHECK_IN' ? 'Check-In' : 'Check-Out'
      } recorded and verified successfully.`,
      attendance: { ...mockDb.todayAttendance },
      punch: newPunch,
      idempotencyKey: payload.idempotencyKey,
      geofenceVerified: true,
    };

    // Cache idempotency response
    mockDb.idempotentPunches.set(payload.idempotencyKey, response);

    return response;
  },

  async getAttendanceHistory(month?: string): Promise<{
    history: AttendanceHistoryRecord[];
    summary: MonthlyAttendanceSummary;
  }> {
    await simulateNetworkDelay(180);
    const history = [...mockDb.history];

    const summary: MonthlyAttendanceSummary = {
      month: month || '2026-10',
      totalDays: 31,
      presentDays: 19,
      lateDays: 2,
      absentDays: 1,
      leaveDays: 1,
      weeklyOffs: 8,
      holidays: 1,
      totalWorkedHours: 168.4,
    };

    return { history, summary };
  },

  // Leave Management
  async getLeaveBalances(): Promise<LeaveBalance[]> {
    await simulateNetworkDelay(120);
    return [...mockDb.leaveBalances];
  },

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    await simulateNetworkDelay(150);
    return [...mockDb.leaveRequests];
  },

  async applyLeave(payload: ApplyLeavePayload): Promise<LeaveRequest> {
    await simulateNetworkDelay(250);

    // Idempotency
    if (mockDb.idempotentLeaves.has(payload.idempotencyKey)) {
      return mockDb.idempotentLeaves.get(payload.idempotencyKey)!;
    }

    if (!payload.startDate || !payload.endDate) {
      throw new Error('Please select valid start and end dates.');
    }
    if (new Date(payload.startDate) > new Date(payload.endDate)) {
      throw new Error('Start date cannot be after end date.');
    }
    if (!payload.reason || payload.reason.trim().length < 5) {
      throw new Error('Please provide a specific reason (at least 5 characters).');
    }

    const leaveType = DEFAULT_LEAVE_TYPES.find((t) => t.id === payload.leaveTypeId);
    if (!leaveType) {
      throw new Error('Invalid leave type selected.');
    }

    const start = new Date(payload.startDate);
    const end = new Date(payload.endDate);
    const diffDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const durationDays = payload.durationType === 'Full Day' ? diffDays : 0.5;

    // Check balance
    const balance = mockDb.leaveBalances.find((b) => b.leaveTypeId === payload.leaveTypeId);
    if (balance && balance.remaining < durationDays) {
      throw new Error(
        `Insufficient leave balance for ${leaveType.name}. Remaining: ${balance.remaining} days, Requested: ${durationDays} days.`
      );
    }

    const newRequest: LeaveRequest = {
      id: 'lv_req_' + Date.now().toString(36),
      employeeId: mockDb.employee.id,
      leaveTypeId: payload.leaveTypeId,
      leaveTypeName: leaveType.name,
      startDate: payload.startDate,
      endDate: payload.endDate,
      durationDays,
      durationType: payload.durationType,
      reason: payload.reason.trim(),
      status: 'Pending',
      appliedAt: new Date().toISOString(),
      attachmentName: payload.attachmentName,
      isEligibleForCancellation: true,
    };

    mockDb.leaveRequests.unshift(newRequest);

    // Update pending balance
    if (balance) {
      balance.pending += durationDays;
      balance.remaining = Math.max(0, balance.remaining - durationDays);
    }

    mockDb.idempotentLeaves.set(payload.idempotencyKey, newRequest);
    return newRequest;
  },

  async cancelLeave(requestId: string): Promise<boolean> {
    await simulateNetworkDelay(200);
    const req = mockDb.leaveRequests.find((r) => r.id === requestId);
    if (!req) {
      throw new Error('Leave request not found.');
    }
    if (!req.isEligibleForCancellation) {
      throw new Error('This leave request is not eligible for cancellation.');
    }

    req.status = 'Cancelled';
    req.isEligibleForCancellation = false;

    // Restore balance
    const balance = mockDb.leaveBalances.find((b) => b.leaveTypeId === req.leaveTypeId);
    if (balance) {
      balance.pending = Math.max(0, balance.pending - req.durationDays);
      balance.remaining += req.durationDays;
    }

    return true;
  },

  // Payslips
  async getPayslips(): Promise<PayslipSummary[]> {
    await simulateNetworkDelay(140);
    return mockDb.payslips.map(({ id, payrollPeriod, month, year, grossEarnings, totalDeductions, netSalary, currency, publicationDate, isPublished, status }) => ({
      id,
      payrollPeriod,
      month,
      year,
      grossEarnings,
      totalDeductions,
      netSalary,
      currency,
      publicationDate,
      isPublished,
      status,
    }));
  },

  async getPayslipDetail(payslipId: string): Promise<PayslipDetail> {
    await simulateNetworkDelay(180);
    const ps = mockDb.payslips.find((p) => p.id === payslipId);
    if (!ps) {
      throw new Error('Payslip not found or unauthorized.');
    }
    return { ...ps };
  },

  async generatePayslipDownloadToken(payslipId: string): Promise<{ downloadToken: string; expiresAt: string }> {
    await simulateNetworkDelay(150);
    const token = 'ps_dl_' + Math.random().toString(36).substring(2) + '_' + payslipId;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    return { downloadToken: token, expiresAt };
  },

  // Company Information
  async getAnnouncements(): Promise<Announcement[]> {
    await simulateNetworkDelay(120);
    return [...mockDb.announcements];
  },

  async getHolidays(): Promise<Holiday[]> {
    await simulateNetworkDelay(100);
    return [...mockDb.holidays];
  },

  async getNotifications(): Promise<HRNotification[]> {
    await simulateNetworkDelay(100);
    return [...mockDb.notifications];
  },

  async markNotificationRead(notifId: string): Promise<void> {
    const notif = mockDb.notifications.find((n) => n.id === notifId);
    if (notif) notif.isRead = true;
  },

  async markAllNotificationsRead(): Promise<void> {
    mockDb.notifications.forEach((n) => (n.isRead = true));
  },
};

function simulateNetworkDelay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
