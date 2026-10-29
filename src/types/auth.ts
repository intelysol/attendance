export interface Tenant {
  id: string;
  name: string;
  domain: string;
  logoUrl?: string;
  timezone: string;
  currency: string;
}

export interface EmployeeProfile {
  id: string;
  employeeCode: string;
  name: string;
  avatarUrl?: string;
  designation: string;
  department: string;
  branch: BranchLocation;
  workEmail: string;
  contactNumber: string;
  emergencyContact: string;
  joiningDate: string;
  employmentStatus: 'Active' | 'Probation' | 'On Notice' | 'Suspended';
  managerName?: string;
  shift: ShiftInfo;
}

export interface BranchLocation {
  id: string;
  name: string;
  code: string;
  address: string;
  latitude: number;
  longitude: number;
  geofenceRadiusMeters: number; // e.g. 150m
  requiredAccuracyMeters: number; // e.g. 50m max allowed uncertainty
}

export interface ShiftInfo {
  id: string;
  name: string;
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
  graceMinutes: number; // 15 mins
  halfDayHours: number; // 4.5
  fullDayHours: number; // 8.0
}

export interface TokenSession {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  refreshToken?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  session: TokenSession;
  employee: EmployeeProfile;
  tenant: Tenant;
}

export interface LoginCredentials {
  identifier: string; // email or employee code
  password: string;
  tenantDomain?: string;
}
