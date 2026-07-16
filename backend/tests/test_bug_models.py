import pytest
from pydantic import ValidationError

from app.models import BugReportCreate, BugReportUpdate


def test_create_defaults_to_medium_open():
    bug = BugReportCreate(title="Broken chart", description="Latency chart is empty")
    assert bug.severity == "MEDIUM"
    assert bug.area is None


def test_create_accepts_valid_severities():
    for severity in ("LOW", "MEDIUM", "HIGH"):
        bug = BugReportCreate(title="t", description="d", severity=severity)
        assert bug.severity == severity


def test_create_rejects_bad_severity():
    with pytest.raises(ValidationError):
        BugReportCreate(title="t", description="d", severity="CRITICAL")


def test_create_rejects_empty_title_and_long_fields():
    with pytest.raises(ValidationError):
        BugReportCreate(title="", description="d")
    with pytest.raises(ValidationError):
        BugReportCreate(title="x" * 201, description="d")
    with pytest.raises(ValidationError):
        BugReportCreate(title="t", description="x" * 5001)
    with pytest.raises(ValidationError):
        BugReportCreate(title="t", description="d", area="x" * 51)


def test_update_accepts_workflow_statuses():
    for st in ("OPEN", "IN_PROGRESS", "RESOLVED"):
        assert BugReportUpdate(status=st).status == st


def test_update_rejects_unknown_status():
    with pytest.raises(ValidationError):
        BugReportUpdate(status="CLOSED")
    with pytest.raises(ValidationError):
        BugReportUpdate(status="open")
