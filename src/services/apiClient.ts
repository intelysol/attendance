import { ApiConfig, ApiResponse } from '../types/api';
import { AuthResponse, EmployeeProfile, LoginCredentials } from '../types/auth';
import {
  AttendanceHistoryRecord,
  MonthlyAttendanceSummary,
  PunchRequestPayload,
  PunchResponse,
  TodayAttendance,
} from '../types/attendance';
import { ApplyLeavePayload, LeaveBalance, LeaveRequest } from '../types/leave';
import { PayslipDetail, PayslipSummary } from '../types/payslip';
import { Announcement, Holiday, HRNotification } from '../types/announcement';
import { mockBackendAdapter } from './mockBackendAdapter';
import { secureStorage } from './storage';

const DEFAULT_CONFIG: ApiConfig = {
  baseUrl: 'https://hcm-api.example.com/api/v1',
  useMockAdapter: true, // Default to mock adapter until real Laravel backend is connected
  timeoutMs: 15000,
  environment: 'development',
  diagnosticsEnabled: false,
};

class ApiClientService {
  private config: ApiConfig = { ...DEFAULT_CONFIG };

  constructor() {
    this.loadConfig();
  }

  public getConfig(): ApiConfig {
    return { ...this.config };
  }

  public updateConfig(updates: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...updates };
    try {
      localStorage.setItem('__ihcm_api_config', JSON.stringify(this.config));
    } catch {
      // ignore
    }
  }

  private loadConfig(): void {
    try {
      const saved = localStorage.getItem('__ihcm_api_config');
      if (saved) {
        this.config = { ...this.config, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    idempotencyKey?: string
  ): Promise<T> {
    const token = secureStorage.getToken();
    const url = `${this.config.baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (response.status === 401) {
        secureStorage.clearSession();
        throw new Error('Session expired or unauthorized. Please log in again.');
      }

      const data: ApiResponse<T> = await response.json();

      if (!response.ok || data.success === false) {
        let msg = data.message || `Server returned error (${response.status})`;
        if (data.errors) {
          const firstErr = Object.values(data.errors)[0]?.[0];
          if (firstErr) msg = `${msg}: ${firstErr}`;
        }
        throw new Error(msg);
      }

      return data.data as T;
    } catch (err: unknown) {
      clearTimeout(timeoutId);
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`Request timed out after ${this.config.timeoutMs / 1000}s.`);
      }
      throw err;
    }
  }

  // Auth Methods
  async login(creds: LoginCredentials): Promise<AuthResponse> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.login(creds);
    }
    return this.request<AuthResponse>('auth/login', {
      method: 'POST',
      body: JSON.stringify(creds),
    });
  }

  async logout(): Promise<void> {
    const token = secureStorage.getToken();
    if (this.config.useMockAdapter) {
      if (token) await mockBackendAdapter.logout(token);
      return;
    }
    try {
      await this.request('auth/logout', { method: 'POST' });
    } catch {
      // Continue client logout even if backend fails
    }
  }

  async getProfile(): Promise<EmployeeProfile> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.getProfile();
    }
    return this.request<EmployeeProfile>('auth/me');
  }

  async updateProfile(updates: Partial<EmployeeProfile>): Promise<EmployeeProfile> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.updateProfile(updates);
    }
    return this.request<EmployeeProfile>('profile/update', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async changePassword(currentPass: string, newPass: string): Promise<boolean> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.changePassword(currentPass, newPass);
    }
    await this.request('auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password: currentPass, new_password: newPass }),
    });
    return true;
  }

  // Attendance
  async getTodayAttendance(): Promise<TodayAttendance> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.getTodayAttendance();
    }
    return this.request<TodayAttendance>('attendance/today');
  }

  async submitPunch(payload: PunchRequestPayload): Promise<PunchResponse> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.submitPunch(payload);
    }
    return this.request<PunchResponse>(
      'attendance/punch',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      payload.idempotencyKey
    );
  }

  async getAttendanceHistory(month?: string): Promise<{
    history: AttendanceHistoryRecord[];
    summary: MonthlyAttendanceSummary;
  }> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.getAttendanceHistory(month);
    }
    return this.request<{ history: AttendanceHistoryRecord[]; summary: MonthlyAttendanceSummary }>(
      `attendance/history?month=${month || ''}`
    );
  }

  // Leaves
  async getLeaveBalances(): Promise<LeaveBalance[]> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.getLeaveBalances();
    }
    return this.request<LeaveBalance[]>('leaves/balances');
  }

  async getLeaveRequests(): Promise<LeaveRequest[]> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.getLeaveRequests();
    }
    return this.request<LeaveRequest[]>('leaves/requests');
  }

  async applyLeave(payload: ApplyLeavePayload): Promise<LeaveRequest> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.applyLeave(payload);
    }
    return this.request<LeaveRequest>(
      'leaves/apply',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      payload.idempotencyKey
    );
  }

  async cancelLeave(requestId: string): Promise<boolean> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.cancelLeave(requestId);
    }
    await this.request(`leaves/cancel/${requestId}`, { method: 'POST' });
    return true;
  }

  // Payslips
  async getPayslips(): Promise<PayslipSummary[]> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.getPayslips();
    }
    return this.request<PayslipSummary[]>('payslips');
  }

  async getPayslipDetail(id: string): Promise<PayslipDetail> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.getPayslipDetail(id);
    }
    return this.request<PayslipDetail>(`payslips/${id}`);
  }

  async getPayslipDownloadToken(id: string): Promise<{ downloadToken: string; expiresAt: string }> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.generatePayslipDownloadToken(id);
    }
    return this.request<{ downloadToken: string; expiresAt: string }>(
      `payslips/${id}/download-token`,
      { method: 'POST' }
    );
  }

  // Announcements & Holidays
  async getAnnouncements(): Promise<Announcement[]> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.getAnnouncements();
    }
    return this.request<Announcement[]>('company/announcements');
  }

  async getHolidays(): Promise<Holiday[]> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.getHolidays();
    }
    return this.request<Holiday[]>('company/holidays');
  }

  async getNotifications(): Promise<HRNotification[]> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.getNotifications();
    }
    return this.request<HRNotification[]>('company/notifications');
  }

  async markNotificationRead(id: string): Promise<void> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.markNotificationRead(id);
    }
    await this.request(`company/notifications/${id}/read`, { method: 'POST' });
  }

  async markAllNotificationsRead(): Promise<void> {
    if (this.config.useMockAdapter) {
      return mockBackendAdapter.markAllNotificationsRead();
    }
    await this.request('company/notifications/mark-all-read', { method: 'POST' });
  }

  async pingBackend(): Promise<{ reachable: boolean; latencyMs: number; message: string }> {
    const start = Date.now();
    if (this.config.useMockAdapter) {
      await new Promise((r) => setTimeout(r, 60));
      return {
        reachable: true,
        latencyMs: Date.now() - start,
        message: 'Mock Backend Adapter is active (Local Development Mode).',
      };
    }

    try {
      const url = `${this.config.baseUrl.replace(/\/+$/, '')}/health`;
      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(4000) });
      const latencyMs = Date.now() - start;
      return {
        reachable: res.ok,
        latencyMs,
        message: res.ok
          ? `Connected to Laravel HCM server (${latencyMs}ms)`
          : `HTTP ${res.status}: Backend reached with error`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Connection failed';
      return {
        reachable: false,
        latencyMs: Date.now() - start,
        message: `Unable to reach ${this.config.baseUrl}: ${msg}`,
      };
    }
  }
}

export const apiClient = new ApiClientService();
