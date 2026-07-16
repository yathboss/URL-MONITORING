from datetime import datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field, HttpUrl, model_validator


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str | None = None

class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str

class UserRead(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str = "viewer"
    created_at: datetime

CHECK_TYPES = {"HTTP", "SSL_EXPIRY", "TTFB", "KEYWORD", "DOWNTIME_DURATION", "ERROR_RATE"}


def parse_check_types(value: str) -> list[str]:
    checks = [item.strip().upper() for item in value.split(",") if item.strip()]
    return checks or ["HTTP"]


class URLCreate(BaseModel):
    web_address: HttpUrl
    name: str = Field(..., min_length=1, max_length=100)
    check_type: str = "HTTP"
    keyword_to_find: str | None = None
    check_interval_seconds: int = 30
    ping_interval_seconds: int = 30

    @model_validator(mode="after")
    def validate_keyword_check(self) -> "URLCreate":
        checks = parse_check_types(self.check_type)
        unknown_checks = [check for check in checks if check not in CHECK_TYPES]
        if unknown_checks:
            raise ValueError(f"Unknown check_type: {', '.join(unknown_checks)}")
        self.check_type = ",".join(checks)

        if "KEYWORD" in checks and not self.keyword_to_find:
            raise ValueError("keyword_to_find required for KEYWORD checks")
        return self


class URLRead(BaseModel):
    id: int
    web_address: str
    name: str
    status: str = "PENDING"
    created_at: datetime
    last_pinged_at: datetime | None = None
    check_type: str = "HTTP"
    keyword_to_find: str | None = None
    check_interval_seconds: int = 30
    ping_interval_seconds: int = 30
    owner_email: str | None = None
    is_public: bool = False


class URLUpdate(BaseModel):
    web_address: HttpUrl | None = None
    name: str | None = Field(None, min_length=1, max_length=100)
    ping_interval_seconds: int | None = None
    is_public: bool | None = None


class AdminUserOverview(UserRead):
    url_count: int


class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None
    role: str | None = None


class URLDetail(URLRead):
    recent_pings: list["PingHistoryRead"] = []


class PingHistoryRead(BaseModel):
    id: int
    url_id: int
    checked_at: datetime
    response_time_ms: int | None
    status_code: int | None
    is_up: bool
    check_type: str | None = None
    extra_data: dict[str, Any] | None = None


class URLExtraData(BaseModel):
    check_type: str
    extra_data: dict[str, Any]
    checked_at: datetime


class IncidentRead(BaseModel):
    id: int
    url_id: int
    url_name: str
    url_address: str
    started_at: datetime
    resolved_at: datetime | None
    check_type: str
    severity: str
    acknowledged_at: datetime | None
    note: str | None
    duration_minutes: int | None


class IncidentUpdate(BaseModel):
    acknowledged_at: datetime | None = None
    note: str | None = None


def _clean_webhook_headers(headers: dict[str, str] | None) -> dict[str, str] | None:
    """Strip blanks and reject header names/values that would break the HTTP request."""
    if headers is None:
        return None
    cleaned: dict[str, str] = {}
    for key, value in headers.items():
        key = key.strip()
        value = value.strip()
        if not key:
            continue
        if any(c in key for c in " \r\n:") or "\r" in value or "\n" in value:
            raise ValueError(f"invalid header name or value: {key!r}")
        cleaned[key] = value
    if len(cleaned) > 20:
        raise ValueError("too many custom headers (max 20)")
    return cleaned


class AlertChannelCreate(BaseModel):
    channel_type: str = Field(..., pattern="^(EMAIL|WEBHOOK|SLACK)$")
    name: str = Field(..., min_length=1, max_length=100)
    destination: str = Field(..., min_length=1)
    headers: dict[str, str] = Field(default_factory=dict)
    http_method: str = Field("POST", pattern="^(POST|GET|PUT|PATCH)$")
    notify_on_down: bool = True
    notify_on_recovery: bool = True

    @model_validator(mode="after")
    def validate_destination(self) -> "AlertChannelCreate":
        dest = self.destination.strip()
        if self.channel_type == "EMAIL":
            if "@" not in dest or "." not in dest.split("@")[-1]:
                raise ValueError("destination must be a valid email address")
        elif self.channel_type == "SLACK":
            if not dest.startswith("https://") or "hooks.slack.com" not in dest.lower():
                raise ValueError(
                    "destination must be a Slack incoming webhook URL (https://hooks.slack.com/...)"
                )
            # Slack webhooks authenticate via the URL itself and always take POST.
            self.headers = {}
            self.http_method = "POST"
        elif self.channel_type == "WEBHOOK":
            if not (dest.startswith("http://") or dest.startswith("https://")):
                raise ValueError("destination must be an http(s) webhook URL")
        self.destination = dest
        self.headers = _clean_webhook_headers(self.headers) or {}
        return self


class AlertChannelUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    destination: str | None = Field(None, min_length=1)
    headers: dict[str, str] | None = None
    http_method: str | None = Field(None, pattern="^(POST|GET|PUT|PATCH)$")
    notify_on_down: bool | None = None
    notify_on_recovery: bool | None = None
    is_enabled: bool | None = None

    @model_validator(mode="after")
    def validate_headers(self) -> "AlertChannelUpdate":
        self.headers = _clean_webhook_headers(self.headers)
        return self


class AlertChannelRead(BaseModel):
    id: int
    channel_type: str
    name: str
    destination: str
    headers: dict[str, str] = Field(default_factory=dict)
    http_method: str = "POST"
    notify_on_down: bool
    notify_on_recovery: bool
    is_enabled: bool
    created_at: datetime
    last_delivery_status: str | None = None
    last_delivery_at: datetime | None = None


class AlertDeliveryRead(BaseModel):
    id: int
    channel_id: int | None
    channel_name: str | None = None
    url_name: str | None = None
    event_type: str
    status: str
    error: str | None
    created_at: datetime


class MaintenanceWindowCreate(BaseModel):
    url_id: int
    title: str
    message: str | None = None
    starts_at: datetime
    ends_at: datetime


class MaintenanceWindowCreateList(BaseModel):
    url_ids: list[int]
    title: str
    message: str | None = None
    starts_at: datetime
    ends_at: datetime


class MaintenanceWindowRead(MaintenanceWindowCreate):
    id: int


class PublicMonitorRead(BaseModel):
    id: int
    name: str
    status: str
    uptime_90d: float
    last_checked_at: datetime | None
    open_incident: IncidentRead | None = None


class PublicStatusRead(BaseModel):
    monitors: list[PublicMonitorRead]
    maintenance_windows: list[MaintenanceWindowRead]


class MonitorMetrics(BaseModel):
    monitor_id: int
    range: str
    uptime_pct: float
    error_rate_pct: float
    avg_response_time_ms: float | None
    incident_count: int
    total_downtime_minutes: int
    current_status: str


class BugReportCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1, max_length=5000)
    severity: str = Field("MEDIUM", pattern="^(LOW|MEDIUM|HIGH)$")
    area: str | None = Field(None, max_length=50)


