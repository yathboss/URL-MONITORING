from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.models import AlertChannelCreate
from app.worker.notifications import SLACK_COLORS, build_slack_blocks


def _fields(payload):
    return {f["text"].split("\n")[0] for f in payload["attachments"][0]["blocks"][1]["fields"]}


def test_down_payload_is_red_with_severity():
    payload = build_slack_blocks("DOWN", "API", "https://api.test", severity="HIGH")
    attachment = payload["attachments"][0]
    assert attachment["color"] == SLACK_COLORS["DOWN"] == "#E24B4A"
    assert "API is DOWN" in payload["text"]
    assert "API is DOWN" in attachment["blocks"][0]["text"]["text"]
    assert "*Severity*" in _fields(payload)


def test_up_payload_is_green_with_downtime():
    payload = build_slack_blocks("UP", "API", "https://api.test", duration_min=7)
    assert payload["attachments"][0]["color"] == "#2EB67D"
    fields = _fields(payload)
    assert "*Downtime*" in fields
    assert "*Severity*" not in fields


def test_up_without_duration_has_no_downtime_field():
    payload = build_slack_blocks("UP", "API", "https://api.test")
    assert "*Downtime*" not in _fields(payload)


def test_test_payload_is_blue_and_plain():
    payload = build_slack_blocks("TEST", "My channel", "https://hooks.slack.com/services/x")
    assert payload["attachments"][0]["color"] == "#3B82F6"
    assert "*Severity*" not in _fields(payload)
    assert payload["text"].startswith("🔔")


def test_time_field_uses_started_at():
    started = datetime(2026, 7, 13, 9, 30, tzinfo=timezone.utc)
    payload = build_slack_blocks("DOWN", "API", "https://api.test", started_at=started)
    field_texts = [f["text"] for f in payload["attachments"][0]["blocks"][1]["fields"]]
    assert any("2026-07-13 09:30 UTC" in t for t in field_texts)


def test_slack_channel_accepts_hooks_url_and_strips_extras():
    channel = AlertChannelCreate(
        channel_type="SLACK",
        name="Ops",
        destination="https://hooks.slack.com/services/T1/B1/xyz",
        headers={"X-API-Key": "should-be-dropped"},
        http_method="GET",
    )
    assert channel.headers == {}
    assert channel.http_method == "POST"


def test_slack_channel_rejects_non_slack_urls():
    with pytest.raises(ValidationError):
        AlertChannelCreate(channel_type="SLACK", name="Ops", destination="https://example.com/hook")
    with pytest.raises(ValidationError):
        AlertChannelCreate(
            channel_type="SLACK", name="Ops", destination="http://hooks.slack.com/services/x"
        )


def test_unknown_channel_type_still_rejected():
    with pytest.raises(ValidationError):
        AlertChannelCreate(channel_type="TEAMS", name="x", destination="https://x.test")
