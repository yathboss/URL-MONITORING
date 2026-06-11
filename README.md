# Uptime Monitor (backend)

Backend scaffold for the Uptime Monitor application. The FastAPI app lives in `backend/`.

## Local Setup

On Windows, use `uv` to create the Python environment if `python` is not available on PATH.

```powershell
Set-Location c:\url_Monitoring\uptime-monitor\backend
uv venv .venv --python 3.12
uv pip install -r requirements.txt -p .venv\Scripts\python.exe
Copy-Item .env.example .env
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```


