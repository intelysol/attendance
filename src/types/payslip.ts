export interface EarningItem {
  name: string;
  amount: number;
}

export interface DeductionItem {
  name: string;
  amount: number;
}

export interface PayslipSummary {
  id: string;
  payrollPeriod: string; // e.g. "October 2026"
  month: number;
  year: number;
  grossEarnings: number;
  totalDeductions: number;
  netSalary: number;
  currency: string;
  publicationDate: string;
  isPublished: boolean;
  status: 'Published' | 'Draft';
}

export interface PayslipDetail extends PayslipSummary {
  employeeCode: string;
  employeeName: string;
  designation: string;
  department: string;
  branchName: string;
  panNumberMasked: string;
  bankAccountNumberMasked: string;
  bankName: string;
  totalWorkingDays: number;
  paidDays: number;
  lopDays: number;
  earnings: EarningItem[];
  deductions: DeductionItem[];
  downloadTokenExpiresAt?: string;
}