class BugReportUpdate(BaseModel):
    status: str = Field(..., pattern="^(OPEN|IN_PROGRESS|RESOLVED)$")


class BugReportRead(BaseModel):
    id: int
    title: str
    description: str
    severity: str
    area: str | None
    status: str
    created_at: datetime
    updated_at: datetime
    reporter_name: str | None = None
    reporter_email: str | None = None


class ExecutiveReportMonitor(BaseModel):
    monitor_id: int
    name: str
    web_address: str
    uptime_pct: float
    error_rate_pct: float
    avg_response_time_ms: float | None
    incident_count: int
    total_downtime_minutes: int
    current_status: str
    total_pings: int


class ExecutiveReportWorstPerformer(BaseModel):
    monitor_id: int
    name: str
    uptime_pct: float
    total_downtime_minutes: int


class ExecutiveReportSummary(BaseModel):
    overall_uptime_pct: float
    avg_response_time_ms: float | None
    total_incidents: int
    total_downtime_minutes: int
    monitor_count: int
    worst_performer: ExecutiveReportWorstPerformer | None = None


class ExecutiveReport(BaseModel):
    range: str
    generated_at: datetime
    period_start: datetime
    period_end: datetime
    summary: ExecutiveReportSummary
    monitors: list[ExecutiveReportMonitor]


class AnalyticsBucket(BaseModel):
    t: datetime
    total: int
    up: int
    avg_ms: float | None


class AnalyticsOverviewMonitor(ExecutiveReportMonitor):
    buckets: list[AnalyticsBucket]


class AnalyticsOverview(BaseModel):
    range: str
    generated_at: datetime
    period_start: datetime
    period_end: datetime
    bucket_minutes: int
    summary: ExecutiveReportSummary
    monitors: list[AnalyticsOverviewMonitor]
