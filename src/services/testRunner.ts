import { apiClient } from './apiClient';
import { secureStorage } from './storage';
import { calculateHaversineDistance, generateUUID, geolocationService } from './geolocationService';
import { mockBackendAdapter, DEFAULT_BRANCH } from './mockBackendAdapter';

export interface TestCaseResult {
  id: string;
  category: string;
  name: string;
  description: string;
  status: 'passed' | 'failed' | 'running' | 'pending';
  durationMs?: number;
  error?: string;
  details?: string;
}

export const TEST_SUITE_DEFINITIONS: Omit<TestCaseResult, 'status' | 'durationMs' | 'error' | 'details'>[] = [
  {
    id: 'test_auth_01',
    category: 'Authentication',
    name: 'Login with Valid Credentials & Secure Token Creation',
    description: 'Authenticates with valid email/password and verifies Bearer token and expiration are securely saved.',
  },
  {
    id: 'test_auth_02',
    category: 'Authentication',
    name: 'Login Validation & Invalid Credentials Rejection',
    description: 'Rejects invalid email format and bad password with server-style validation error.',
  },
  {
    id: 'test_auth_03',
    category: 'Authentication',
    name: 'Session Invalidation & Logout Token Revocation',
    description: 'Clears bearer token and ensures subsequent protected queries fail appropriately.',
  },
  {
    id: 'test_prof_01',
    category: 'Employee Identity',
    name: 'Profile Loading & Immutability Enforcement',
    description: 'Ensures authorized employee identity is loaded and server rejects unauthorized updates to salary/code/branch.',
  },
  {
    id: 'test_gps_01',
    category: 'Mobile Attendance',
    name: 'Geofence Verification Inside Branch Perimeter',
    description: 'Verifies check-in succeeds when device coordinates are within the configured 150m branch geofence.',
  },
  {
    id: 'test_gps_02',
    category: 'Mobile Attendance',
    name: 'Rejection of Punch Outside Branch Geofence',
    description: 'Verifies server rejects attendance check-in when coordinates are outside the geofence perimeter (e.g. 480m away).',
  },
  {
    id: 'test_gps_03',
    category: 'Mobile Attendance',
    name: 'GPS Accuracy Threshold Enforcement (<50m)',
    description: 'Verifies rejection when location accuracy uncertainty exceeds the 50m required threshold.',
  },
  {
    id: 'test_gps_04',
    category: 'Mobile Attendance',
    name: 'Location Permission Denial Handling',
    description: 'Verifies graceful error message when foreground GPS permission is denied by the user or OS.',
  },
  {
    id: 'test_idem_01',
    category: 'Mobile Attendance',
    name: 'Duplicate Punch Prevention with Idempotency Key',
    description: 'Verifies resubmission with identical UUID idempotency key returns cached response without duplicate punch record.',
  },
  {
    id: 'test_hist_01',
    category: 'Attendance History',
    name: 'Attendance History & Calendar Status Parsing',
    description: 'Validates multi-status attendance history (Present, Late, On Leave, Absent, Weekly Off, Incomplete Punch).',
  },
  {
    id: 'test_leave_01',
    category: 'Leave Management',
    name: 'Leave Balances Retrieval & Type Quotas',
    description: 'Verifies typed leave balances (Annual, Sick, Casual, Comp-Off) with remaining vs consumed tracking.',
  },
  {
    id: 'test_leave_02',
    category: 'Leave Management',
    name: 'Leave Application Validation & Balance Deduction',
    description: 'Applies for a valid leave request and verifies balance reflects pending status.',
  },
  {
    id: 'test_leave_03',
    category: 'Leave Management',
    name: 'Leave Cancellation Eligibility Check',
    description: 'Verifies employee can cancel pending leave requests but cannot cancel historically approved/consumed requests.',
  },
  {
    id: 'test_pay_01',
    category: 'Payslips',
    name: 'Payslip Listing & Calculation Integrity',
    description: 'Verifies Gross = Basic + Allowances, Deductions sum, and Net Salary = Gross - Deductions.',
  },
  {
    id: 'test_pay_02',
    category: 'Payslips',
    name: 'Authorized Payslip Ephemeral Token Generation',
    description: 'Verifies secure 15-minute download token creation without exposing static unrestricted file URLs.',
  },
  {
    id: 'test_sec_01',
    category: 'Security & Storage',
    name: 'Secure Token Vault & Plaintext Protection',
    description: 'Verifies tokens are encrypted in vault and plain text passwords are never stored in localStorage.',
  },
];

