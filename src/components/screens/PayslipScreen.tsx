import React, { useState, useEffect } from 'react';
import {
  Receipt,
  Download,
  Calendar,
  Lock,
  ChevronRight,
  ShieldCheck,
  Building,
  CheckCircle,
  Eye,
  X,
  Printer,
  FileCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { apiClient } from '../../services/apiClient';
import { PayslipDetail, PayslipSummary } from '../../types/payslip';

export const PayslipScreen: React.FC = () => {
  const { showToast } = useApp();

  const [payslips, setPayslips] = useState<PayslipSummary[]>([]);
  const [selectedPayslip, setSelectedPayslip] = useState<PayslipDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    async function loadPayslips() {
      try {
        setLoading(true);
        const list = await apiClient.getPayslips();
        setPayslips(list);
      } catch (err: unknown) {
        showToast('error', 'Payslip Fetch Failed', err instanceof Error ? err.message : 'Error');
      } finally {
        setLoading(false);
      }
    }
    loadPayslips();
  }, []);

  const handleOpenDetail = async (id: string) => {
    try {
      const detail = await apiClient.getPayslipDetail(id);
      setSelectedPayslip(detail);
    } catch (err: unknown) {
      showToast('error', 'Unauthorized Access', err instanceof Error ? err.message : 'Error');
    }
  };

  const handleDownload = async (id: string) => {
    setDownloading(true);
    try {
      // Ephemeral token simulation
      const { downloadToken, expiresAt } = await apiClient.getPayslipDownloadToken(id);
      showToast(
        'success',
        'Signed Download Token Issued',
        `Secure token: ${downloadToken.substring(0, 16)}... Valid for 15 minutes.`
      );
      // Simulate browser trigger
      setTimeout(() => {
        window.print();
      }, 500);
    } catch (err: unknown) {
      showToast('error', 'Download Failed', err instanceof Error ? err.message : 'Error');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex-1 p-4 space-y-4 pb-8">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-slate-900">Payslip Vault</h2>
        <p className="text-xs text-slate-500">
          Authorized salary statements &amp; tax withholdings
        </p>
      </div>

      {/* Security Privacy Notice */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
        <ShieldCheck size={18} className="text-amber-700 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          Payroll data is encrypted in transit and at rest. Documents are accessed only via authorized ephemeral signed tokens.
        </p>
      </div>

      {/* Payslip List */}
      <div className="space-y-2.5">
        {payslips.map((ps) => (
          <div
            key={ps.id}
            onClick={() => handleOpenDetail(ps.id)}
            className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-400 cursor-pointer transition-all space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Receipt size={17} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    {ps.payrollPeriod}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    Published: {ps.publicationDate}
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {ps.status}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50 rounded-xl px-3 border border-slate-100 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Gross</span>
                <span className="text-xs font-bold text-slate-700 tabular-nums">
                  ${ps.grossEarnings.toLocaleString()}
                </span>
              </div>
              <div className="border-x border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Deductions</span>
                <span className="text-xs font-bold text-red-600 tabular-nums">
                  -${ps.totalDeductions.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Net Salary</span>
                <span className="text-xs font-extrabold text-emerald-700 tabular-nums">
                  ${ps.netSalary.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-amber-700 font-semibold pt-1">
              <span>View Salary Breakdown</span>
              <ChevronRight size={14} />
            </div>
          </div>
        ))}
      </div>

      {/* Payslip Full Detail / Breakdown Modal */}
      {selectedPayslip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileCheck size={20} className="text-amber-600" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Payslip — {selectedPayslip.payrollPeriod}
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ID: {selectedPayslip.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPayslip(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Employee & Bank Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div>
                <span className="text-[10px] text-slate-400 block">Employee Code</span>
                <span className="font-semibold text-slate-800">{selectedPayslip.employeeCode}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Designation</span>
                <span className="font-semibold text-slate-800 truncate block">
                  {selectedPayslip.designation}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Bank Account</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {selectedPayslip.bankAccountNumberMasked}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Tax ID / PAN</span>
                <span className="font-semibold text-slate-800 tabular-nums">
                  {selectedPayslip.panNumberMasked}
                </span>
              </div>
            </div>

            {/* Working Days */}
            <div className="flex items-center justify-between text-xs px-1 text-slate-600">
              <span>Working Days: <strong className="text-slate-900 tabular-nums">{selectedPayslip.totalWorkingDays}</strong></span>
              <span>Paid Days: <strong className="text-emerald-700 tabular-nums">{selectedPayslip.paidDays}</strong></span>
              <span>LOP: <strong className="text-slate-900 tabular-nums">{selectedPayslip.lopDays}</strong></span>
            </div>

            {/* Earnings & Deductions Tables */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Earnings */}
              <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider block">
                  Earnings
                </span>
                <div className="space-y-1.5">
                  {selectedPayslip.earnings.map((e, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
                      <span>{e.name}</span>
                      <span className="font-semibold tabular-nums">${e.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-emerald-200 flex justify-between font-bold text-emerald-900 text-xs">
                    <span>Total Gross</span>
                    <span className="tabular-nums">${selectedPayslip.grossEarnings.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div className="bg-red-50/40 border border-red-100 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-red-900 uppercase tracking-wider block">
                  Deductions
                </span>
                <div className="space-y-1.5">
                  {selectedPayslip.deductions.map((d, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700 text-[11px]">
                      <span>{d.name}</span>
                      <span className="font-semibold text-red-600 tabular-nums">-${d.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="pt-2 border-t border-red-200 flex justify-between font-bold text-red-900 text-xs">
                    <span>Total Deductions</span>
                    <span className="tabular-nums text-red-700">-${selectedPayslip.totalDeductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight */}
            <div className="p-3.5 bg-slate-900 text-white rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">
                  Net Disbursed Salary
                </span>
                <p className="text-xl font-black text-amber-400 mt-0.5 tabular-nums">
                  ${selectedPayslip.netSalary.toLocaleString()} {selectedPayslip.currency}
                </p>
              </div>
              <span className="text-xs text-slate-300">
                Disbursed to Chase
              </span>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => handleDownload(selectedPayslip.id)}
                disabled={downloading}
                className="flex-1 min-h-[44px] bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <Download size={15} />
                <span>{downloading ? 'Generating Signed Token...' : 'Download Signed PDF'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="min-h-[44px] px-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5"
                title="Print Slip"
              >
                <Printer size={15} />
                <span>Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
