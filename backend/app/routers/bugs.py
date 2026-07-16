from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from ..auth import get_current_user, require_admin
from ..database import get_connection
from ..models import BugReportCreate, BugReportRead, BugReportUpdate, UserRead

router = APIRouter(tags=["bugs"])

_BUG_SELECT = """
    SELECT b.id, b.title, b.description, b.severity, b.area, b.status,
           b.created_at, b.updated_at,
           u.full_name AS reporter_name, u.email AS reporter_email
    FROM bug_reports b
    LEFT JOIN users u ON u.id = b.user_id
"""


@router.post("/bugs", response_model=BugReportRead, status_code=status.HTTP_201_CREATED)
async def submit_bug_report(
    payload: BugReportCreate,
    current_user: Annotated[UserRead, Depends(get_current_user)],
) -> BugReportRead:
    """Any signed-in user can flag a bug; the reporter comes from the JWT."""
    async with get_connection() as conn:
        row = await conn.fetchrow(
            """
            INSERT INTO bug_reports (user_id, title, description, severity, area)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, title, description, severity, area, status, created_at, updated_at
            """,
            current_user.id,
            payload.title.strip(),
            payload.description.strip(),
            payload.severity,
            payload.area,
        )
    data = dict(row)
    data["reporter_name"] = current_user.full_name
    data["reporter_email"] = current_user.email
    return BugReportRead(**data)


@router.get("/bugs", response_model=list[BugReportRead])
async def list_bug_reports(
    current_user: Annotated[UserRead, Depends(get_current_user)],
) -> list[BugReportRead]:
    """Admins see every report (for triage); other users see only their own."""
    async with get_connection() as conn:
        if current_user.role == "admin":
            rows = await conn.fetch(_BUG_SELECT + " ORDER BY b.created_at DESC LIMIT 200")
        else:
            rows = await conn.fetch(
                _BUG_SELECT + " WHERE b.user_id = $1 ORDER BY b.created_at DESC LIMIT 200",
                current_user.id,
            )
    return [BugReportRead(**dict(row)) for row in rows]


@router.patch("/bugs/{bug_id}", response_model=BugReportRead)
async def update_bug_report(
    bug_id: int,
    payload: BugReportUpdate,
    current_user: Annotated[UserRead, Depends(require_admin)],
) -> BugReportRead:
    """Admin triage: move a report through OPEN -> IN_PROGRESS -> RESOLVED."""
    async with get_connection() as conn:
        row = await conn.fetchrow(
            "UPDATE bug_reports SET status = $1 WHERE id = $2 RETURNING id",
            payload.status,
            bug_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="Bug report not found")
        full = await conn.fetchrow(_BUG_SELECT + " WHERE b.id = $1", bug_id)
    return BugReportRead(**dict(full))


@router.delete("/bugs/{bug_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_bug_report(
    bug_id: int,
    current_user: Annotated[UserRead, Depends(require_admin)],
) -> None:
    async with get_connection() as conn:
        result = await conn.execute("DELETE FROM bug_reports WHERE id = $1", bug_id)
    if result.endswith("0"):
        raise HTTPException(status_code=404, detail="Bug report not found")
