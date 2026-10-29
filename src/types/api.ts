export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
  timestamp: string;
}

export interface ApiConfig {
  baseUrl: string;
  useMockAdapter: boolean;
  timeoutMs: number;
  environment: 'development' | 'staging' | 'production';
  diagnosticsEnabled: boolean;
}
