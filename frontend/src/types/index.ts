export type URLStatus = 'UP' | 'DOWN' | 'WARN' | 'PENDING';

export type CheckType = 'HTTP' | 'SSL_EXPIRY' | 'TTFB' | 'KEYWORD' | 'DOWNTIME_DURATION' | 'ERROR_RATE';

export interface URLItem {
  id: number;
  web_address: string;
  name: string;
  status: 'PENDING' | 'UP' | 'DOWN' | 'WARN';
  created_at: string;
  last_pinged_at?: string | null;
  check_type?: CheckType | null;
  keyword_to_find?: string | null;
  check_interval_seconds: number;
  ping_interval_seconds: number;
  owner_email?: string | null;
  is_public: boolean;
}

export interface AdminUserOverview extends UserRead {
  url_count: number;
}

export interface UserUpdate {
  full_name?: string;
  email?: string;
  role?: string;
}

export interface PingResult {
  url_id: number;
  status: URLStatus;
  latency_ms: number | null;
  status_code?: number | null;
  checked_at: string;
  check_type?: string;
  extra_data?: Record<string, unknown>;
}

export interface AddURLPayload {
  web_address: string;
  name: string;
  check_type?: string;
  keyword_to_find?: string;
  check_interval_seconds?: number;
  ping_interval_seconds?: number;
}

export interface URLDetail extends URLItem {
  recent_pings: PingHistoryRead[];
}

export interface PingHistoryRead {
  id: number;
  url_id: number;
  checked_at: string;
  response_time_ms: number | null;
  status_code: number | null;
  is_up: boolean;
  check_type?: CheckType | null;
  extra_data?: Record<string, unknown> | null;
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
  role: 'admin' | 'viewer';
  created_at: string;
}

export type AlertChannelType = 'EMAIL' | 'WEBHOOK' | 'SLACK';
export type WebhookMethod = 'POST' | 'GET' | 'PUT' | 'PATCH';

export type ReportRange = '24h' | '7d' | '30d' | '90d';

export type BugSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type BugStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';

export interface BugReport {
  id: number;
  title: string;
  description: string;
  severity: BugSeverity;
  area: string | null;
  status: BugStatus;
  created_at: string;
  updated_at: string;
  reporter_name: string | null;
  reporter_email: string | null;
}

export interface BugReportPayload {
  title: string;
  description: string;
  severity: BugSeverity;
  area?: string | null;
}

export interface ExecutiveReportMonitor {
  monitor_id: number;
  name: string;
  web_address: string;
  uptime_pct: number;
  error_rate_pct: number;
  avg_response_time_ms: number | null;
  incident_count: number;
  total_downtime_minutes: number;
  current_status: string;
  total_pings: number;
}

export interface ExecutiveReportWorstPerformer {
  monitor_id: number;
  name: string;
  uptime_pct: number;
  total_downtime_minutes: number;
}

export interface ExecutiveReportSummary {
  overall_uptime_pct: number;
  avg_response_time_ms: number | null;
  total_incidents: number;
  total_downtime_minutes: number;
  monitor_count: number;
  worst_performer: ExecutiveReportWorstPerformer | null;
}

export interface ExecutiveReport {
  range: ReportRange;
  generated_at: string;
  period_start: string;
  period_end: string;
  summary: ExecutiveReportSummary;
  monitors: ExecutiveReportMonitor[];
}

export interface AnalyticsBucket {
  t: string;
  total: number;
  up: number;
  avg_ms: number | null;
}

export interface AnalyticsOverviewMonitor extends ExecutiveReportMonitor {
  buckets: AnalyticsBucket[];
}

export interface AnalyticsOverview {
  range: ReportRange;
  generated_at: string;
  period_start: string;
  period_end: string;
  bucket_minutes: number;
  summary: ExecutiveReportSummary;
  monitors: AnalyticsOverviewMonitor[];
}

export interface AlertChannel {
  id: number;
  channel_type: AlertChannelType;
  name: string;
  destination: string;
  headers: Record<string, string>;
  http_method: WebhookMethod;
  notify_on_down: boolean;
  notify_on_recovery: boolean;
  is_enabled: boolean;
  created_at: string;
  last_delivery_status: 'SENT' | 'FAILED' | null;
  last_delivery_at: string | null;
}

export interface AlertChannelPayload {
  channel_type: AlertChannelType;
  name: string;
  destination: string;
  headers: Record<string, string>;
  http_method: WebhookMethod;
  notify_on_down: boolean;
  notify_on_recovery: boolean;
}

export interface AlertChannelUpdate {
  name?: string;
  destination?: string;
  headers?: Record<string, string>;
  http_method?: WebhookMethod;
  notify_on_down?: boolean;
  notify_on_recovery?: boolean;
  is_enabled?: boolean;
}

export interface AlertDelivery {
  id: number;
  channel_id: number | null;
  channel_name: string | null;
  url_name: string | null;
  event_type: 'DOWN' | 'UP' | 'TEST';
  status: 'SENT' | 'FAILED';
  error: string | null;
  created_at: string;
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

export interface MaintenanceWindow {
  id: number;
  url_id: number;
  title: string;
  message?: string | null;
  starts_at: string;
  ends_at: string;
}

export interface PublicMonitor {
  id: number;
  name: string;
  status: URLStatus;
  uptime_90d: number;
  last_checked_at: string | null;
  open_incident: Incident | null;
}

export interface PublicStatus {
  monitors: PublicMonitor[];
  maintenance_windows: MaintenanceWindow[];
}
