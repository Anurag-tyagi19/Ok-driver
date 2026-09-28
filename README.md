# OkDriver CCTV Intelligence Platform 🎥

> **Centralized CCTV Monitoring, Real-time Edge AI/ANPR Detection, and Automated Watchlist Alerting Platform.**
> Developed for the Full Stack Developer Intern Assignment.

---

## 📌 Table of Contents
1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [Architecture Overview](#-architecture-overview)
   - [Current Local Architecture](#current-local-architecture)
   - [Scalable Production Architecture (80,000+ Cameras)](#scalable-production-architecture-80000-cameras)
4. [Database Entity-Relationship (ER) Diagram](#-database-entity-relationship-er-diagram)
5. [Key Features](#-key-features)
6. [Camera Heartbeat & Health Lifecycle](#-camera-heartbeat--health-lifecycle)
7. [Authentication & RBAC (Role-Based Access Control)](#-authentication--rbac)
8. [Event Deduplication & Watchlist Matching](#-event-deduplication--watchlist-matching)
9. [Edge AI / ANPR Computer Vision Simulator](#-edge-ai--anpr-computer-vision-simulator)
10. [API Reference](#-api-reference)
11. [WebSocket Real-Time Events](#-websocket-real-time-events)
12. [Local Setup & Run Guide](#-local-setup--run-guide)
13. [Docker Setup Guide](#-docker-setup-guide)
14. [Security & Production Readiness](#-security--production-readiness)
15. [Scalability Blueprint (~80,000 Cameras)](#-scalability-blueprint-80000-cameras)
16. [End-to-End Demo Walkthrough](#-end-to-end-demo-walkthrough)
17. [Limitaions](#known-limitaions)

---

## 🌟 Project Overview

**OkDriver CCTV Intelligence Platform** ek enterprise-grade video surveillance aur automated threat detection system hai. Yeh platform live CCTV camera streams ko monitor karta hai, computer vision (ANPR / License Plate Recognition) detections ingest karta hai, hotlisted vehicles ke against automatic alerts trigger karta hai, aur control-room operators ko zero-latency WebSocket feeds deliver karta hai.

---

## 🛠 Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Leaflet, React-Leaflet, Native WebSockets, CSS3 |
| **Backend** | FastAPI (Python 3.11), Uvicorn (ASGI), AsyncIO, Pydantic v2 |
| **Database** | PostgreSQL 15+, SQLAlchemy 2.0 (ORM), Alembic (Migrations) |
| **Real-Time** | WebSocket Protocol (Broadcast & bidirectional messaging) |
| **Security** | PyJWT (HS256 tokens), RBAC (Admin & Operator roles), CORS |
| **Video Engine**| FastAPI chunked video streaming (MP4 simulation sources) |
| **DevOps** | Docker, Docker Compose, Multi-stage builds |

---

## 🏗 Architecture Overview

### Current Local Architecture

```mermaid
graph TD
    Client["React 18 + Vite (Browser / Control Room)"]
    WS["WebSocket Client (/ws)"]
    HTTP["HTTP REST Client (/api/v1)"]
    Leaflet["Leaflet Map Engine"]

    Client --> WS
    Client --> HTTP
    Client --> Leaflet

    subgraph FastAPI Application
        Router["FastAPI ASGI Server (Uvicorn)"]
        WSManager["WebSocket Connection Manager"]
        HealthWorker["Background Health Checker (30s)"]
        AISim["Background AI / ANPR Simulator"]
        AuthMiddleware["JWT / RBAC Security Layer"]

        HTTP --> Router
        WS --> WSManager
        Router --> AuthMiddleware
    end

    subgraph Database Layer
        Postgres[("PostgreSQL Database")]
        Alembic["Alembic Migrations"]
    end

    Router --> Postgres
    HealthWorker --> Postgres
    HealthWorker -. Broadcast status .-> WSManager
    AISim -. Ingest detection .-> Router
    Router -. Broadcast alert/detection .-> WSManager
    WSManager -. Push live event .-> WS
    Alembic -. Schema control .-> Postgres
```

---

### Scalable Production Architecture (80,000+ Cameras)

Jab system 80,000+ cameras par scale hota hai, to single backend instance aur direct polling bottleneck ban jate hain. Yahan production-grade distributed architecture hai:

```mermaid
graph TD
    subgraph Edge Layer (80,000+ Distributed Cameras)
        Cams["Edge Cameras / RTSP Feeds"]
        EdgeAI["Edge Video Analytics (YOLOv8 + ByteTrack / DeepStream)"]
        Cams --> EdgeAI
    end

    subgraph Ingestion & Message Bus Layer
        Kafka["Apache Kafka / Redpanda Cluster (Event Stream)"]
        EdgeAI -- Ingest ANPR Detections --> Kafka
        EdgeAI -- Heartbeats (UDP/gRPC) --> IngressGateway["Ingress API Gateway (Kong / Envoy)"]
    end

    subgraph Service Mesh (Kubernetes Cluster)
        IngressGateway --> BackendPods["FastAPI Stateless Worker Pods (HPA)"]
        Kafka --> IngestionWorkers["Detection Consumers & Deduplication Workers"]
        IngestionWorkers --> RedisCluster["Redis Cluster (Pub/Sub + Cache + Dedup Window)"]
        IngestionWorkers --> PostgresCluster[("PostgreSQL Citus Distributed Cluster / TimescaleDB")]
    end

    subgraph Real-Time Push Gateway
        RedisCluster -- Pub/Sub Subscriptions --> WSPods["Distributed WebSocket Pods"]
        WSPods -- Sticky Sessions / Socket.io --> Operators["Control Room Frontend Operators"]
    end
```

---

## 🗄 Database Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    CAMERAS ||--o{ DETECTIONS : "records"
    CAMERAS ||--o{ ALERTS : "triggers"
    CAMERAS ||--o{ AUDIT_LOGS : "logs"
    DETECTIONS ||--o{ ALERTS : "generates"

    CAMERAS {
        int id PK
        string camera_code UK "Unique Identifier"
        string name "Camera Name"
        string department "Traffic / Police / Toll"
        float latitude
        float longitude
        string camera_type "CCTV / PTZ / IP"
        string source_protocol "FILE / RTSP / HLS"
        string stream_url
        string status "ONLINE / DEGRADED / OFFLINE"
        string zone
        datetime last_heartbeat
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    DETECTIONS {
        int id PK
        int camera_id FK
        string event_type "ANPR / INTRUSION"
        string vehicle_number "License Plate"
        float confidence "0.0 - 1.0"
        datetime timestamp
    }

    WATCHLIST {
        int id PK
        string identifier UK "Vehicle Plate / Face ID"
        string entity_type "VEHICLE / PERSON"
        string description
        boolean is_active
        datetime created_at
    }

    ALERTS {
        int id PK
        int detection_id FK
        int camera_id FK
        string identifier "Vehicle Plate"
        string alert_type "WATCHLIST_MATCH"
        float confidence
        string status "ACTIVE / ACKNOWLEDGED / RESOLVED"
        datetime created_at
    }

    AUDIT_LOGS {
        int id PK
        int camera_id FK
        string event "CAMERA_CREATED / STATUS_ONLINE / etc"
        string details "Context information"
        datetime created_at
    }
```

---

## ✨ Key Features

1. **Centralized Camera Registry**
   - Full CRUD (Create, Read, Update, Soft-Delete) for cameras.
   - GPS coordinate mapping for interactive GIS rendering.
   - Filter by status (`ONLINE`, `DEGRADED`, `OFFLINE`), department, and camera type.

2. **Real-time Camera Health Monitoring & Heartbeat**
   - Every camera maintains a `last_heartbeat` timestamp.
   - Heartbeat arrives $\to$ camera immediately marked `ONLINE`.
   - Heartbeat stops for $>30\text{s}$ $\to$ camera transitions to `DEGRADED`.
   - Heartbeat stops for $>90\text{s}$ $\to$ camera transitions to `OFFLINE`.
   - Background worker broadcasts status updates over WebSockets without page reload.

3. **Live Video Streaming Engine**
   - Serves chunked video streams via FastAPI range requests.
   - Live simulated monitoring feeds in control-room multi-screen view.

4. **Edge AI / ANPR Simulator**
   - Simulates Edge Computer Vision inference stream.
   - Ingests vehicle license plates with realistic confidence scores (85%–99%).

5. **Automated Watchlist Matching & Instant Alerting**
   - Ingested detection is matched against active watchlist database.
   - If match found, instant `ACTIVE` alert is generated.
   - Real-time notification delivered to operators through WebSocket.

6. **Event Deduplication (Anti-Spam Window)**
   - 60-second sliding time window prevents identical vehicle sightings on the same camera from generating alert floods.

7. **Entity Movement Tracking on Interactive Map**
   - Search any vehicle number (e.g. `DL01AB1234`).
   - Visualizes sequential movement path across cameras with historical timestamps.

8. **Audit Trail & Observability**
   - Records every lifecycle event: `CAMERA_CREATED`, `CAMERA_UPDATED`, `CAMERA_DISABLED`, `STATUS_ONLINE`, `STATUS_DEGRADED`, `STATUS_OFFLINE`.
   - Per-camera audit modal in the UI and system-wide audit API.

9. **Role-Based Access Control (RBAC)**
   - **Admin Role**: Full access (Create/Edit/Disable cameras, manage watchlist, view all logs).
   - **Operator Role**: Read-only monitoring, vehicle tracking, alert acknowledgement/resolution.

---

## 💓 Camera Heartbeat & Health Lifecycle

```
[Camera Heartbeat Event]
          │
          ▼
   POST /heartbeat
          │
          ▼
┌──────────────────┐
│      ONLINE      │ ◄── Heartbeat timestamp <= 30 seconds
└────────┬─────────┘
         │ (Heartbeat stops for > 30s)
         ▼
┌──────────────────┐
│     DEGRADED     │ ◄── Heartbeat timestamp between 30s and 90s
└────────┬─────────┘
         │ (Heartbeat stops for > 90s)
         ▼
┌──────────────────┐
│     OFFLINE      │ ◄── Heartbeat timestamp > 90s or None
└──────────────────┘
```

### Running the Heartbeat Simulator
A standalone demo simulator is included in the project:
```bash
# Navigate to backend folder
cd backend

# Run demo lifecycle simulation (ONLINE -> DEGRADED -> OFFLINE -> ONLINE)
python -m app.services.heartbeat_simulator demo

# Or run continuous heartbeat mode (keeps all cameras ONLINE)
python -m app.services.heartbeat_simulator continuous
```

---

## 🔐 Authentication & RBAC

The platform includes JWT-based authentication supporting two primary roles:

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full access: Camera CRUD, Watchlist CRUD, Heartbeat, Alert resolution |
| **Operator**| `operator`| `operator123`| Read-only monitoring: Live streams, Entity search, Alert acknowledgement |

> **Interactive Role Switcher**: In the frontend header, click the **"Switch to Operator / Admin"** button to instantly test role-gated UI permissions!

---

## ⚡ Event Deduplication & Watchlist Matching

When an ANPR detection is ingested (`POST /api/v1/detections/`):
1. The detection record is persisted in PostgreSQL.
2. The vehicle plate is checked against active entries in the `watchlist` table.
3. If an active match is identified:
   - A deduplication check queries whether an alert was already generated for this exact `camera_id` and `vehicle_number` within the last **60 seconds**.
   - If a recent alert exists, creation is skipped to prevent alert storms.
   - If no recent alert exists, a new `Alert` is saved and broadcast over WebSockets.

---

## 📡 API Reference

Interactive Swagger documentation is available at `http://127.0.0.1:8000/docs`.

### Authentication
- `POST /api/v1/auth/login` — Authenticate and receive JWT access token.
- `GET /api/v1/auth/me` — Retrieve profile & role of current user.

### Cameras
- `GET /api/v1/cameras/` — List all active cameras.
- `POST /api/v1/cameras/` — Create new camera (Admin only).
- `GET /api/v1/cameras/{id}` — Get single camera details.
- `PUT /api/v1/cameras/{id}` — Update camera attributes (Admin only).
- `DELETE /api/v1/cameras/{id}` — Soft-delete / disable camera (Admin only).
- `POST /api/v1/cameras/{id}/heartbeat` — Ingest camera heartbeat.
- `GET /api/v1/cameras/{id}/audit` — Get audit trail for a specific camera.

### Detections & Tracking
- `POST /api/v1/detections/` — Ingest AI detection event.
- `GET /api/v1/detections/` — Get recent 50 detections.
- `GET /api/v1/detections/search/{vehicle_number}` — Vehicle movement route tracking.

### Watchlist
- `GET /api/v1/watchlist/` — List all watchlist entries.
- `POST /api/v1/watchlist/` — Add new entity to watchlist (Admin only).
- `PATCH /api/v1/watchlist/{id}/deactivate` — Deactivate watchlist item.

### Alerts
- `GET /api/v1/alerts/` — List all generated alerts.
- `GET /api/v1/alerts/active` — List only active alerts.
- `PATCH /api/v1/alerts/{id}/acknowledge` — Acknowledge alert.
- `PATCH /api/v1/alerts/{id}/resolve` — Resolve alert.

### Audit Logs
- `GET /api/v1/audit/` — List system-wide audit history.
- `GET /api/v1/audit/{camera_id}` — List audit history for camera.

---

## 🔌 WebSocket Real-Time Events

Connect to: `ws://127.0.0.1:8000/ws`

### Event Types:
1. **`DETECTION`**
```json
{
  "type": "DETECTION",
  "id": 142,
  "camera_id": 1,
  "camera_code": "CAM-001",
  "camera_name": "Main Gate",
  "event_type": "ANPR",
  "vehicle_number": "DL01AB1234",
  "confidence": 0.96,
  "timestamp": "2026-09-27T13:45:00.000Z"
}
```

2. **`WATCHLIST_ALERT`**
```json
{
  "type": "WATCHLIST_ALERT",
  "alert_id": 8,
  "camera_id": 1,
  "camera_name": "Main Gate",
  "identifier": "DL01AB1234",
  "alert_type": "WATCHLIST_MATCH",
  "confidence": 0.96,
  "status": "ACTIVE",
  "created_at": "2026-09-27T13:45:00.120Z"
}
```

3. **`CAMERA_HEALTH`**
```json
{
  "type": "CAMERA_HEALTH",
  "camera_id": 1,
  "camera_code": "CAM-001",
  "status": "ONLINE",
  "last_heartbeat": "2026-09-27T13:45:00.000Z"
}
```

---

## 🚀 Local Setup & Run Guide

### 1. Prerequisites
- Python 3.11+
- Node.js 18+ & npm
- PostgreSQL running locally (Default: `postgresql://postgres:1234@localhost:5432/okdriver`)

### 2. Backend Setup
```bash
# Clone the repository
git clone <repo-url>
cd okdriver-cctv/backend

# Install Python dependencies
pip install -r requirements.txt

# Run Alembic Database Migrations
python -m alembic upgrade head

# Start FastAPI ASGI server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API Documentation will be live at: `http://127.0.0.1:8000/docs`

### 3. Frontend Setup
```bash
cd ../frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
Dashboard will be available at: `http://localhost:5173`

---

## 🐳 Docker Setup Guide

Full stack deployment with Docker Compose:

```bash
# Build and run PostgreSQL, FastAPI, and React in containers
docker-compose up --build
```

- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:8000`
- **PostgreSQL**: `localhost:5432`

---

## 🔒 Security & Production Readiness

1. **Environment Secrets Isolation**:
   - Database credentials and JWT keys are strictly loaded via `.env`.
   - `.env` is registered in `.gitignore` to prevent any credential leaks to VCS.
2. **CORS Hardening**:
   - Strict origin restrictions (`http://localhost:5173`, `http://127.0.0.1:5173`) enabled on FastAPI backend.
3. **Transport Security (TLS / HTTPS)**:
   - In production, reverse proxy (Nginx / Cloudflare) terminates TLS with automated SSL certificates.
4. **Rate Limiting**:
   - Recommended deployment of Redis-backed token bucket rate limiter (e.g. `slowapi`) on `/heartbeat` and `/detections` to prevent DDoS attacks.

---

## 📈 Scalability Blueprint (~80,000 Cameras)

Handling **80,000 concurrent cameras** requires specific architectural considerations:

1. **Heartbeat Load**:
   - 80,000 cameras sending a heartbeat every 15 seconds $\approx 5,333\text{ req/sec}$.
   - **Solution**: Replace HTTP heartbeats with lightweight UDP or gRPC pings. Store ephemeral heartbeat timestamps in an in-memory **Redis Sorted Set** with TTL instead of writing directly to PostgreSQL disk on every ping.

2. **Detection Event Ingestion**:
   - If 10% of cameras detect a vehicle every second $\approx 8,000\text{ detections/sec}$.
   - **Solution**: Edge nodes publish events directly to an **Apache Kafka** cluster partitioned by `camera_id` or `geohash`. Dedicated consumer microservices batch-insert events using PostgreSQL `COPY` or store time-series in TimescaleDB.

3. **WebSocket Scaling (Redis Pub/Sub)**:
   - A single FastAPI process cannot maintain 10,000+ open WebSocket connections.
   - **Solution**: Deploy stateless WebSocket server pods behind a load balancer with sticky sessions. Use **Redis Pub/Sub** as a message bus: when any worker pod generates an alert, it publishes to Redis channel `alerts`, and all WebSocket pods receive and push to their connected operators.

---

## 🧪 End-to-End Demo Walkthrough

Follow these steps during evaluation to verify all functionality:

1. **Camera Registry**:
   - Open `http://localhost:5173`.
   - Click **"+ Add Camera"** $\to$ enter `CAM-DEMO-1`, Latitude `28.6139`, Longitude `77.2090`.
   - Verify camera appears in registry and on Leaflet map.

2. **Heartbeat & Status**:
   - Camera starts in `OFFLINE`.
   - Click **"❤️ Heartbeat"** on the camera card $\to$ status turns green `ONLINE` immediately.
   - Observe real-time event appearing in the Real-Time Event Feed panel.

3. **Audit History**:
   - Click **"📜 Audit"** on the camera card $\to$ modal opens showing `CAMERA_CREATED`, `STATUS_ONLINE` with timestamps.

4. **Watchlist Match & Alert**:
   - Add vehicle plate `DL01AB1234` to the Watchlist section.
   - Within 10 seconds, background AI simulator generates a detection for `DL01AB1234`.
   - An alert `WATCHLIST_MATCH` triggers instantly via WebSocket and appears in the Alerts section without page refresh.

5. **Alert Workflow**:
   - Click **"Acknowledge"** $\to$ status changes to `ACKNOWLEDGED`.
   - Click **"Resolve"** $\to$ status changes to `RESOLVED`.

6. **Vehicle Route Search**:
   - In Search Entity section, type `DL01AB1234` and click **"Search"**.
   - View chronological camera hops with timestamps and map points!

7. **RBAC Testing**:
   - In the header, click **"Switch to Operator"**.
   - Notice that administrative actions (`+ Add Camera`, `Edit`, `Disable`) are automatically protected/hidden.

⚠️ Known Limitations

The current implementation is a functional prototype intended to demonstrate the assignment's end-to-end workflow.

1. Representative Video Sources

The demonstration uses MP4 video files rather than physical RTSP/ONVIF CCTV cameras.

The video layer can later be replaced with an RTSP/ONVIF adapter and WebRTC/HLS pipeline.

2. Simulated AI Inference

ANPR detection events are generated by a simulator.

A production deployment would replace the simulator with a real computer-vision inference service.

3. Single-Instance WebSocket Manager

The current WebSocket manager operates within the backend process.

For multi-instance deployment, Redis Pub/Sub or another shared messaging system would be required.

4. Prototype Database Architecture

PostgreSQL is used as the application database.

At very high event volumes, additional partitioning, indexing, retention policies and potentially time-series database optimization would be required.

5. Production Authentication

The submitted prototype focuses primarily on the CCTV monitoring and intelligence workflow.

Production deployment should include comprehensive authentication, authorization, RBAC and secure session management.

6. Video Storage

The current demonstration serves representative video files through the backend.

A production deployment should use dedicated video/object storage and streaming infrastructure.

7. Scale

The current implementation is designed as a functional prototype rather than a production deployment for tens of thousands of simultaneous cameras.