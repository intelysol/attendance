import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  ChevronRight,
  Upload,
  Calendar,
  X,
  Info,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../services/apiClient';
import { ApplyLeavePayload, LeaveBalance, LeaveRequest, LeaveType } from '../../types/leave';
import { generateUUID } from '../../services/geolocationService';

export const LeaveScreen: React.FC = () => {
  const { showToast, activeModal, openModal, closeModal } = useApp();

  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'CANCELLED'>('ALL');
  const [loading, setLoading] = useState(true);

  // Form state
  const [leaveTypeId, setLeaveTypeId] = useState('lt_annual');
  const [startDate, setStartDate] = useState('2026-11-04');
  const [endDate, setEndDate] = useState('2026-11-04');
  const [durationType, setDurationType] = useState<'Full Day' | 'First Half' | 'Second Half'>('Full Day');
  const [reason, setReason] = useState('');
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Detail Modal
  const [viewingRequest, setViewingRequest] = useState<LeaveRequest | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      const [balList, reqList] = await Promise.all([
        apiClient.getLeaveBalances(),
        apiClient.getLeaveRequests(),
      ]);
      setBalances(balList);
      setRequests(reqList);
    } catch (err: unknown) {
      showToast('error', 'Leave Sync Failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveData();
  }, []);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!startDate || !endDate) {
      setFormError('Please select both start and end dates.');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setFormError('Start date cannot be after end date.');
      return;
    }
    if (!reason || reason.trim().length < 5) {
      setFormError('Please provide a specific reason (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const payload: ApplyLeavePayload = {
        leaveTypeId,
        startDate,
        endDate,
        durationType,
        reason: reason.trim(),
        attachmentName: attachmentName || undefined,
        idempotencyKey: generateUUID(),
      };

      await apiClient.applyLeave(payload);
      showToast('success', 'Leave Submitted', 'Your leave request has been submitted for managerial approval.');
      closeModal();
      setReason('');
      setAttachmentName('');
      await loadLeaveData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply leave.';
      setFormError(msg);
      showToast('error', 'Application Rejected', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (req: LeaveRequest) => {
    if (!req.isEligibleForCancellation) {
      showToast('error', 'Ineligible', 'Only pending or eligible leave requests can be cancelled.');
      return;
    }

    setCancellingId(req.id);
    try {
      await apiClient.cancelLeave(req.id);
      showToast('success', 'Leave Cancelled', 'Leave request cancelled and quota balance restored.');
      setViewingRequest(null);
      await loadLeaveData();
    } catch (err: unknown) {
      showToast('error', 'Cancellation Failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setCancellingId(null);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'PENDING') return r.status === 'Pending';
    if (selectedFilter === 'APPROVED') return r.status === 'Approved';
    if (selectedFilter === 'CANCELLED') return r.status === 'Cancelled' || r.status === 'Rejected';
    return true;
  });

  return (
    <div className="flex-1 p-4 space-y-4 pb-8">
      {/* Top Banner with Apply Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900">Leave Management</h2>
          <p className="text-xs text-slate-500">Balances, applications &amp; approvals</p>
        </div>
        <button
          onClick={() => openModal('apply-leave')}
          className="min-h-[40px] px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 active:scale-95 transition-all"
        >
          <Plus size={16} />
          <span>Apply Leave</span>
        </button>
      </div>

      {/* Leave Balance Quotas Carousel */}
      <div className="grid grid-cols-2 gap-2">
        {balances.map((b) => (
          <div
            key={b.leaveTypeId}
            className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {b.leaveTypeCode}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                Allocated: {b.totalAllocated}d
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800 truncate">
                {b.leaveTypeName}
              </p>
              <p className="text-2xl font-extrabold text-slate-900 mt-0.5 tabular-nums">
                {b.remaining}
                <span className="text-xs font-normal text-slate-500 ml-1">days left</span>
              </p>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
              <span>Used: {b.consumed}d</span>
              <span>Pending: {b.pending}d</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-medium">
        {[
          { id: 'ALL', label: 'All Requests' },
          { id: 'PENDING', label: 'Pending' },
          { id: 'APPROVED', label: 'Approved' },
          { id: 'CANCELLED', label: 'Cancelled / Rejected' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all border ${
              selectedFilter === tab.id
                ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leave Request List */}
      <div className="space-y-2">
        {filteredRequests.length > 0 ? (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              onClick={() => setViewingRequest(req)}
              className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-300 cursor-pointer transition-all space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900">
                  {req.leaveTypeName}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    req.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : req.status === 'Pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {req.status}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  <span className="font-semibold text-slate-800">
                    {req.startDate} {req.startDate !== req.endDate ? `to ${req.endDate}` : ''}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-slate-500">
                  {req.durationDays} day(s) · {req.durationType}
                </span>
              </div>

              <p className="text-[11px] text-slate-500 line-clamp-1 italic">
                "{req.reason}"
              </p>
            </div>
          ))
        ) : (
          <div className="bg-white p-8 rounded-2xl border border-slate-200/80 text-center space-y-2">
            <FileText size={28} className="mx-auto text-slate-300" />
            <p className="text-xs text-slate-600 font-semibold">No leave applications found</p>
            <p className="text-[11px] text-slate-400">
              You haven't submitted any {selectedFilter !== 'ALL' ? selectedFilter.toLowerCase() : ''} leave requests.
            </p>
          </div>
        )}
      </div>

      {/* Apply Leave Modal Drawer */}
      {activeModal === 'apply-leave' && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Apply for Leave</h3>
              <button
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-start gap-2">
                <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                <span className="leading-tight">{formError}</span>
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="space-y-3.5">
              {/* Leave Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Leave Type
                </label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                >
                  <option value="lt_annual">Annual Paid Leave (12d available)</option>
                  <option value="lt_sick">Medical / Sick Leave (10d available)</option>
                  <option value="lt_casual">Casual / Urgent Leave (2d available)</option>
                  <option value="lt_comp">Compensatory Off (3d available)</option>
                </select>
              </div>

              {/* Date pickers */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-amber-600"
                  />
                </div>
              </div>

              {/* Duration Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['Full Day', 'First Half', 'Second Half'] as const).map((dtype) => (
                    <button
                      key={dtype}
                      type="button"
                      onClick={() => setDurationType(dtype)}
                      className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                        durationType === dtype
                          ? 'bg-amber-600 text-white border-amber-600 font-semibold shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {dtype}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Leave
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe reason for leave request..."
                  rows={3}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-600"
                />
              </div>

              {/* Attachment Simulation */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supporting Document (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setAttachmentName('medical_cert_clinic_doc.pdf')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs rounded-xl flex items-center gap-1.5"
                  >
                    <Upload size={14} />
                    <span>Attach Prescription / Proof</span>
                  </button>
                  {attachmentName && (
                    <span className="text-[11px] text-emerald-700 font-medium truncate">
                      {attachmentName}
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[46px] bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md shadow-amber-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {submitting ? 'Submitting Leave...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Leave Detail Modal */}
      {viewingRequest && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Application #{viewingRequest.id}
              </span>
              <button
                onClick={() => setViewingRequest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900">
                  {viewingRequest.leaveTypeName}
                </h4>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    viewingRequest.status === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : viewingRequest.status === 'Pending'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {viewingRequest.status}
                </span>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Period:</span>
                  <span className="font-semibold text-slate-900">
                    {viewingRequest.startDate} to {viewingRequest.endDate}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Duration:</span>
                  <span className="font-semibold text-slate-900">
                    {viewingRequest.durationDays} day(s) ({viewingRequest.durationType})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Applied On:</span>
                  <span className="font-semibold text-slate-900">
                    {new Date(viewingRequest.appliedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase">Reason</p>
                <p className="text-xs text-slate-800 mt-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  {viewingRequest.reason}
                </p>
              </div>

              {viewingRequest.reviewerRemarks && (
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Manager Remarks</p>
                  <p className="text-xs text-slate-800 mt-1 bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
                    "{viewingRequest.reviewerRemarks}" — <span className="font-semibold">{viewingRequest.reviewedBy}</span>
                  </p>
                </div>
              )}

              {viewingRequest.isEligibleForCancellation && (
                <button
                  onClick={() => handleCancelLeave(viewingRequest)}
                  disabled={cancellingId === viewingRequest.id}
                  className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-semibold transition-colors mt-2"
                >
                  {cancellingId === viewingRequest.id ? 'Cancelling...' : 'Cancel Leave Request'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
