"""Alert delivery helpers (email + webhook).

These are pure, synchronous functions used by the Celery worker. Each raises on
failure so the caller can record a FAILED delivery row with the error text.
"""
import smtplib
from datetime import datetime
from email.message import EmailMessage
from typing import Any

import httpx

from app.config import settings


class NotConfiguredError(RuntimeError):
    """Raised when a channel cannot be delivered because config is missing."""


def send_email(to: str, subject: str, text: str, html: str | None = None) -> None:
    if not settings.smtp_host or not settings.smtp_user or not settings.smtp_password:
        raise NotConfiguredError(
            "SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASSWORD."
        )

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.smtp_from or settings.smtp_user
    message["To"] = to
    message.set_content(text)
    if html:
        message.add_alternative(html, subtype="html")

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as server:
        if settings.smtp_use_tls:
            server.starttls()
        server.login(settings.smtp_user, settings.smtp_password)
        server.send_message(message)


WEBHOOK_METHODS = ("POST", "GET", "PUT", "PATCH")


def send_webhook(
    url: str,
    text: str,
    payload: dict[str, Any],
    headers: dict[str, str] | None = None,
    method: str = "POST",
) -> None:
    """Send an alert to a webhook, auto-formatting for Discord/Slack/generic.

    `headers` are user-configured key/value pairs (e.g. Authorization, X-API-Key)
    attached to the request so the receiving server can authenticate it.
    `method` is the HTTP request type; GET carries the alert as query params
    since GET requests have no body.
    """
    method = (method or "POST").upper()
    if method not in WEBHOOK_METHODS:
        raise ValueError(f"Unsupported webhook method {method}")

    lower = url.lower()
    if "discord.com/api/webhooks" in lower or "discordapp.com/api/webhooks" in lower:
        body: dict[str, Any] = {"content": text}
    elif "hooks.slack.com" in lower:
        body = {"text": text}
    else:
        body = {"text": text, **payload}

    if method == "GET":
        params = {k: str(v) for k, v in body.items() if v is not None}
        response = httpx.get(url, params=params, headers=headers or {}, timeout=10)
    else:
        response = httpx.request(method, url, json=body, headers=headers or {}, timeout=10)
    response.raise_for_status()


SLACK_COLORS = {"DOWN": "#E24B4A", "UP": "#2EB67D", "TEST": "#3B82F6"}


def build_slack_blocks(
    event_type: str,
    name: str,
    address: str,
    severity: str | None = None,
    started_at: datetime | None = None,
    duration_min: int | None = None,
) -> dict[str, Any]:
    """Build a rich Slack Block Kit payload for an alert event.

    Blocks live inside `attachments` (not top-level) so Slack renders the
    colored accent bar; the top-level `text` is the plain fallback used in
    OS/mobile notifications.
    """
    if event_type == "DOWN":
        emoji, headline = "🔴", f"{name} is DOWN"
    elif event_type == "UP":
        emoji, headline = "🟢", f"{name} has recovered"
    else:  # TEST
        emoji, headline = "🔔", f"Test alert for {name}"

    when = (started_at or datetime.utcnow()).strftime("%Y-%m-%d %H:%M UTC")
    fields: list[dict[str, str]] = [
        {"type": "mrkdwn", "text": f"*URL*\n<{address}|{address}>"},
        {"type": "mrkdwn", "text": f"*Status*\n{event_type}"},
    ]
    if event_type == "DOWN" and severity:
        fields.append({"type": "mrkdwn", "text": f"*Severity*\n{severity}"})
    fields.append({"type": "mrkdwn", "text": f"*Time*\n{when}"})
    if event_type == "UP" and duration_min is not None:
        fields.append({"type": "mrkdwn", "text": f"*Downtime*\n~{duration_min} min"})

    return {
        "text": f"{emoji} {headline}",
        "attachments": [
            {
                "color": SLACK_COLORS.get(event_type, "#3B82F6"),
                "blocks": [
                    {
                        "type": "header",
                        "text": {"type": "plain_text", "text": f"{emoji} {headline}", "emoji": True},
                    },
                    {"type": "section", "fields": fields},
                    {
                        "type": "context",
                        "elements": [{"type": "mrkdwn", "text": "Uptime Monitor"}],
                    },
                ],
            }
        ],
    }


def send_slack(
    url: str,
    event_type: str,
    name: str,
    address: str,
    severity: str | None = None,
    started_at: datetime | None = None,
    duration_min: int | None = None,
) -> None:
    """Deliver a rich Block Kit alert to a Slack incoming webhook."""
    payload = build_slack_blocks(event_type, name, address, severity, started_at, duration_min)
    response = httpx.post(url, json=payload, timeout=10)
    response.raise_for_status()


def build_alert_message(
    event_type: str,
    name: str,
    address: str,
    severity: str | None = None,
    started_at: datetime | None = None,
    duration_min: int | None = None,
) -> tuple[str, str, str]:
    """Return (subject, text, html) for an alert event."""
    if event_type == "DOWN":
        emoji = "🔴"
        headline = f"{name} is DOWN"
        lead = f"The monitor for {name} is reporting a problem ({severity or 'DOWN'})."
    elif event_type == "UP":
        emoji = "🟢"
        headline = f"{name} has recovered"
        lead = f"The monitor for {name} is back UP."
        if duration_min is not None:
            lead += f" Downtime lasted about {duration_min} minute(s)."
    else:  # TEST
        emoji = "🔔"
        headline = "Test alert"
        lead = f"This is a test notification for {name}. Your channel works!"

    subject = f"{emoji} {headline}"
    when = (started_at or datetime.utcnow()).strftime("%Y-%m-%d %H:%M UTC")
    text = (
        f"{headline}\n\n"
        f"{lead}\n\n"
        f"URL: {address}\n"
        f"Time: {when}\n"
    )
    html = (
        f"<div style=\"font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:480px\">"
        f"<h2 style=\"margin:0 0 8px\">{emoji} {headline}</h2>"
        f"<p style=\"color:#374151;margin:0 0 16px\">{lead}</p>"
        f"<table style=\"font-size:14px;color:#111827\">"
        f"<tr><td style=\"color:#6B7280;padding-right:12px\">URL</td>"
        f"<td><a href=\"{address}\">{address}</a></td></tr>"
        f"<tr><td style=\"color:#6B7280;padding-right:12px\">Time</td><td>{when}</td></tr>"
        f"</table>"
        f"<p style=\"color:#9CA3AF;font-size:12px;margin-top:20px\">Uptime Monitor</p>"
        f"</div>"
    )
    return subject, text, html
