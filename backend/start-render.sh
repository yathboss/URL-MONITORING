#!/bin/sh
# All-in-one entrypoint for free hosting (Render free web service): runs the
# schema init, Celery worker + beat in the background, and the API in front.
set -e

python init_db.py

celery -A app.worker.celery_app worker --loglevel=info --pool=gevent \
  --concurrency="${CELERY_CONCURRENCY:-20}" &
celery -A app.worker.celery_app beat --loglevel=info \
  --schedule=/tmp/celerybeat-schedule &

# Free instances sleep after 15 min without inbound traffic, which would stop
# the monitors. Ping our own public URL so the service stays awake.
if [ -n "$RENDER_EXTERNAL_URL" ]; then
  python -c "
import time, urllib.request
while True:
    time.sleep(600)
    try:
        urllib.request.urlopen('$RENDER_EXTERNAL_URL/healthz', timeout=30).read()
    except Exception as exc:
        print('keepalive ping failed:', exc, flush=True)
" &
fi

exec python -m uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
