export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';

export type LeaveDurationType = 'Full Day' | 'First Half' | 'Second Half';

export interface LeaveType {
  id: string;
  code: string;
  name: string;
  color: string;
  description: string;
  requiresDocument: boolean;
  maxConsecutiveDays: number;
}

export interface LeaveBalance {
  leaveTypeId: string;
  leaveTypeName: string;
  leaveTypeCode: string;
  totalAllocated: number;
  consumed: number;
  pending: number;
  remaining: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveTypeId: string;
  leaveTypeName: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  durationDays: number;
  durationType: LeaveDurationType;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewerRemarks?: string;
  attachmentName?: string;
  isEligibleForCancellation: boolean;
}

export interface ApplyLeavePayload {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  durationType: LeaveDurationType;
  reason: string;
  attachmentName?: string;
  idempotencyKey: string;
}
