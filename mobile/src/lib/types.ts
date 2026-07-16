export type URLStatus = 'PENDING' | 'UP' | 'DOWN' | 'WARN';

export interface URLItem {
  id: number;
  web_address: string;
  name: string;
  status: URLStatus;
  created_at: string;
  last_pinged_at?: string | null;
  check_type?: string | null;
  check_interval_seconds: number;
  ping_interval_seconds: number;
}

export interface Incident {
  id: number;
  url_id: number;
  url_name: string;
  url_address: string;
  started_at: string;
  resolved_at: string | null;
  check_type: string;
  severity: 'DOWN' | 'WARN';
  acknowledged_at: string | null;
  note: string | null;
  duration_minutes: number | null;
}

export interface UserRead {
  id: number;
  full_name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}
