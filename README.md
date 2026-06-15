# 🟢 Real-Time URL Uptime Monitor

A highly responsive, real-time application designed to monitor the uptime and latency of critical web services and APIs. 

If a tracked website goes down or its response time spikes, the background workers instantly detect the failure and stream the status change directly to the React dashboard without requiring a page refresh.

## 🏗️ Technology Stack

The project is built around a continuous, real-time data loop across 5 core technologies:

*   **Frontend UI:** React, TypeScript, Vite, Recharts
*   **REST API & WebSockets:** Python, FastAPI
*   **Background Workers:** Celery (Beat Scheduler & Worker)
*   **Message Broker:** Redis (Pub/Sub)
*   **Database:** PostgreSQL (asyncpg)

## 📡 Architecture (How Data Flows)

1. **React** sends a new URL to **FastAPI** on Port 8000.
2. **FastAPI** saves the URL permanently in **PostgreSQL** on Port 5432.
3. Every 30 seconds, **Celery Beat** queries the database and drops a ping instruction into **Redis** on Port 6379.
4. The **Celery Worker** pulls the instruction from Redis, physically pings the target website via HTTP, records the latency, saves it back to PostgreSQL, and Publishes the final result to a Redis channel.
5. **FastAPI** listens to the Redis channel and instantly shoots the payload over a permanent **WebSocket** connection back to the **React** dashboard.

## 🚀 Local Setup Instructions

To run this project locally, you must have **PostgreSQL** and **Redis** (or Memurai on Windows) installed and running on your machine.

### 1. Start the Database and Message Broker
Ensure PostgreSQL is running on `localhost:5432` with the credentials configured in the `.env` file (Default: `postgres:postgres`).
Ensure Redis is running on `localhost:6379`.

### 2. Start the FastAPI Backend
Open Terminal 1:
```bash
cd backend
python -m venv .venv
# Activate the virtual environment
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 3. Start the Celery Worker
Open Terminal 2:
```bash
cd backend
# Activate the virtual environment
celery -A app.worker.celery_app worker --loglevel=info
```

### 4. Start the Celery Beat Scheduler
Open Terminal 3:
```bash
cd backend
# Activate the virtual environment
celery -A app.worker.celery_app beat --loglevel=info
```

### 5. Start the React Frontend
Open Terminal 4:
```bash
cd frontend
npm install
npm run dev
```

Navigate to `http://localhost:5173` to view the live dashboard!
