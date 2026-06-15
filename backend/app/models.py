from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl


class URLCreate(BaseModel):
    web_address: HttpUrl
    name: str = Field(..., min_length=1, max_length=100)
    ping_interval_seconds: int = 30


class URLUpdate(BaseModel):
    web_address: HttpUrl | None = None
    name: str | None = Field(None, min_length=1, max_length=100)
    ping_interval_seconds: int | None = None


class URLRead(BaseModel):
    id: int
    web_address: str
    name: str
    status: str = "PENDING"
    ping_interval_seconds: int
    created_at: datetime


class URLDetail(URLRead):
    recent_pings: list["PingHistoryRead"] = []


class PingHistoryRead(BaseModel):
    id: int
    url_id: int
    checked_at: datetime
    response_time_ms: int | None
    status_code: int | None
    is_up: bool