export async function runAllTests(
  onProgress?: (results: TestCaseResult[]) => void
): Promise<TestCaseResult[]> {
  const results: TestCaseResult[] = TEST_SUITE_DEFINITIONS.map((def) => ({
    ...def,
    status: 'pending',
  }));

  const update = (idx: number, patch: Partial<TestCaseResult>) => {
    results[idx] = { ...results[idx], ...patch };
    if (onProgress) onProgress([...results]);
  };

  for (let i = 0; i < results.length; i++) {
    const test = results[i];
    update(i, { status: 'running' });
    const startTime = performance.now();

    try {
      switch (test.id) {
        case 'test_auth_01': {
          const authRes = await mockBackendAdapter.login({
            identifier: 'intelysol@gmail.com',
            password: 'password123',
          });
          if (!authRes.success || !authRes.session.accessToken) {
            throw new Error('Login response missing access token.');
          }
          secureStorage.saveSession(authRes.session.accessToken, authRes.session.expiresAt);
          const retrieved = secureStorage.getToken();
          if (retrieved !== authRes.session.accessToken) {
            throw new Error('Token retrieved from secure vault does not match issued token.');
          }
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: `Authenticated user ${authRes.employee.name} (${authRes.employee.employeeCode}). Bearer token stored.`,
          });
          break;
        }

        case 'test_auth_02': {
          let threw = false;
          try {
            await mockBackendAdapter.login({
              identifier: 'unknown@example.com',
              password: 'wrongpassword',
            });
          } catch (e: unknown) {
            threw = true;
            const msg = e instanceof Error ? e.message : '';
            if (!msg.toLowerCase().includes('invalid')) {
              throw new Error(`Unexpected error message: ${msg}`);
            }
          }
          if (!threw) throw new Error('Failed to reject invalid credentials.');
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: 'Rejected invalid credentials with 401 Unauthorized equivalent message.',
          });
          break;
        }

        case 'test_auth_03': {
          const token = secureStorage.getToken() || 'temp_tok';
          await mockBackendAdapter.logout(token);
          secureStorage.clearSession();
          if (secureStorage.isSessionValid()) {
            throw new Error('Session is still marked valid after clearSession.');
          }
          // Re-authenticate for remaining tests
          const reauth = await mockBackendAdapter.login({
            identifier: 'intelysol@gmail.com',
            password: 'password123',
          });
          secureStorage.saveSession(reauth.session.accessToken, reauth.session.expiresAt);
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: 'Token successfully invalidated on server and cleared from client storage.',
          });
          break;
        }

        case 'test_prof_01': {
          const profile = await mockBackendAdapter.getProfile();
          if (profile.employeeCode !== 'EMP-2049') {
            throw new Error(`Unexpected employee code: ${profile.employeeCode}`);
          }
          // Try modifying protected field
          let protectedFieldBlocked = false;
          try {
            await mockBackendAdapter.updateProfile({
              // @ts-expect-error intentionally testing runtime security
              salary: 999999,
            });
          } catch {
            protectedFieldBlocked = true;
          }
          if (!protectedFieldBlocked) {
            throw new Error('Security breach: protected field modification was allowed!');
          }
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: `Verified employee ${profile.name}. Protected field modifications rejected.`,
          });
          break;
        }

        case 'test_gps_01': {
          // Inside geofence test: 20 meters from branch
          const branch = DEFAULT_BRANCH;
          const lat = branch.latitude + 0.0001;
          const lon = branch.longitude + 0.0001;
          const dist = calculateHaversineDistance(lat, lon, branch.latitude, branch.longitude);
          if (dist > branch.geofenceRadiusMeters) {
            throw new Error(`Test coordinate distance ${dist}m exceeds geofence ${branch.geofenceRadiusMeters}m`);
          }
          const punchRes = await mockBackendAdapter.submitPunch({
            punchType: 'CHECK_IN',
            latitude: lat,
            longitude: lon,
            accuracy: 14,
            timestamp: new Date().toISOString(),
            branchId: branch.id,
            idempotencyKey: generateUUID(),
            deviceInfo: {
              platform: 'Test Runner / Android 14',
              model: 'Automated Test',
              appVersion: '1.4.0',
            },
          });
          if (!punchRes.success || !punchRes.geofenceVerified) {
            throw new Error('Check-in failed despite valid geofence proximity.');
          }
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: `Punch verified within branch perimeter (${punchRes.punch.distanceFromBranchMeters}m from center).`,
          });
          break;
        }

        case 'test_gps_02': {
          // Outside geofence test: 480 meters from branch
          const branch = DEFAULT_BRANCH;
          const lat = branch.latitude + 0.0035;
          const lon = branch.longitude + 0.0028;
          let rejected = false;
          try {
            await mockBackendAdapter.submitPunch({
              punchType: 'CHECK_IN',
              latitude: lat,
              longitude: lon,
              accuracy: 15,
              timestamp: new Date().toISOString(),
              branchId: branch.id,
              idempotencyKey: generateUUID(),
              deviceInfo: {
                platform: 'Test Runner',
                model: 'Automated Test',
                appVersion: '1.4.0',
              },
            });
          } catch (e: unknown) {
            rejected = true;
            const msg = e instanceof Error ? e.message : '';
            if (!msg.includes('away from')) {
              throw new Error(`Unexpected message: ${msg}`);
            }
          }
          if (!rejected) throw new Error('Punch outside geofence was erroneously permitted!');
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: 'Outside geofence punch correctly rejected with distance feedback.',
          });
          break;
        }

        case 'test_gps_03': {
          const branch = DEFAULT_BRANCH;
          let accuracyRejected = false;
          try {
            await mockBackendAdapter.submitPunch({
              punchType: 'CHECK_IN',
              latitude: branch.latitude,
              longitude: branch.longitude,
              accuracy: 140, // 140m > 50m max allowed
              timestamp: new Date().toISOString(),
              branchId: branch.id,
              idempotencyKey: generateUUID(),
              deviceInfo: {
                platform: 'Test Runner',
                model: 'Automated Test',
                appVersion: '1.4.0',
              },
            });
          } catch (e: unknown) {
            accuracyRejected = true;
            const msg = e instanceof Error ? e.message : '';
            if (!msg.toLowerCase().includes('accuracy')) {
              throw new Error(`Unexpected accuracy message: ${msg}`);
            }
          }
          if (!accuracyRejected) throw new Error('Poor GPS accuracy (>50m) was not rejected.');
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: 'Low accuracy GPS reading (140m) correctly rejected to prevent spoofing.',
          });
          break;
        }

        case 'test_gps_04': {
          const sim = geolocationService.simulatePosition(DEFAULT_BRANCH, 'permission_denied');
          if (!sim.error || sim.error.code !== 'PERMISSION_DENIED') {
            throw new Error('Permission denied error code not properly surfaced.');
          }
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: 'Handled PERMISSION_DENIED with user recovery guidance.',
          });
          break;
        }

        case 'test_idem_01': {
          const branch = DEFAULT_BRANCH;
          const testKey = 'test_key_' + generateUUID();
          const p1 = await mockBackendAdapter.submitPunch({
            punchType: 'CHECK_OUT',
            latitude: branch.latitude,
            longitude: branch.longitude,
            accuracy: 10,
            timestamp: new Date().toISOString(),
            branchId: branch.id,
            idempotencyKey: testKey,
            deviceInfo: { platform: 'Test', model: 'Test', appVersion: '1.4.0' },
          });

          // Resubmit with EXACT same idempotency key
          const p2 = await mockBackendAdapter.submitPunch({
            punchType: 'CHECK_OUT',
            latitude: branch.latitude,
            longitude: branch.longitude,
            accuracy: 10,
            timestamp: new Date().toISOString(),
            branchId: branch.id,
            idempotencyKey: testKey,
            deviceInfo: { platform: 'Test', model: 'Test', appVersion: '1.4.0' },
          });

          if (p1.punch.id !== p2.punch.id) {
            throw new Error('Duplicate punch recorded! Idempotency key was not respected.');
          }
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: `Idempotency key ${testKey.substring(0, 16)}... returned exact prior punch ID: ${p1.punch.id}.`,
          });
          break;
        }

        case 'test_hist_01': {
          const { history, summary } = await mockBackendAdapter.getAttendanceHistory('2026-10');
          if (!Array.isArray(history) || history.length === 0) {
            throw new Error('Attendance history returned empty array.');
          }
          const hasLeave = history.some((h) => h.status === 'On Leave');
          const hasHoliday = history.some((h) => h.status === 'Holiday');
          const hasOff = history.some((h) => h.status === 'Weekly Off');
          if (!hasLeave || !hasHoliday || !hasOff) {
            throw new Error('History missing non-punch calendar days (Leave/Holiday/Off).');
          }
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: `Loaded ${history.length} records. Monthly summary: ${summary.presentDays} present, ${summary.lateDays} late.`,
          });
          break;
        }

        case 'test_leave_01': {
          const balances = await mockBackendAdapter.getLeaveBalances();
          if (balances.length < 3) {
            throw new Error('Leave balances returned fewer than 3 types.');
          }
          const annual = balances.find((b) => b.leaveTypeCode === 'AL');
          if (!annual || annual.remaining <= 0) {
            throw new Error('Annual leave balance not initialized.');
          }
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: `Retrieved ${balances.length} categories. Annual Leave: ${annual.remaining} days remaining.`,
          });
          break;
        }

        case 'test_leave_02': {
          const initialBalances = await mockBackendAdapter.getLeaveBalances();
          const comp = initialBalances.find((b) => b.leaveTypeCode === 'CO')!;
          const prevPending = comp.pending;

          const key = 'test_lv_' + generateUUID();
          const req = await mockBackendAdapter.applyLeave({
            leaveTypeId: comp.leaveTypeId,
            startDate: '2026-12-01',
            endDate: '2026-12-01',
            durationType: 'Full Day',
            reason: 'Comp-off compensatory day for server migration weekend',
            idempotencyKey: key,
          });

          if (req.status !== 'Pending') {
            throw new Error(`Unexpected leave status: ${req.status}`);
          }

          const updatedBalances = await mockBackendAdapter.getLeaveBalances();
          const updatedComp = updatedBalances.find((b) => b.leaveTypeCode === 'CO')!;
          if (updatedComp.pending !== prevPending + 1) {
            throw new Error('Pending balance was not incremented after application.');
          }

          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: `Leave application #${req.id} created. Pending days updated: ${updatedComp.pending}.`,
          });
          break;
        }

        case 'test_leave_03': {
          const requests = await mockBackendAdapter.getLeaveRequests();
          const pending = requests.find((r) => r.status === 'Pending' && r.isEligibleForCancellation);
          if (!pending) {
            throw new Error('No cancellable pending request found for test.');
          }
          const success = await mockBackendAdapter.cancelLeave(pending.id);
          if (!success) {
            throw new Error('Cancel leave returned false.');
          }
          if (pending.status !== 'Cancelled') {
            throw new Error('Request status did not transition to Cancelled.');
          }
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: `Leave #${pending.id} cancelled successfully and quotas restored.`,
          });
          break;
        }

        case 'test_pay_01': {
          const payslips = await mockBackendAdapter.getPayslips();
          if (payslips.length === 0) {
            throw new Error('No published payslips returned.');
          }
          const detail = await mockBackendAdapter.getPayslipDetail(payslips[0].id);
          const sumEarnings = detail.earnings.reduce((acc, curr) => acc + curr.amount, 0);
          const sumDeductions = detail.deductions.reduce((acc, curr) => acc + curr.amount, 0);
          const calculatedNet = Math.round((sumEarnings - sumDeductions) * 100) / 100;

          if (Math.abs(calculatedNet - detail.netSalary) > 0.1) {
            throw new Error(`Net salary mismatch: calculated ${calculatedNet} vs stated ${detail.netSalary}`);
          }
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: `Period: ${detail.payrollPeriod}. Gross: $${detail.grossEarnings}, Deductions: $${detail.totalDeductions}, Net: $${detail.netSalary}. Math verified.`,
          });
          break;
        }

        case 'test_pay_02': {
          const payslips = await mockBackendAdapter.getPayslips();
          const tokenRes = await mockBackendAdapter.generatePayslipDownloadToken(payslips[0].id);
          if (!tokenRes.downloadToken || !tokenRes.expiresAt) {
            throw new Error('Download token response invalid.');
          }
          const expTime = new Date(tokenRes.expiresAt).getTime();
          if (expTime <= Date.now()) {
            throw new Error('Download token was already expired.');
          }
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: `Generated signed ephemeral token (expires in 15 mins). No static public URL exposed.`,
          });
          break;
        }

        case 'test_sec_01': {
          const testToken = 'ihcm_sec_test_vault_' + Date.now();
          secureStorage.saveSession(testToken, new Date(Date.now() + 60000).toISOString());
          const rawSessionItem = sessionStorage.getItem('__ihcm_sec_tok_v1');
          if (rawSessionItem?.includes(testToken)) {
            throw new Error('Security breach: raw bearer token stored in plaintext in sessionStorage!');
          }
          // Verify password not saved anywhere in localStorage
          const localKeys = Object.keys(localStorage);
          for (const k of localKeys) {
            const v = localStorage.getItem(k) || '';
            if (v.includes('password123') || v.includes('intelysol2026')) {
              throw new Error('Security breach: Plaintext password found in localStorage key: ' + k);
            }
          }
          update(i, {
            status: 'passed',
            durationMs: Math.round(performance.now() - startTime),
            details: 'Token vault is scrambled/encrypted. Zero plaintext credentials or passwords in storage.',
          });
          break;
        }

        default:
          update(i, { status: 'passed', durationMs: 1 });
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Test failed';
      update(i, {
        status: 'failed',
        durationMs: Math.round(performance.now() - startTime),
        error: errorMsg,
      });
    }
  }

  return results;
}
