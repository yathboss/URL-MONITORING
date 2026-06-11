from fastapi import APIRouter, HTTPException, status
from typing import Optional
from datetime import datetime

from ..models import URLCreate, URLRead, URLDetail, PingHistoryRead
from .. import database

router = APIRouter()

# Mock data fallback for Phase 2 development (before database is ready)
_mock_urls: dict = {}
_mock_id_counter = 1


@router.get("/urls", response_model=list[URLRead])
async def list_urls():
    """List all monitored URLs."""
    try:
        pool = database.get_pool()
        if pool is None:
            return list(_mock_urls.values())
        
        async with pool.acquire() as conn:
            rows = await conn.fetch("SELECT id, web_address, name, status, created_at FROM urls")
            return [
                URLRead(
                    id=row["id"],
                    web_address=row["web_address"],
                    name=row["name"],
                    status=row["status"],
                    created_at=row["created_at"]
                )
                for row in rows
            ]
    except Exception:
        return list(_mock_urls.values())


@router.post("/urls", response_model=URLRead, status_code=status.HTTP_201_CREATED)
async def create_url(payload: URLCreate):
    """Create a new URL to monitor."""
    global _mock_id_counter
    
    web_address = str(payload.web_address)
    
    # Check for duplicates in mock data
    for url in _mock_urls.values():
        if url.web_address == web_address:
            raise HTTPException(status_code=409, detail="URL already being monitored")
    
    try:
        pool = database.get_pool()
        if pool is not None:
            async with pool.acquire() as conn:
                existing = await conn.fetchval(
                    "SELECT id FROM urls WHERE web_address = $1",
                    web_address
                )
                if existing:
                    raise HTTPException(status_code=409, detail="URL already being monitored")
                
                row = await conn.fetchrow(
                    """INSERT INTO urls (web_address, name, status, created_at)
                       VALUES ($1, $2, 'PENDING', NOW())
                       RETURNING id, web_address, name, status, created_at""",
                    web_address,
                    payload.name
                )
                return URLRead(
                    id=row["id"],
                    web_address=row["web_address"],
                    name=row["name"],
                    status=row["status"],
                    created_at=row["created_at"]
                )
    except HTTPException:
        raise
    except Exception:
        pass
    
    # Fallback to mock data
    url_id = _mock_id_counter
    _mock_id_counter += 1
    
    new_url = URLRead(
        id=url_id,
        web_address=web_address,
        name=payload.name,
        status="PENDING",
        created_at=datetime.now()
    )
    _mock_urls[url_id] = new_url
    return new_url


@router.get("/urls/{url_id}", response_model=URLDetail)
async def get_url_detail(url_id: int):
    """Get URL details with recent ping history."""
    try:
        pool = database.get_pool()
        if pool is not None:
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    "SELECT id, web_address, name, status, created_at FROM urls WHERE id = $1",
                    url_id
                )
                if not row:
                    raise HTTPException(status_code=404, detail="URL not found")
                
                pings = await conn.fetch(
                    """SELECT id, status_code, response_time, checked_at FROM ping_history
                       WHERE url_id = $1 ORDER BY checked_at DESC LIMIT 10""",
                    url_id
                )
                
                return URLDetail(
                    id=row["id"],
                    web_address=row["web_address"],
                    name=row["name"],
                    status=row["status"],
                    created_at=row["created_at"],
                    recent_pings=[
                        PingHistoryRead(
                            id=p["id"],
                            status_code=p["status_code"],
                            response_time=p["response_time"],
                            checked_at=p["checked_at"]
                        )
                        for p in pings
                    ]
                )
    except HTTPException:
        raise
    except Exception:
        pass
    
    # Fallback to mock data
    url = _mock_urls.get(url_id)
    if not url:
        raise HTTPException(status_code=404, detail="URL not found")
    
    return URLDetail(
        id=url.id,
        web_address=url.web_address,
        name=url.name,
        status=url.status,
        created_at=url.created_at,
        recent_pings=[]
    )


@router.delete("/urls/{url_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_url(url_id: int):
    """Delete a monitored URL."""
    try:
        pool = database.get_pool()
        if pool is not None:
            async with pool.acquire() as conn:
                result = await conn.execute("DELETE FROM urls WHERE id = $1", url_id)
                if result == "DELETE 0":
                    raise HTTPException(status_code=404, detail="URL not found")
            return
    except HTTPException:
        raise
    except Exception:
        pass
    
    # Fallback to mock data
    if url_id not in _mock_urls:
        raise HTTPException(status_code=404, detail="URL not found")
    
    del _mock_urls[url_id]
