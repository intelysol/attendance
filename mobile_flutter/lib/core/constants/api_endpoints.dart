class ApiEndpoints {
  static const String defaultBaseUrl = 'https://hcm-api.example.com/api/v1';

  // Auth
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String profile = '/auth/me';
  static const String changePassword = '/auth/change-password';

  // Attendance
  static const String todayAttendance = '/attendance/today';
  static const String punch = '/attendance/punch';
  static const String attendanceHistory = '/attendance/history';

  // Leave
  static const String leaveBalances = '/leaves/balances';
  static const String leaveRequests = '/leaves/requests';
  static const String applyLeave = '/leaves/apply';
  static String cancelLeave(String id) => '/leaves/cancel/$id';

  // Payslips
  static const String payslips = '/payslips';
  static String payslipDetail(String id) => '/payslips/$id';
  static String payslipDownloadToken(String id) => '/payslips/$id/download-token';

  // Company
  static const String announcements = '/company/announcements';
  static const String holidays = '/company/holidays';
  static const String notifications = '/company/notifications';
}
