# Smart Door Access Control System

IoT-based smart door system with face recognition, PIN management, real-time WebSocket dashboard, and Raspberry Pi integration.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                     Cloud / Server                       │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐   ┌───────────┐  │
│  │  React SPA   │    │  FastAPI     │   │ PostgreSQL│  │
│  │  (Nginx)     │◄──►│  Backend     │◄──►│ Database  │  │
│  │  Port 80     │    │  Port 8000   │   └───────────┘  │
│  └──────────────┘    └──────┬───────┘                  │
│                             │ WebSocket /ws/dashboard   │
│                             │ HTTP /api/*               │
└─────────────────────────────┼───────────────────────────┘
                              │ HTTP (LAN / VPN)
                    ┌─────────▼──────────┐
                    │   Raspberry Pi     │
                    │   (Port 5000)      │
                    │                   │
                    │  ┌─────────────┐  │
                    │  │ Pi Camera   │  │
                    │  │ Face Recog  │  │
                    │  └─────────────┘  │
                    │         │ UART    │
                    │  ┌──────▼──────┐  │
                    │  │  STM32 MCU  │  │
                    │  │  Keypad PIN │  │
                    │  │  Door Lock  │  │
                    │  │  Buzzer     │  │
                    └──└─────────────┘──┘
```

---

## Quick Start — Local Development

### 1. Backend

```bash
cd web_app/backend

# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env .env.local
# Edit .env.local with your settings

# Run database migrations
alembic upgrade head

# Start development server (auto-reload)
uvicorn main:app --reload --port 8000
```

API docs available at: http://localhost:8000/api/docs

### 2. Frontend

```bash
cd web_app/frontend

# Install dependencies
npm install

# Start dev server (proxies /api and /ws to localhost:8000)
npm run dev
```

Dashboard available at: http://localhost:5173

---

## Docker Deployment (Production)

### Prerequisites
- Docker Engine 24+
- Docker Compose v2+

### Steps

```bash
# 1. Copy environment file
cp deploy/.env.production .env

# 2. Fill in all secrets in .env:
#    - SECRET_KEY (generate: openssl rand -hex 32)
#    - POSTGRES_PASSWORD
#    - REDIS_PASSWORD
#    - PI_API_KEY
#    - CLOUDINARY_* or AWS_* credentials
#    - TELEGRAM_BOT_TOKEN (optional)

# 3. Build and start all services
docker-compose -f deploy/docker-compose.yml up -d --build

# 4. Check all services are healthy
docker-compose -f deploy/docker-compose.yml ps

# 5. View backend logs
docker-compose -f deploy/docker-compose.yml logs -f backend
```

### Services

| Service    | Port | Description               |
|------------|------|---------------------------|
| frontend   | 80   | React dashboard via Nginx |
| backend    | 8000 | FastAPI (internal)        |
| postgres   | 5432 | PostgreSQL database       |
| redis      | 6379 | Redis cache               |

---

## Environment Variables

### Backend `.env`

| Variable                    | Description                             | Required |
|-----------------------------|-----------------------------------------|----------|
| `SECRET_KEY`                | JWT signing secret (min 32 chars)       | ✅       |
| `DATABASE_URL`              | SQLAlchemy DB connection string         | ✅       |
| `PI_API_URL`                | Raspberry Pi HTTP API URL               | ✅       |
| `PI_API_KEY`                | Shared secret for Pi authentication     | ✅       |
| `STORAGE_PROVIDER`          | `cloudinary` or `s3`                    | ✅       |
| `CLOUDINARY_CLOUD_NAME`     | Cloudinary cloud name                   | ⚠️       |
| `CLOUDINARY_API_KEY`        | Cloudinary API key                      | ⚠️       |
| `CLOUDINARY_API_SECRET`     | Cloudinary API secret                   | ⚠️       |
| `AWS_ACCESS_KEY_ID`         | AWS access key (if using S3)            | ⚠️       |
| `AWS_SECRET_ACCESS_KEY`     | AWS secret key                          | ⚠️       |
| `AWS_BUCKET_NAME`           | S3 bucket name                          | ⚠️       |
| `TELEGRAM_BOT_TOKEN`        | Telegram bot token for alerts           | Optional |
| `TELEGRAM_CHAT_ID`          | Telegram chat ID                        | Optional |
| `FIREBASE_CREDENTIALS_PATH` | Path to Firebase service account JSON  | Optional |

---

## Database Migration

```bash
cd web_app/backend

# Apply all pending migrations
alembic upgrade head

# Check current version
alembic current

# Create a new migration after model changes
alembic revision --autogenerate -m "add new field"

# Rollback one migration
alembic downgrade -1

# Rollback all
alembic downgrade base
```

---

## Raspberry Pi Integration Guide

### Pi Side Requirements

The Raspberry Pi must run a simple HTTP server (Flask/FastAPI) on port 5000 that accepts:

```
POST /alarm/stop          ← Stop buzzer/alarm
POST /door/lock           ← Lock door relay
POST /door/unlock         ← Unlock door relay
POST /pin/update          ← Receive new PIN, forward via UART to STM32
GET  /status              ← Return system status JSON
```

All Pi endpoints must validate the `X-Api-Key` header against `PI_API_KEY`.

### Sending Events from Pi to Backend

```python
import requests

BACKEND_URL = "http://your-server-ip/api"
PI_API_KEY = "your-pi-secret-key"

def send_event(event_type, image_url=None, payload=None):
    requests.post(
        f"{BACKEND_URL}/events",
        headers={"X-Pi-Api-Key": PI_API_KEY},
        json={
            "type": event_type,       # "motion_detected", "face_recognized", etc.
            "image_url": image_url,   # Optional cloud URL of snapshot
            "payload": payload or {}, # Extra data dict
        },
        timeout=5,
    )

# Example usage:
send_event("motion_detected", payload={"zone": "front_door"})
send_event("face_recognized", image_url="https://...", payload={"resident_id": 3, "score": 0.94})
send_event("alarm_triggered", payload={"reason": "unknown_face"})
```

### STM32 UART PIN Update Protocol

When backend calls `POST /pi/update` with `{"pin": "1234"}`, Pi sends via UART:

```
SET_PIN:1234\n
```

STM32 responds with:
```
PIN_OK\n    ← success
PIN_ERR\n   ← failure
```

### Event Types Reference

| Event Type        | Trigger                        | Sends Notification |
|-------------------|--------------------------------|--------------------|
| `motion_detected` | PIR sensor triggered           | No                 |
| `face_recognized` | Known face verified            | No                 |
| `face_unknown`    | Face not in database           | ✅ Telegram + FCM  |
| `door_opened`     | Door unlocked and opened       | No                 |
| `door_closed`     | Door closed                    | No                 |
| `door_forced`     | Door opened without auth       | ✅ Telegram + FCM  |
| `alarm_triggered` | Security alarm activated       | ✅ Telegram + FCM  |
| `alarm_stopped`   | Alarm manually stopped         | No                 |
| `pin_correct`     | Correct PIN entered on keypad  | No                 |
| `pin_wrong`       | Wrong PIN entered              | No                 |
| `system_online`   | Pi boots up                    | No                 |
| `system_offline`  | Pi shutting down               | No                 |

---

## Image Cleanup Cron Job

```bash
# Run nightly at 3 AM
0 3 * * * cd /app && python cloud/cleanup_job.py >> /var/log/smartdoor_cleanup.log 2>&1
```

---

## Default Credentials

| Role  | Username | Password   |
|-------|----------|------------|
| Admin | `admin`  | `admin123` |

⚠️ **Change immediately after first login via Settings → Change Password**

---

## Security Checklist (Production)

- [ ] Change `SECRET_KEY` to a random 64-char string
- [ ] Change default admin password
- [ ] Change `PI_API_KEY` to a strong random string
- [ ] Remove port `5432` and `6379` from docker-compose (internal only)
- [ ] Set up SSL/TLS certificate (Let's Encrypt)
- [ ] Restrict `CORS_ORIGINS` to your domain only
- [ ] Enable firewall — only expose port 80/443
- [ ] Set up database backups via `database/backup_script.sh`
