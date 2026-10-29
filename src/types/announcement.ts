export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  priority: 'Normal' | 'High' | 'Urgent';
  targetDepartment?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  dayOfWeek: string;
  isOptional: boolean;
  applicableBranches: string[];
}

export interface HRNotification {
  id: string;
  title: string;
  message: string;
  type: 'attendance' | 'leave' | 'payroll' | 'announcement';
  timestamp: string;
  isRead: boolean;
  actionRoute?: string;
}
